// ============================================================
//  IguaNews — API Service
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// #1 — Token não é mais armazenado no localStorage.
// O backend define um cookie HttpOnly automaticamente no login.
// Todas as requisições usam credentials: 'include' para enviá-lo.

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // envia/recebe cookie HttpOnly a cada requisição
  })

  // 401 em rotas não-auth: sessão expirada → redireciona para login
  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (window.location.pathname !== '/login') window.location.href = '/login'
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`)
  return data
}

// ─── AUTH ────────────────────────────────────────────────────
export const authService = {
  async login(email, senha) {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) })
    // Cookie HttpOnly já foi definido pelo backend; apenas retornamos o usuário
    return { data: { user: data.usuario }, error: null }
  },
  async logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    return { error: null }
  },
  async getSession() {
    try {
      const data = await api('/auth/me')
      return { data: { session: { user: data.usuario } }, error: null }
    } catch {
      return { data: { session: null }, error: null }
    }
  },
  onAuthChange(callback) {
    this.getSession().then(({ data }) => { callback('INITIAL_SESSION', data.session) })
    return { data: { subscription: { unsubscribe: () => {} } } }
  },
  async editarMe(dados) {
    const data = await api('/auth/me', { method: 'PUT', body: JSON.stringify(dados) })
    return { data: { user: data.usuario }, error: null }
  },
  async esqueciSenha(email) {
    return api('/auth/esqueci-senha', { method: 'POST', body: JSON.stringify({ email }) })
  },
  async redefinirSenha(token, senha) {
    return api('/auth/redefinir-senha', { method: 'POST', body: JSON.stringify({ token, senha }) })
  },
}

// ─── NOTÍCIAS ────────────────────────────────────────────────
export const noticiasService = {
  async listar({ categoria, page = 1, limit = 9, q, cursor, dataInicio, dataFim, ordem, status } = {}) {
    const p = new URLSearchParams()
    if (categoria)    p.set('categoria', categoria)
    if (cursor)       p.set('cursor', cursor)
    else if (page > 1) p.set('page', String(page))
    if (limit !== 9)  p.set('limit', String(limit))
    if (q?.trim())    p.set('q', q.trim())
    if (dataInicio)   p.set('dataInicio', dataInicio)
    if (dataFim)      p.set('dataFim', dataFim)
    if (ordem && ordem !== 'recente') p.set('ordem', ordem)
    // #20 — Filtro por status editorial (admin); público sempre recebe só "publicado"
    if (status)       p.set('status', status)
    const qs = p.toString()
    return api(`/noticias${qs ? `?${qs}` : ''}`)
  },
  async buscarPorId(id) { return api(`/noticias/${id}`) },
  async criar(dados)    { return api('/noticias', { method: 'POST', body: JSON.stringify(dados) }) },
  async editar(id, dados) { return api(`/noticias/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluir(id)     { await api(`/noticias/${id}`, { method: 'DELETE' }); return true },
  // #20 — Transição rápida de status sem re-enviar o formulário completo
  async atualizarStatus(id, status) {
    return api(`/noticias/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },
  // #20 — Contagem de notícias agrupada por status (admin dashboard)
  async contagemStatus() { return api('/noticias/contagem-status') },
}

// ─── CATEGORIAS ──────────────────────────────────────────────
export const categoriasService = {
  async listar()           { return api('/categorias') },
  async criar(dados)       { return api('/categorias', { method: 'POST', body: JSON.stringify(dados) }) },
  async editar(id, dados)  { return api(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluir(id)        { await api(`/categorias/${id}`, { method: 'DELETE' }); return true },
}

// ─── FONTES ──────────────────────────────────────────────────
export const fontesService = {
  async listar()           { return api('/fontes') },
  async criar(dados)       { return api('/fontes', { method: 'POST', body: JSON.stringify(dados) }) },
  async editar(id, dados)  { return api(`/fontes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluir(id)        { await api(`/fontes/${id}`, { method: 'DELETE' }); return true },
}

// ─── CONFIGURAÇÕES ───────────────────────────────────────────
export const configuracoesService = {
  async listar()             { return api('/configuracoes') },
  async atualizar(chave, valor) {
    return api(`/configuracoes/${chave}`, { method: 'PUT', body: JSON.stringify({ valor }) })
  },
  async atualizarLote(pares) {
    return api('/configuracoes-lote', { method: 'PUT', body: JSON.stringify({ pares }) })
  },
}

// ─── MÓDULOS ─────────────────────────────────────────────────
export const modulosService = {
  async listar()             { return api('/modulos') },
  async atualizar(id, updates) { return api(`/modulos/${id}`, { method: 'PUT', body: JSON.stringify(updates) }) },
}

// ─── NOTÍCIAS EXTERNAS ───────────────────────────────────────
export const noticiasExternasService = {
  async listar()           { return api('/noticias-externas') },
  async listarTodas()      { return api('/noticias-externas/todas') },
  async criar(dados)       { return api('/noticias-externas', { method: 'POST', body: JSON.stringify(dados) }) },
  async editar(id, dados)  { return api(`/noticias-externas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluir(id)        { await api(`/noticias-externas/${id}`, { method: 'DELETE' }); return true },
}

// ─── TÓPICOS ─────────────────────────────────────────────────
export const topicosService = {
  async listar()           { return api('/topicos') },
  async listarTodos()      { return api('/topicos/todos') },
  async criar(dados)       { return api('/topicos', { method: 'POST', body: JSON.stringify(dados) }) },
  async editar(id, dados)  { return api(`/topicos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluir(id)        { await api(`/topicos/${id}`, { method: 'DELETE' }); return true },
}

// ─── ÔNIBUS ──────────────────────────────────────────────────
export const onibusService = {
  async listar()           { return api('/onibus') },
  async listarTodos()      { return api('/onibus/todos') },
  async criar(dados)       { return api('/onibus', { method: 'POST', body: JSON.stringify(dados) }) },
  async editar(id, dados)  { return api(`/onibus/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluir(id)        { await api(`/onibus/${id}`, { method: 'DELETE' }); return true },
}

// ─── EVENTOS ─────────────────────────────────────────────────
export const eventosService = {
  async listar()           { return api('/eventos') },
  async listarTodos()      { return api('/eventos/todos') },
  async criar(dados)       { return api('/eventos', { method: 'POST', body: JSON.stringify(dados) }) },
  async editar(id, dados)  { return api(`/eventos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluir(id)        { await api(`/eventos/${id}`, { method: 'DELETE' }); return true },
}

// ─── STORAGE ─────────────────────────────────────────────────
export const storageService = {
  async upload(file, onProgress) {
    if (!file) throw new Error('Nenhum arquivo selecionado')
    if (!file.type.startsWith('image/')) throw new Error('Apenas imagens são permitidas')
    if (file.size > 5 * 1024 * 1024) throw new Error('Imagem deve ter no máximo 5MB')

    const formData = new FormData()
    formData.append('imagem', file)
    onProgress?.(30)

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      credentials: 'include', // cookie HttpOnly no upload também
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.erro || 'Erro no upload')
    onProgress?.(100)
    return { url: data.url, public_id: data.public_id }
  },
  async remover(public_id) {
    if (!public_id) return
    await api('/upload', { method: 'DELETE', body: JSON.stringify({ public_id }) })
  },
}

// ─── NEWSLETTER ──────────────────────────────────────────────
export const newsletterService = {
  async assinar(email, nome = '') {
    return api('/newsletter/assinar', { method: 'POST', body: JSON.stringify({ email, nome }) })
  },
  async listarAssinantes({ page = 1, limit = 50, ativo } = {}) {
    const p = new URLSearchParams({ page, limit })
    if (ativo !== undefined) p.set('ativo', String(ativo))
    return api(`/newsletter/assinantes?${p}`)
  },
  async removerAssinante(id) {
    return api(`/newsletter/assinantes/${id}`, { method: 'DELETE' })
  },
  async alterarStatus(id, ativo) {
    return api(`/newsletter/assinantes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo }) })
  },
}

// ─── ERROS / ERROR TRACKING ──────────────────────────────────
const BASE_URL_ERROS = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api') + '/erros'

// Fire-and-forget: nunca lança exceção para não criar loop infinito
export const errosService = {
  async capturar({ tipo, mensagem, stack, dados } = {}) {
    try {
      const payload = {
        tipo,
        mensagem: String(mensagem || 'Erro desconhecido').slice(0, 2000),
        stack:    stack ? String(stack).slice(0, 5000) : null,
        url:      window.location.href,
        rota:     window.location.pathname,
        user_agent: navigator.userAgent,
        usuario_email: null, // preenchido se disponível via contexto
        dados: dados || null,
      }
      await fetch(BASE_URL_ERROS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
    } catch { /* silencioso */ }
  },

  async listar({ tipo, lido, status, page = 1, limit = 50 } = {}) {
    const p = new URLSearchParams({ page, limit })
    if (tipo   !== undefined)  p.set('tipo', tipo)
    if (status !== undefined)  p.set('status', status)
    // lido só é enviado se status não foi fornecido
    if (lido   !== undefined && status === undefined)  p.set('lido', String(lido))
    return api(`/erros?${p}`)
  },

  async contagem()       { return api('/erros/contagem') },
  async marcarLido(id, lido = true) {
    return api(`/erros/${id}/lido`, { method: 'PATCH', body: JSON.stringify({ lido }) })
  },
  async atualizarStatus(id, status) {
    return api(`/erros/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },
  async marcarTodosLidos() {
    return api('/erros/marcar-todos-lidos', { method: 'PATCH', body: '{}' })
  },
  async excluir(id) {
    await api(`/erros/${id}`, { method: 'DELETE' })
  },
  async limpar({ tipo, apenas_lidos } = {}) {
    const p = new URLSearchParams()
    if (tipo)         p.set('tipo', tipo)
    if (apenas_lidos) p.set('apenas_lidos', 'true')
    return api(`/erros${p.toString() ? '?' + p : ''}`, { method: 'DELETE' })
  },
}

// ─── SETUP ────────────────────────────────────────────────────
export const setupService = {
  async status() {
    return api('/setup/status')
  },
  async instalar(dados) {
    return api('/setup', { method: 'POST', body: JSON.stringify(dados) })
  },
  async seed({ nome_site = 'IguaNews', limpar_antes = false, dados_escolhidos } = {}) {
    return api('/setup/seed', { method: 'POST', body: JSON.stringify({ nome_site, limpar_antes, dados_escolhidos }) })
  },
  async resetDb({ confirmar, manter_usuarios = true } = {}) {
    return api('/setup/reset-db', { method: 'POST', body: JSON.stringify({ confirmar, manter_usuarios }) })
  },
  async lerEnvConfig() {
    return api('/setup/env-config')
  },
  async salvarEnvConfig(dados) {
    return api('/setup/env-config', { method: 'POST', body: JSON.stringify(dados) })
  },
  async testarMongo(mongo_uri) {
    return api('/setup/test-mongo', { method: 'POST', body: JSON.stringify({ mongo_uri }) })
  },
  async testarCloudinary(dados) {
    return api('/setup/test-cloudinary', { method: 'POST', body: JSON.stringify(dados) })
  },
  async desativarArquivo() {
    return api('/setup/desativar-arquivo', { method: 'POST' })
  },
}

// ─── USUÁRIOS ADMIN ───────────────────────────────────────────
export const usuariosService = {
  async listar()           { return api('/admin/usuarios') },
  async buscarPorId(id)    { return api(`/admin/usuarios/${id}`) },
  async criar(dados)       { return api('/admin/usuarios', { method: 'POST', body: JSON.stringify(dados) }) },
  async editar(id, dados)  { return api(`/admin/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluir(id)        { return api(`/admin/usuarios/${id}`, { method: 'DELETE' }) },
  // Perfis
  async listarPerfis()     { return api('/admin/usuarios/perfis/todos') },
  async criarPerfil(dados) { return api('/admin/usuarios/perfis/novo', { method: 'POST', body: JSON.stringify(dados) }) },
  async editarPerfil(id, dados) { return api(`/admin/usuarios/perfis/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) },
  async excluirPerfil(id)  { return api(`/admin/usuarios/perfis/${id}`, { method: 'DELETE' }) },
}

// ─── BACKUP ───────────────────────────────────────────────────
export const backupService = {
  async listar()       { return api('/admin/backup') },
  async stats()        { return api('/admin/backup/~stats') },
  async criar(descricao = '') {
    return api('/admin/backup', { method: 'POST', body: JSON.stringify({ descricao }) })
  },
  async importar(arquivo, descricao = '') {
    const form = new FormData()
    form.append('arquivo', arquivo)
    if (descricao.trim()) form.append('descricao', descricao.trim())
    const res = await fetch(`${BASE_URL}/admin/backup/import`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`)
    return data
  },
  async restaurar(id)  { return api(`/admin/backup/${id}/restore`, { method: 'POST', body: '{}' }) },
  async excluir(id)    { return api(`/admin/backup/${id}`, { method: 'DELETE' }) },
  downloadUrl(id)      { return `${BASE_URL}/admin/backup/${id}/download` },
}

// ─── INFRAESTRUTURA (MongoDB + Cloudinary + Sistema) ─────────
export const infraestruturaService = {
  // Conexões
  async testarConexoes() {
    return api('/admin/infraestrutura/testar-conexoes', { method: 'POST', body: '{}' })
  },
  // MongoDB
  async mongoStatus()         { return api('/admin/infraestrutura/mongodb/status') },
  async mongoColecoes()       { return api('/admin/infraestrutura/mongodb/colecoes') },
  async mongoDocumentos(nome, page = 1, limit = 20, q = '') {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (q) p.set('q', q)
    return api(`/admin/infraestrutura/mongodb/colecoes/${encodeURIComponent(nome)}?${p}`)
  },
  async mongoExcluirDoc(colecao, id) {
    return api(`/admin/infraestrutura/mongodb/colecoes/${encodeURIComponent(colecao)}/doc/${id}`, { method: 'DELETE' })
  },
  // Estatísticas da coleção
  async mongoStatsColecao(nome) {
    return api(`/admin/infraestrutura/mongodb/colecoes/${encodeURIComponent(nome)}/stats`)
  },
  // Índices
  async mongoIndices(nome) {
    return api(`/admin/infraestrutura/mongodb/colecoes/${encodeURIComponent(nome)}/indices`)
  },
  async mongoCriarIndice(nome, campos, unique = false) {
    return api(`/admin/infraestrutura/mongodb/colecoes/${encodeURIComponent(nome)}/indices`, {
      method: 'POST',
      body: JSON.stringify({ campos, unique, background: true }),
    })
  },
  async mongoRemoverIndice(nome, nomeIndice) {
    return api(`/admin/infraestrutura/mongodb/colecoes/${encodeURIComponent(nome)}/indices/${encodeURIComponent(nomeIndice)}`, {
      method: 'DELETE',
    })
  },
  // Cloudinary
  async cloudinaryStatus() { return api('/admin/infraestrutura/cloudinary/status') },
  async cloudinaryRecursos(tipo = 'image', max = 20, cursor = null) {
    const p = new URLSearchParams({ tipo, max: String(max) })
    if (cursor) p.set('cursor', cursor)
    return api(`/admin/infraestrutura/cloudinary/recursos?${p}`)
  },
  async cloudinaryExcluir(public_id, tipo = 'image') {
    return api('/admin/infraestrutura/cloudinary/recursos', {
      method: 'DELETE', body: JSON.stringify({ public_id, tipo }),
    })
  },
  // Sistema (métricas e cache)
  async sistemaMetricas() {
    return api('/admin/infraestrutura/sistema/metricas')
  },
  async limparCache() {
    return api('/admin/infraestrutura/sistema/limpar-cache', { method: 'POST', body: '{}' })
  },
}

// ─── RSS IMPORT ───────────────────────────────────────────────
export const rssService = {
  /** Lista todas as fontes RSS cadastradas */
  async listarFontes()       { return api('/admin/rss/fontes') },
  /** Retorna as fontes padrão disponíveis para cadastro rápido */
  async fontesPadrao()       { return api('/admin/rss/fontes/padrao') },
  /** Cadastra uma nova fonte RSS */
  async criarFonte(dados)    { return api('/admin/rss/fontes', { method: 'POST', body: JSON.stringify(dados) }) },
  /** Atualiza dados de uma fonte RSS */
  async editarFonte(id, dados) {
    return api(`/admin/rss/fontes/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
  },
  /** Remove uma fonte RSS */
  async excluirFonte(id)     { await api(`/admin/rss/fontes/${id}`, { method: 'DELETE' }); return true },
  /** Importa notícias de uma fonte específica */
  async importarFonte(id, dados = {}) {
    return api(`/admin/rss/fontes/${id}/importar`, { method: 'POST', body: JSON.stringify(dados) })
  },
  /** Importa notícias de todas as fontes ativas de uma só vez */
  async importarTodas()      { return api('/admin/rss/importar-todas', { method: 'POST', body: '{}' }) },
  /** Testa se uma URL de feed RSS é válida e retorna prévia */
  async testarUrl(url)       { return api('/admin/rss/testar-url', { method: 'POST', body: JSON.stringify({ url }) }) },
  // ── Scheduler ────────────────────────────────────────────────────────────
  /** Retorna o estado atual do cron job (ativo, emExecucao, ultimoCiclo) */
  async status()             { return api('/admin/rss/status') },
  /** (Re)inicia o cron com a expressão fornecida (padrão: '0 * * * *' = a cada hora) */
  async iniciarScheduler(expressao) {
    return api('/admin/rss/scheduler/iniciar', {
      method: 'POST',
      body: JSON.stringify({ expressao: expressao || '0 * * * *' }),
    })
  },
  /** Para o cron job */
  async pararScheduler()     { return api('/admin/rss/scheduler/parar', { method: 'POST', body: '{}' }) },
  /** Dispara um ciclo de importação imediato sem esperar o cron */
  async executarAgora()      { return api('/admin/rss/scheduler/executar-agora', { method: 'POST', body: '{}' }) },
}
