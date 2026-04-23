/**
 * Rotas de Notícias.
 * #5  — Incremento de views com deduplicação por IP via Redis.
 * #6  — Busca avançada com múltiplas categorias, datas e ordenação.
 * #18 — Suporte a galeria de imagens (campo `galeria`).
 * #19 — Audit log nas mutações autenticadas.
 * #20 — Fluxo de status editorial: rascunho → revisao → publicado → arquivado.
 */
import { Router } from 'express'
import Noticia from '../models/Noticia.js'
import Categoria from '../models/Categoria.js'
import { autenticar, autenticarOpcional } from '../middleware/auth.js'
import { verificarPermissao } from '../middleware/verificarPermissao.js'
import { regraNoticia, validar } from '../middleware/validacoes.js'
import { auditLog } from '../middleware/auditLog.js'
import { cloudinary } from '../config/index.js'
import { viewJaContabilizada } from '../utils/cache.js'
import { body, validationResult } from 'express-validator'

const router = Router()

// #20 — Transições de status permitidas
// arquivado → publicado adicionado para permitir reativação direta via toggle rápido
const TRANSICOES_VALIDAS = {
  rascunho:  ['revisao', 'publicado'],
  revisao:   ['rascunho', 'publicado', 'arquivado'],
  publicado: ['arquivado', 'rascunho'],
  arquivado: ['rascunho', 'publicado'],
}

// ─── Helpers de populate ──────────────────────────────────────
function popular(q, sort) {
  return q
    .populate('categoria_id', 'id nome slug cor')
    .populate('fonte_id', 'id nome url')
    .sort(sort || { criado_em: -1 })
}

function popularUm(q) {
  return q
    .populate('categoria_id', 'id nome slug cor')
    .populate('fonte_id', 'id nome url')
}

/**
 * @swagger
 * /api/noticias:
 *   get:
 *     summary: Lista notícias com paginação e filtros
 *     tags: [Notícias]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [rascunho, revisao, publicado, arquivado] }
 *         description: Filtro por status (padrão "publicado" para rotas públicas; autenticado pode usar qualquer valor ou "todos")
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 9 }
 *       - in: query
 *         name: dataInicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dataFim
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: ordem
 *         schema: { type: string, enum: [recente, antigo, relevancia] }
 *     responses:
 *       200:
 *         description: Lista de notícias
 */
router.get('/', autenticarOpcional, async (req, res, next) => {
  try {
    const { categoria, q, page, limit, cursor, dataInicio, dataFim, ordem, status } = req.query
    const lim = Math.min(500, parseInt(limit) || 9)

    // #20 — Controle de visibilidade por status:
    // - Não autenticado: sempre filtra por "publicado"
    // - Autenticado + status="todos": sem filtro de status
    // - Autenticado + status=<valor>: filtra pelo valor passado
    const autenticado = !!(req.usuario || req.user || req.session?.usuario)
    let filtro = {}

    if (!autenticado) {
      filtro.status = 'publicado'
    } else if (status && status !== 'todos') {
      filtro.status = status
    }
    // autenticado sem parâmetro status → retorna todos

    if (categoria) {
      const slugs = categoria.split(',').map(s => s.trim()).filter(Boolean)
      if (slugs.length === 1) {
        const cat = await Categoria.findOne({ slug: slugs[0] })
        if (cat) filtro.categoria_id = cat._id
      } else if (slugs.length > 1) {
        const cats = await Categoria.find({ slug: { $in: slugs } }).select('_id')
        filtro.categoria_id = { $in: cats.map(c => c._id) }
      }
    }

    if (q?.trim()) filtro.$text = { $search: q.trim() }

    if (dataInicio || dataFim) {
      filtro.criado_em = {}
      if (dataInicio) filtro.criado_em.$gte = new Date(dataInicio)
      if (dataFim) {
        const fim = new Date(dataFim)
        fim.setHours(23, 59, 59, 999)
        filtro.criado_em.$lte = fim
      }
    }

    let sortOpt = { criado_em: -1 }
    if (ordem === 'antigo') sortOpt = { criado_em: 1 }
    else if (ordem === 'relevancia' && q?.trim()) {
      sortOpt = { score: { $meta: 'textScore' }, criado_em: -1 }
    }

    if (cursor) {
      const cf = { ...filtro }
      if (!cf.criado_em) cf.criado_em = {}
      cf.criado_em.$lt = new Date(cursor)
      const noticias = await popular(Noticia.find(cf).limit(lim), sortOpt)
      const nextCursor = noticias.length === lim
        ? noticias[noticias.length - 1].criado_em?.toISOString()
        : null
      return res.json({ noticias, nextCursor })
    }

    const pag   = Math.max(1, parseInt(page) || 1)
    const skip  = (pag - 1) * lim
    const total = await Noticia.countDocuments(filtro)
    const noticias = await popular(Noticia.find(filtro).skip(skip).limit(lim), sortOpt)
    res.json({ noticias, total, pagina: pag, paginas: Math.ceil(total / lim) })
  } catch (err) { next(err) }
})

/**
 * GET /api/noticias/contagem-status
 * #20 — Retorna contagem de notícias por status (autenticado).
 */
router.get('/contagem-status', autenticar, async (req, res, next) => {
  try {
    const contagem = await Noticia.aggregate([
      { $group: { _id: '$status', total: { $sum: 1 } } },
    ])
    const resultado = { rascunho: 0, revisao: 0, publicado: 0, arquivado: 0 }
    contagem.forEach(({ _id, total }) => { if (_id) resultado[_id] = total })
    res.json(resultado)
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /api/noticias/{id}:
 *   get:
 *     summary: Retorna uma notícia e incrementa o contador de views
 *     tags: [Notícias]
 */
router.get('/:id', autenticarOpcional, async (req, res, next) => {
  try {
    const autenticado = !!(req.usuario || req.user || req.session?.usuario)
    const query = Noticia.findById(req.params.id)

    // #20 — Visitantes só enxergam notícias publicadas
    if (!autenticado) {
      query.where('status').equals('publicado')
    }

    const noticia = await popularUm(query)
    if (!noticia) return res.status(404).json({ erro: 'Notícia não encontrada' })

    // #5 — Incrementa views somente para notícias publicadas
    if (noticia.status === 'publicado') {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'desconhecido'
      const jaCont = await viewJaContabilizada(req.params.id, ip)
      if (!jaCont) {
        await Noticia.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })
        noticia.views = (noticia.views || 0) + 1
      }
    }

    res.json(noticia)
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /api/noticias:
 *   post:
 *     summary: Cria uma notícia (autenticado)
 *     tags: [Notícias]
 *     security:
 *       - cookieAuth: []
 */
router.post('/', autenticar, verificarPermissao('noticias.criar'), auditLog('noticias'), regraNoticia, validar, async (req, res, next) => {
  try {
    const {
      titulo, resumo, conteudo,
      imagem_url, imagem_public_id, imagem_legenda,
      categoria_id, fonte_id, destaque,
      galeria, status,
    } = req.body

    const statusFinal = status || 'rascunho'
    const publicado_em = statusFinal === 'publicado' ? new Date() : null

    const noticia = await Noticia.create({
      titulo, conteudo,
      resumo:           resumo || '',
      imagem_url:       imagem_url || null,
      imagem_public_id: imagem_public_id || null,
      imagem_legenda:   imagem_legenda || '',
      destaque:         destaque || false,
      categoria_id:     categoria_id || null,
      fonte_id:         fonte_id || null,
      galeria:          Array.isArray(galeria) ? galeria : [],
      status:           statusFinal,
      publicado_em,
    })
    const populada = await popularUm(Noticia.findById(noticia._id))
    res.status(201).json(populada)
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /api/noticias/{id}:
 *   put:
 *     summary: Atualiza uma notícia (autenticado)
 *     tags: [Notícias]
 *     security:
 *       - cookieAuth: []
 */
router.put('/:id', autenticar, verificarPermissao('noticias.editar'), auditLog('noticias'), regraNoticia, validar, async (req, res, next) => {
  try {
    const {
      titulo, resumo, conteudo,
      imagem_url, imagem_public_id, imagem_legenda,
      categoria_id, fonte_id, destaque,
      galeria, status,
    } = req.body

    // #20 — Se mudou para publicado e ainda não tinha data, registra agora
    const noticiaAtual = await Noticia.findById(req.params.id).select('status publicado_em')
    if (!noticiaAtual) return res.status(404).json({ erro: 'Notícia não encontrada' })

    const atualizacao = {
      titulo, conteudo,
      resumo:           resumo || '',
      imagem_url:       imagem_url || null,
      imagem_public_id: imagem_public_id || null,
      imagem_legenda:   imagem_legenda || '',
      destaque:         destaque || false,
      categoria_id:     categoria_id || null,
      fonte_id:         fonte_id || null,
      ...(Array.isArray(galeria) ? { galeria } : {}),
    }

    if (status) {
      atualizacao.status = status
      if (status === 'publicado' && !noticiaAtual.publicado_em) {
        atualizacao.publicado_em = new Date()
      }
    }

    const noticia = await Noticia.findByIdAndUpdate(
      req.params.id,
      atualizacao,
      { new: true, runValidators: true }
    )
    if (!noticia) return res.status(404).json({ erro: 'Notícia não encontrada' })
    const populada = await popularUm(Noticia.findById(noticia._id))
    res.json(populada)
  } catch (err) { next(err) }
})

/**
 * PATCH /api/noticias/:id/status
 * #20 — Transição rápida de status sem re-enviar todo o corpo.
 */
router.patch(
  '/:id/status',
  autenticar,
  verificarPermissao('noticias.editar'),
  auditLog('noticias'),
  [
    body('status')
      .notEmpty().withMessage('Status obrigatório')
      .isIn(['rascunho', 'revisao', 'publicado', 'arquivado'])
      .withMessage('Status inválido'),
  ],
  validar,
  async (req, res, next) => {
    try {
      const { status: novoStatus } = req.body
      const noticia = await Noticia.findById(req.params.id).select('status publicado_em')
      if (!noticia) return res.status(404).json({ erro: 'Notícia não encontrada' })

      const permitidos = TRANSICOES_VALIDAS[noticia.status] || []
      if (!permitidos.includes(novoStatus)) {
        return res.status(422).json({
          erro: `Transição inválida: ${noticia.status} → ${novoStatus}`,
          transicoes_validas: permitidos,
        })
      }

      const update = { status: novoStatus }
      if (novoStatus === 'publicado' && !noticia.publicado_em) {
        update.publicado_em = new Date()
      }

      const atualizada = await Noticia.findByIdAndUpdate(
        req.params.id, update, { new: true }
      )
      res.json({ id: atualizada._id, status: atualizada.status, publicado_em: atualizada.publicado_em })
    } catch (err) { next(err) }
  }
)

/**
 * @swagger
 * /api/noticias/{id}:
 *   delete:
 *     summary: Exclui uma notícia (autenticado)
 */
router.delete('/:id', autenticar, verificarPermissao('noticias.excluir'), auditLog('noticias'), async (req, res, next) => {
  try {
    const noticia = await Noticia.findByIdAndDelete(req.params.id)
    if (!noticia) return res.status(404).json({ erro: 'Notícia não encontrada' })

    if (noticia.imagem_public_id) {
      await cloudinary.uploader.destroy(noticia.imagem_public_id).catch(() => {})
    }
    if (noticia.galeria?.length) {
      await Promise.all(
        noticia.galeria
          .filter(img => img.public_id)
          .map(img => cloudinary.uploader.destroy(img.public_id).catch(() => {}))
      )
    }

    res.json({ mensagem: 'Notícia excluída' })
  } catch (err) { next(err) }
})

/**
 * POST /api/noticias/:id/galeria
 * #18 — Adiciona imagens à galeria de uma notícia existente.
 */
router.post('/:id/galeria', autenticar, verificarPermissao('noticias.editar'), auditLog('noticias'), async (req, res, next) => {
  try {
    const { imagens } = req.body
    if (!Array.isArray(imagens) || imagens.length === 0) {
      return res.status(400).json({ erro: 'Envie um array `imagens`' })
    }
    const noticia = await Noticia.findByIdAndUpdate(
      req.params.id,
      { $push: { galeria: { $each: imagens } } },
      { new: true }
    )
    if (!noticia) return res.status(404).json({ erro: 'Notícia não encontrada' })
    res.json(noticia.galeria)
  } catch (err) { next(err) }
})

/**
 * DELETE /api/noticias/:id/galeria/:publicId
 * #18 — Remove uma imagem da galeria pelo public_id do Cloudinary.
 */
router.delete('/:id/galeria/:publicId', autenticar, verificarPermissao('noticias.excluir'), auditLog('noticias'), async (req, res, next) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId)
    await cloudinary.uploader.destroy(publicId).catch(() => {})
    const noticia = await Noticia.findByIdAndUpdate(
      req.params.id,
      { $pull: { galeria: { public_id: publicId } } },
      { new: true }
    )
    if (!noticia) return res.status(404).json({ erro: 'Notícia não encontrada' })
    res.json(noticia.galeria)
  } catch (err) { next(err) }
})

export default router
