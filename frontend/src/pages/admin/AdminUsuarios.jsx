import { useState, useEffect, useCallback } from 'react'
import { usuariosService } from '../../services/api'
import toast from 'react-hot-toast'

// Todas as permissões disponíveis agrupadas
const GRUPOS_PERMISSOES = [
  { grupo: 'Notícias', perms: [
    { id: 'noticias.ver',     label: 'Ver notícias' },
    { id: 'noticias.criar',   label: 'Criar notícias' },
    { id: 'noticias.editar',  label: 'Editar notícias' },
    { id: 'noticias.excluir', label: 'Excluir notícias' },
  ]},
  { grupo: 'Conteúdo', perms: [
    { id: 'categorias.gerenciar', label: 'Categorias' },
    { id: 'fontes.gerenciar',     label: 'Fontes' },
    { id: 'extras.gerenciar',     label: 'Eventos & Ônibus' },
    { id: 'modulos.gerenciar',    label: 'Módulos da Home' },
    { id: 'newsletter.gerenciar', label: 'Newsletter' },
  ]},
  { grupo: 'Sistema', perms: [
    { id: 'configuracoes.gerenciar', label: 'SEO & Configurações' },
    { id: 'erros.ver',               label: 'Ver Erros/Logs' },
    { id: 'erros.gerenciar',         label: 'Gerenciar Erros/Logs' },
    { id: 'backup.gerenciar',        label: 'Backup do banco' },
    { id: 'usuarios.gerenciar',      label: 'Usuários & Perfis' },
  ]},
]

// ── Indicador visual de força de senha ───────────────────────────────────────
function ForcaSenha({ senha }) {
  if (!senha) return null
  let pontos = 0
  if (senha.length >= 8)             pontos++
  if (/[a-zA-Z]/.test(senha))        pontos++
  if (/[0-9]/.test(senha))           pontos++
  if (/[^a-zA-Z0-9]/.test(senha))    pontos++

  const niveis = [
    { label: 'Muito fraca', cor: '#ef4444' },
    { label: 'Fraca',       cor: '#f97316' },
    { label: 'Média',       cor: '#eab308' },
    { label: 'Forte',       cor: 'var(--adm-accent)' },
    { label: 'Muito forte', cor: 'var(--adm-accent-d)' },
  ]
  const nivel = niveis[Math.max(0, pontos - 1)]

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= pontos ? nivel.cor : 'var(--adm-border)',
            transition: 'background .2s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: nivel.cor, fontWeight: 600 }}>{nivel.label}</span>
    </div>
  )
}

function Badge({ cor, label }) {
  return (
    <span style={{ background: cor + '22', color: cor, border: `1px solid ${cor}44`, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '2px 10px' }}>
      {label}
    </span>
  )
}

function IconeOlho({ aberto }) {
  return aberto
    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}

// ── Checklist visual das regras de senha ─────────────────────────────────────
function RegrasSenha({ senha }) {
  if (!senha) return null
  const regras = [
    { ok: senha.length >= 8,              texto: 'Mínimo 8 caracteres'          },
    { ok: /[a-zA-Z]/.test(senha),         texto: 'Pelo menos uma letra'         },
    { ok: /[0-9]/.test(senha),            texto: 'Pelo menos um número'         },
    { ok: /[^a-zA-Z0-9]/.test(senha),     texto: 'Pelo menos um símbolo (!@#…)' },
  ]
  return (
    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {regras.map(r => (
        <span key={r.texto} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
          color: r.ok ? 'var(--adm-accent)' : 'var(--adm-muted)' }}>
          {r.ok
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11"><circle cx="12" cy="12" r="9"/></svg>
          }
          {r.texto}
        </span>
      ))}
    </div>
  )
}

function ModalUsuario({ usuario, perfis, onSalvar, onFechar }) {
  const editando = !!(usuario?.id || usuario?._id)

  // ── Bug fix: com .lean() no backend, o campo retorna _id (não id) ──────────
  // usuario.perfil_id é um objeto populado { _id, nome, cor, permissoes }
  // precisamos extrair apenas o ID string para o <select>
  const perfilIdInicial = usuario?.perfil_id?._id?.toString()
    || usuario?.perfil_id?.id
    || (typeof usuario?.perfil_id === 'string' ? usuario.perfil_id : '')

  const [form, setForm] = useState({
    nome:          usuario?.nome  || '',
    email:         usuario?.email || '',
    senha:         '',
    confirmSenha:  '',
    perfil_id:     perfilIdInicial,
    ativo:         usuario?.ativo !== false,
  })
  const [mostrarSenha,    setMostrarSenha]    = useState(false)
  const [mostrarConfirm,  setMostrarConfirm]  = useState(false)
  const [loading,         setLoading]         = useState(false)

  // Indicador de correspondência entre senha e confirmação
  const senhasIguais   = form.senha && form.confirmSenha && form.senha === form.confirmSenha
  const senhasDiferentes = form.confirmSenha && form.senha !== form.confirmSenha

  async function handleSalvar(e) {
    e.preventDefault()
    if (!form.nome.trim() || !form.email.trim()) { toast.error('Nome e email são obrigatórios'); return }
    if (!editando && !form.senha) { toast.error('Senha é obrigatória'); return }
    if (form.senha) {
      if (form.senha.length < 8)                { toast.error('Senha mínimo 8 caracteres'); return }
      if (!/[a-zA-Z]/.test(form.senha))         { toast.error('Senha deve conter ao menos uma letra'); return }
      if (!/[0-9]/.test(form.senha))            { toast.error('Senha deve conter ao menos um número'); return }
      if (!/[^a-zA-Z0-9]/.test(form.senha))     { toast.error('Senha deve conter ao menos um símbolo'); return }
      if (form.senha !== form.confirmSenha)      { toast.error('As senhas não conferem'); return }
    }
    setLoading(true)
    try {
      const dados = { nome: form.nome, email: form.email, perfil_id: form.perfil_id || null, ativo: form.ativo }
      if (form.senha) dados.senha = form.senha
      if (editando) {
        const r = await usuariosService.editar(usuario.id || usuario._id, dados)
        toast.success('Usuário atualizado!'); onSalvar(r.usuario)
      } else {
        const r = await usuariosService.criar({ ...dados, senha: form.senha })
        toast.success('Usuário criado!'); onSalvar(r.usuario)
      }
      onFechar()
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const s = { label: { fontSize: 12, fontWeight: 600, color: 'var(--adm-muted)', marginBottom: 5, display: 'block' } }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--adm-surface)', border:'1px solid var(--adm-border)', borderRadius:14, padding:24, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.5)', margin:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'var(--adm-text)' }}>{editando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button onClick={onFechar} className="adm-btn adm-btn-ghost adm-btn-icon adm-btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSalvar} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Nome */}
          <div>
            <label style={s.label}>Nome completo</label>
            <input className="adm-input" value={form.nome} onChange={e => setForm(f => ({...f,nome:e.target.value}))} placeholder="Ex.: João da Silva" />
          </div>

          {/* Email */}
          <div>
            <label style={s.label}>Email</label>
            <input className="adm-input" type="email" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} placeholder="email@exemplo.com" />
          </div>

          {/* Senha + força + regras */}
          <div>
            <label style={s.label}>{editando ? 'Nova senha (deixe vazio para manter)' : 'Senha'}</label>
            <div style={{ position: 'relative' }}>
              <input
                className="adm-input"
                type={mostrarSenha ? 'text' : 'password'}
                value={form.senha}
                onChange={e => setForm(f => ({...f, senha: e.target.value}))}
                placeholder="Mínimo 8 caracteres, letras, números e símbolo"
                style={{ paddingRight: 38 }}
              />
              <button type="button" onClick={() => setMostrarSenha(v => !v)}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--adm-muted)', padding:0, display:'flex' }}>
                <IconeOlho aberto={mostrarSenha} />
              </button>
            </div>
            {/* Medidor de força */}
            {form.senha && <ForcaSenha senha={form.senha} />}
            {/* Checklist de regras — aparece enquanto digita */}
            {form.senha && <RegrasSenha senha={form.senha} />}
          </div>

          {/* Confirmação de senha */}
          <div>
            <label style={s.label}>Confirmar senha {!editando && <span style={{ color:'var(--adm-muted)' }}>*</span>}</label>
            <div style={{ position: 'relative' }}>
              <input
                className="adm-input"
                type={mostrarConfirm ? 'text' : 'password'}
                value={form.confirmSenha}
                onChange={e => setForm(f => ({...f, confirmSenha: e.target.value}))}
                placeholder="Repita a senha acima"
                style={{
                  paddingRight: 38,
                  borderColor: senhasIguais ? 'var(--adm-accent)' : senhasDiferentes ? '#ef4444' : undefined,
                  transition: 'border-color .2s',
                }}
              />
              <button type="button" onClick={() => setMostrarConfirm(v => !v)}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--adm-muted)', padding:0, display:'flex' }}>
                <IconeOlho aberto={mostrarConfirm} />
              </button>
            </div>
            {/* Indicador em tempo real */}
            {form.confirmSenha && (
              <span style={{ fontSize: 11, marginTop: 4, display:'flex', alignItems:'center', gap:5,
                color: senhasIguais ? 'var(--adm-accent)' : '#ef4444', fontWeight: 600 }}>
                {senhasIguais
                  ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg> Senhas conferem</>
                  : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11"><path d="M18 6L6 18M6 6l12 12"/></svg> Senhas não conferem</>
                }
              </span>
            )}
          </div>

          {/* Perfil de acesso */}
          <div>
            <label style={s.label}>Perfil de acesso</label>
            <select className="adm-input" value={form.perfil_id} onChange={e => setForm(f => ({...f,perfil_id:e.target.value}))}>
              <option value="">Sem perfil definido</option>
              {perfis.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.nome}</option>)}
            </select>
          </div>

          {/* Ativo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm(f => ({...f,ativo:e.target.checked}))} />
            <label htmlFor="ativo" style={{ fontSize:13, color:'var(--adm-text)', cursor:'pointer' }}>Usuário ativo</label>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8 }}>
            <button type="button" onClick={onFechar} className="adm-btn adm-btn-secondary" disabled={loading}>Cancelar</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : (editando ? 'Salvar alterações' : 'Criar usuário')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalPerfil({ perfil, onSalvar, onFechar }) {
  const editando = !!perfil?.id
  const [form, setForm] = useState({
    nome:       perfil?.nome       || '',
    descricao:  perfil?.descricao  || '',
    permissoes: perfil?.permissoes || [],
    cor:        perfil?.cor        || '#6366f1',
  })
  const [loading, setLoading] = useState(false)
  const isSistema = perfil?.sistema

  function togglePerm(id) {
    setForm(f => ({
      ...f,
      permissoes: f.permissoes.includes(id) ? f.permissoes.filter(p => p !== id) : [...f.permissoes, id],
    }))
  }

  function toggleGrupo(perms) {
    const ids = perms.map(p => p.id)
    const todos = ids.every(id => form.permissoes.includes(id))
    setForm(f => ({
      ...f,
      permissoes: todos
        ? f.permissoes.filter(p => !ids.includes(p))
        : [...new Set([...f.permissoes, ...ids])],
    }))
  }

  async function handleSalvar(e) {
    e.preventDefault()
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setLoading(true)
    try {
      if (editando) {
        const r = await usuariosService.editarPerfil(perfil.id, form)
        toast.success('Perfil atualizado!'); onSalvar(r.perfil)
      } else {
        const r = await usuariosService.criarPerfil(form)
        toast.success('Perfil criado!'); onSalvar(r.perfil)
      }
      onFechar()
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const eSuperadmin = form.permissoes.includes('*')

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--adm-surface)', border:'1px solid var(--adm-border)', borderRadius:14, padding:24, width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,.5)', margin:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'var(--adm-text)' }}>{editando ? 'Editar Perfil' : 'Novo Perfil'}</h2>
          <button onClick={onFechar} className="adm-btn adm-btn-ghost adm-btn-icon adm-btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSalvar}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--adm-muted)', display:'block', marginBottom:5 }}>Nome do perfil</label>
              <input className="adm-input" value={form.nome} disabled={isSistema && editando}
                onChange={e => setForm(f => ({...f,nome:e.target.value}))} placeholder="Ex.: Jornalista" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--adm-muted)', display:'block', marginBottom:5 }}>Cor</label>
              <input type="color" value={form.cor} onChange={e => setForm(f => ({...f,cor:e.target.value}))}
                style={{ width:46, height:38, borderRadius:8, border:'1px solid var(--adm-border)', cursor:'pointer', padding:3 }} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--adm-muted)', display:'block', marginBottom:5 }}>Descrição</label>
            <input className="adm-input" value={form.descricao} onChange={e => setForm(f => ({...f,descricao:e.target.value}))} placeholder="Descreva o nível de acesso" />
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--adm-muted)' }}>Permissões</label>
              {!isSistema && (
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="checkbox" id="super" checked={eSuperadmin}
                    onChange={e => setForm(f => ({ ...f, permissoes: e.target.checked ? ['*'] : [] }))} />
                  <label htmlFor="super" style={{ fontSize:12, color:'var(--adm-text)', cursor:'pointer' }}>
                    Superadmin (acesso total)
                  </label>
                </div>
              )}
            </div>

            {isSistema ? (
              <div style={{ fontSize:12, color:'var(--adm-muted)', background:'var(--adm-surface2)', borderRadius:8, padding:10 }}>
                Perfil do sistema — permissões não editáveis.
              </div>
            ) : !eSuperadmin ? (
              <div style={{ maxHeight:240, overflowY:'auto', border:'1px solid var(--adm-border)', borderRadius:10, padding:8 }}>
                {GRUPOS_PERMISSOES.map(({ grupo, perms }) => {
                  const todosAtivos = perms.every(p => form.permissoes.includes(p.id))
                  return (
                    <div key={grupo} style={{ marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <input type="checkbox" checked={todosAtivos} onChange={() => toggleGrupo(perms)} />
                        <span style={{ fontSize:11, fontWeight:700, color:'var(--adm-muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>{grupo}</span>
                      </div>
                      <div style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:4 }}>
                        {perms.map(p => (
                          <label key={p.id} style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'var(--adm-text)', cursor:'pointer' }}>
                            <input type="checkbox" checked={form.permissoes.includes(p.id)} onChange={() => togglePerm(p.id)} />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize:12, color:'var(--adm-muted)', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:10 }}>
                ⚡ Acesso total a todas as funcionalidades do sistema.
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onFechar} className="adm-btn adm-btn-secondary" disabled={loading}>Cancelar</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : (editando ? 'Salvar' : 'Criar perfil')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsuarios() {
  const [aba,       setAba]       = useState('usuarios')
  const [usuarios,  setUsuarios]  = useState([])
  const [perfis,    setPerfis]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modalUsr,  setModalUsr]  = useState(null)
  const [modalPrf,  setModalPrf]  = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [busca,     setBusca]     = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [u, p] = await Promise.all([usuariosService.listar(), usuariosService.listarPerfis()])
      setUsuarios(u.usuarios || [])
      setPerfis(p.perfis || [])
    } catch (err) { toast.error('Erro ao carregar: ' + err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function excluirUsuario(id) {
    try {
      await usuariosService.excluir(id)
      toast.success('Usuário excluído.')
      setUsuarios(prev => prev.filter(u => (u.id || u._id) !== id))
    } catch (err) { toast.error(err.message) }
    finally { setExcluindo(null) }
  }

  async function excluirPerfil(id) {
    try {
      await usuariosService.excluirPerfil(id)
      toast.success('Perfil excluído.')
      setPerfis(prev => prev.filter(p => (p.id || p._id) !== id))
    } catch (err) { toast.error(err.message) }
    finally { setExcluindo(null) }
  }

  function onSalvarUsuario(u) {
    const id = u.id || u._id
    setUsuarios(prev => {
      const idx = prev.findIndex(x => (x.id || x._id) === id)
      return idx >= 0 ? prev.map((x,i) => i===idx ? u : x) : [u, ...prev]
    })
  }

  function onSalvarPerfil(p) {
    const id = p.id || p._id
    setPerfis(prev => {
      const idx = prev.findIndex(x => (x.id || x._id) === id)
      return idx >= 0 ? prev.map((x,i) => i===idx ? p : x) : [...prev, p]
    })
  }

  // Filtro de busca (nome ou email, case-insensitive)
  const usuariosFiltrados = usuarios.filter(u => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return u.nome?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  const s = { card: { background:'var(--adm-surface)', border:'1px solid var(--adm-border)', borderRadius:12, padding:20 } }

  return (
    <div className="adm-page">
      {modalUsr && (
        <ModalUsuario
          usuario={modalUsr === 'novo' ? null : modalUsr}
          perfis={perfis}
          onSalvar={onSalvarUsuario}
          onFechar={() => setModalUsr(null)}
        />
      )}
      {modalPrf && (
        <ModalPerfil
          perfil={modalPrf === 'novo' ? null : modalPrf}
          onSalvar={onSalvarPerfil}
          onFechar={() => setModalPrf(null)}
        />
      )}

      {excluindo && (
        <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ ...s.card, maxWidth:360, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.5)' }}>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--adm-text)', marginBottom:8 }}>Confirmar exclusão</p>
            <p style={{ fontSize:13, color:'var(--adm-muted)', marginBottom:20 }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setExcluindo(null)} className="adm-btn adm-btn-secondary">Cancelar</button>
              <button onClick={() => excluindo.tipo === 'usuario' ? excluirUsuario(excluindo.id) : excluirPerfil(excluindo.id)}
                className="adm-btn adm-btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-page-header">
        <div>
          <div className="adm-page-title">Usuários &amp; Perfis</div>
          <div className="adm-page-sub">Gerencie os acessos ao painel administrativo</div>
        </div>
        <button onClick={() => aba === 'usuarios' ? setModalUsr('novo') : setModalPrf('novo')}
          className="adm-btn adm-btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><path d="M12 5v14M5 12h14"/></svg>
          {aba === 'usuarios' ? 'Novo usuário' : 'Novo perfil'}
        </button>
      </div>

      {/* Abas */}
      <div className="adm-tabs">
        {[['usuarios','Usuários'],['perfis','Perfis de Acesso']].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)}
            className={`adm-tab-btn${aba === id ? ' active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Campo de busca (apenas na aba de usuários) */}
      {aba === 'usuarios' && (
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"
            style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--adm-muted)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="adm-input"
            style={{ paddingLeft: 32 }}
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'var(--adm-muted)', fontSize:13 }}>Carregando...</div>
      ) : aba === 'usuarios' ? (
        <div style={s.card}>
          {usuariosFiltrados.length === 0 ? (
            <p style={{ textAlign:'center', color:'var(--adm-muted)', fontSize:13, padding:'32px 0' }}>
              {busca ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.'}
            </p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {usuariosFiltrados.map(u => {
                const uid = u.id || u._id
                const perfil = u.perfil_id
                return (
                  <div key={uid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'var(--adm-surface2)', borderRadius:10, padding:'12px 14px', flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--adm-accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#fff', flexShrink:0 }}>
                        {(u.nome || u.email)?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:'var(--adm-text)' }}>{u.nome}</div>
                        <div style={{ fontSize:11, color:'var(--adm-muted)' }}>{u.email}</div>
                        {u.ultimo_acesso && (
                          <div style={{ fontSize:10, color:'var(--adm-muted)', marginTop:1 }}>
                            Último acesso: {new Date(u.ultimo_acesso).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                      {perfil && <Badge cor={perfil.cor || '#6366f1'} label={perfil.nome} />}
                      {!u.ativo && <Badge cor="#ef4444" label="Inativo" />}
                      {u.bloqueado_ate && new Date(u.bloqueado_ate) > new Date() && (
                        <Badge cor="#f97316" label="Bloqueado" />
                      )}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setModalUsr(u)} className="adm-btn adm-btn-ghost adm-btn-sm">Editar</button>
                      <button onClick={() => setExcluindo({ tipo:'usuario', id: uid })} className="adm-btn adm-btn-danger adm-btn-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {perfis.map(p => {
            const pid = p.id || p._id
            const qtdUsers = usuarios.filter(u => {
              const ref = u.perfil_id?.id || u.perfil_id
              return ref === pid
            }).length
            return (
              <div key={pid} style={{ ...s.card, position:'relative' }}>
                {p.sistema && (
                  <span style={{ position:'absolute', top:10, right:10, fontSize:10, fontWeight:700, color:'var(--adm-muted)', background:'var(--adm-surface2)', borderRadius:6, padding:'2px 8px' }}>
                    SISTEMA
                  </span>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:p.cor, flexShrink:0 }} />
                  <span style={{ fontWeight:700, fontSize:14, color:'var(--adm-text)' }}>{p.nome}</span>
                </div>
                <p style={{ fontSize:12, color:'var(--adm-muted)', marginBottom:10, lineHeight:1.5, minHeight:32 }}>{p.descricao || '—'}</p>
                <div style={{ fontSize:11, color:'var(--adm-muted)', marginBottom:12 }}>
                  {p.permissoes?.includes('*')
                    ? '⚡ Acesso total'
                    : `${p.permissoes?.length || 0} permissão(ões)`
                  } · {qtdUsers} usuário(s)
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => setModalPrf(p)} className="adm-btn adm-btn-ghost adm-btn-sm" style={{ flex:1 }}>Editar</button>
                  {!p.sistema && (
                    <button onClick={() => setExcluindo({ tipo:'perfil', id: pid })} className="adm-btn adm-btn-danger adm-btn-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
