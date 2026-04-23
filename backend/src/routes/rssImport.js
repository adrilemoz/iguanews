/**
 * ⚠️  ARQUIVO DEPRECADO — NÃO MONTAR ESTE ROUTER EM server.js
 * ─────────────────────────────────────────────────────────────
 * Este arquivo contém rotas RSS que foram substituídas por rssAdmin.js.
 * Ele NUNCA foi montado em server.js e pode ser removido com segurança.
 *
 * Histórico:
 *  - As rotas CRUD de fontes (/fontes, /fontes/:id) estão em rssAdmin.js
 *  - A rota de importação (/fontes/:id/importar) está em rssAdmin.js
 *  - O parser nativo (fetchFeed + parseRssXml) foi substituído pelo
 *    rss-parser centralizado em services/rssImporter.js
 *
 * As exportações abaixo (importarFonte, RSS_FONTES_PADRAO) são mantidas
 * apenas por compatibilidade retroativa e não devem ser usadas em código novo.
 *
 * Use:
 *  - routes/rssAdmin.js    → para rotas HTTP admin de RSS
 *  - services/rssImporter.js → para importação programática
 * ─────────────────────────────────────────────────────────────
 */
import { Router } from 'express'
import RssFonte   from '../models/RssFonte.js'
import { importarFonte }  from '../services/rssImporter.js'   // ✅ serviço centralizado
import { autenticar }         from '../middleware/auth.js'
import { verificarPermissao } from '../middleware/verificarPermissao.js'
import { logger }             from '../utils/logger.js'

export { importarFonte }  // mantém a exportação nomeada para compatibilidade retroativa

const router = Router()

// ─── Fontes RSS padrão pré-cadastradas (exceto grupo Globo) ──────────────────
export const RSS_FONTES_PADRAO = [
  {
    nome: 'Agência Brasil (EBC)',
    url:  'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.rss',
  },
  {
    nome: 'Folha de S.Paulo – Em Cima da Hora',
    url:  'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml',
  },
  {
    nome: 'CNN Brasil',
    url:  'https://www.cnnbrasil.com.br/feed/',
  },
  {
    nome: 'UOL Notícias',
    url:  'https://rss.uol.com.br/feed/noticias.xml',
  },
  {
    nome: 'Metrópoles',
    url:  'https://www.metropoles.com/feed/',
  },
  {
    nome: 'Correio Braziliense',
    url:  'https://www.correiobraziliense.com.br/arc/outboundfeeds/rss/',
  },
]

// ─── Parser RSS/Atom nativo (sem deps externas) — exclusivo para /testar-url ─

/** Remove tags HTML e normaliza espaços */
function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

/** Desencapsula CDATA */
function decodeCdata(str = '') {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

/** Extrai o conteúdo text de uma tag XML */
function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m  = xml.match(re)
  return m ? decodeCdata(m[1]).trim() : ''
}

/** Extrai o valor de um atributo de uma tag auto-fechada ou com conteúdo */
function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*?\\s${attr}=["']([^"']+)["'][^>]*(?:/)?>`, 'i')
  const m  = xml.match(re)
  return m ? m[1].trim() : ''
}

/**
 * Faz o parse de um documento RSS 2.0 ou Atom e retorna array de itens.
 * Versão leve usada apenas para validar o feed em /testar-url.
 */
function parseRssXml(xml) {
  const items   = []
  const isAtom  = /<feed[^>]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/i.test(xml)
  const itemTag = isAtom ? 'entry' : 'item'

  const itemRe   = new RegExp(`<${itemTag}[\\s>][\\s\\S]*?<\\/${itemTag}>`, 'gi')
  const rawItems = xml.match(itemRe) || []

  for (const raw of rawItems) {
    const titulo = stripHtml(extractTag(raw, 'title'))
    if (!titulo) continue

    let link = ''
    if (isAtom) {
      link = extractAttr(raw, 'link', 'href') || extractTag(raw, 'link')
    } else {
      link = extractTag(raw, 'link') || extractAttr(raw, 'link', 'href')
    }
    link = link.replace(/<[^>]+>/g, '').trim()
    if (!link) continue

    const pubDateStr =
      extractTag(raw, 'pubDate') ||
      extractTag(raw, 'published') ||
      extractTag(raw, 'updated')
    const data = pubDateStr ? new Date(pubDateStr) : new Date()

    items.push({ titulo, link, data: isNaN(data.getTime()) ? new Date() : data })
  }

  return items
}

/**
 * Busca um feed RSS/Atom usando fetch nativo.
 * Usado apenas na rota /testar-url (validação rápida sem persistência).
 */
async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'IguaNews RSS Importer/1.0',
      'Accept':     'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Servidor retornou HTTP ${res.status}`)
  const text = await res.text()
  if (!text.trim().startsWith('<')) throw new Error('Resposta não é um XML válido')
  return text
}

// ─── Middlewares de autenticação reutilizáveis ───────────────────────────────
const auth       = [autenticar]
const authEditar = [autenticar, verificarPermissao('noticias.criar')]

// ─── CRUD de Fontes RSS ──────────────────────────────────────────────────────

/**
 * GET /api/admin/rss/fontes
 * Lista todas as fontes RSS cadastradas.
 */
router.get('/fontes', ...auth, async (_req, res, next) => {
  try {
    const fontes = await RssFonte.find()
      .populate('categoria_id', 'id nome')
      .sort({ padrao: -1, nome: 1 })
    res.json(fontes)
  } catch (err) { next(err) }
})

/**
 * GET /api/admin/rss/fontes/padrao
 * Retorna a lista de fontes padrão disponíveis para cadastro.
 */
router.get('/fontes/padrao', ...auth, (_req, res) => {
  res.json(RSS_FONTES_PADRAO)
})

/**
 * POST /api/admin/rss/fontes
 * Cadastra uma nova fonte RSS.
 */
router.post('/fontes', ...authEditar, async (req, res, next) => {
  try {
    const { nome, url, ativa, categoria_id, max_items, auto_update, intervalo_min, padrao } = req.body
    if (!nome?.trim() || !url?.trim()) {
      return res.status(400).json({ erro: 'Nome e URL são obrigatórios' })
    }
    const existente = await RssFonte.findOne({ url: url.trim() })
    if (existente) return res.status(409).json({ erro: 'Já existe uma fonte com essa URL' })

    const fonte = await RssFonte.create({
      nome:          nome.trim(),
      url:           url.trim(),
      ativa:         ativa !== false,
      categoria_id:  categoria_id || null,
      max_items:     max_items || 10,
      auto_update:   auto_update || false,
      intervalo_min: intervalo_min || 60,
      padrao:        padrao || false,
    })
    res.status(201).json(fonte)
  } catch (err) { next(err) }
})

/**
 * PUT /api/admin/rss/fontes/:id
 * Atualiza uma fonte RSS.
 */
router.put('/fontes/:id', ...authEditar, async (req, res, next) => {
  try {
    const { nome, url, ativa, categoria_id, max_items, auto_update, intervalo_min } = req.body
    const fonte = await RssFonte.findByIdAndUpdate(
      req.params.id,
      { nome, url, ativa, categoria_id: categoria_id || null, max_items, auto_update, intervalo_min },
      { new: true, runValidators: true }
    ).populate('categoria_id', 'id nome')
    if (!fonte) return res.status(404).json({ erro: 'Fonte não encontrada' })
    res.json(fonte)
  } catch (err) { next(err) }
})

/**
 * DELETE /api/admin/rss/fontes/:id
 * Remove uma fonte RSS.
 */
router.delete('/fontes/:id', ...authEditar, async (req, res, next) => {
  try {
    const fonte = await RssFonte.findByIdAndDelete(req.params.id)
    if (!fonte) return res.status(404).json({ erro: 'Fonte não encontrada' })
    res.json({ mensagem: 'Fonte removida com sucesso' })
  } catch (err) { next(err) }
})

// ─── Importação ──────────────────────────────────────────────────────────────

/**
 * POST /api/admin/rss/fontes/:id/importar
 * Importação manual de uma única fonte RSS.
 */
router.post('/fontes/:id/importar', ...authEditar, async (req, res, next) => {
  try {
    const fonte = await RssFonte.findById(req.params.id)
    if (!fonte) return res.status(404).json({ erro: 'Fonte não encontrada' })
    const resultado = await importarFonte(fonte, { categoria_id: req.body.categoria_id })
    res.json({ mensagem: 'Importação concluída com sucesso', ...resultado })
  } catch (err) {
    logger.error({ err: err.message }, 'Erro na importação RSS manual')
    next(err)
  }
})

/**
 * POST /api/admin/rss/importar-todas
 * Importação manual de todas as fontes ativas de uma só vez.
 */
router.post('/importar-todas', ...authEditar, async (_req, res, next) => {
  try {
    const fontes = await RssFonte.find({ ativa: true })
    if (!fontes.length) return res.json({ mensagem: 'Nenhuma fonte ativa encontrada', resultados: [] })

    let totalImportadas = 0
    let totalIgnoradas  = 0
    const resultados = []

    for (const fonte of fontes) {
      try {
        const r = await importarFonte(fonte)
        totalImportadas += r.importadas
        totalIgnoradas  += r.ignoradas ?? 0
        resultados.push({ fonte: fonte.nome, ...r, erro: null })
      } catch (err) {
        logger.error({ fonte: fonte.nome, err: err.message }, 'Erro ao importar fonte RSS')
        resultados.push({ fonte: fonte.nome, importadas: 0, ignoradas: 0, total: 0, erro: err.message })
      }
    }

    res.json({
      mensagem: 'Importação em massa concluída',
      totalImportadas,
      totalIgnoradas,
      resultados,
    })
  } catch (err) { next(err) }
})

/**
 * POST /api/admin/rss/testar-url
 * Testa se uma URL de feed RSS é válida e retorna uma prévia dos itens.
 * Usa o parser nativo (sem rss-parser) para validação rápida.
 */
router.post('/testar-url', ...authEditar, async (req, res, next) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ erro: 'URL é obrigatória' })
    const xml   = await fetchFeed(url)
    const items = parseRssXml(xml)
    if (!items.length) return res.status(422).json({ erro: 'Feed não contém itens válidos (verifique se é RSS 2.0 ou Atom)' })
    res.json({
      valido:      true,
      total_itens: items.length,
      preview:     items.slice(0, 3).map(i => ({ titulo: i.titulo, link: i.link, data: i.data })),
    })
  } catch (err) {
    res.status(422).json({ erro: `Feed inválido: ${err.message}` })
  }
})

export default router
