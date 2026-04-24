/**
 * AdminInfraestrutura.jsx
 *
 * Módulo de gerenciamento de infraestrutura do IguaNews:
 *  • Aba Configurações — credenciais do MongoDB e Cloudinary
 *  • Aba MongoDB       — status, coleções, documentos, estatísticas, índices
 *  • Aba Cloudinary    — uso da conta, galeria de mídia
 *  • Aba Sistema       — métricas de CPU/memória, limpeza de cache
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { infraestruturaService, setupService } from '../../services/api'
import toast from 'react-hot-toast'

// ─── Tokens visuais (alinhados ao resto do admin) ──────────────────────────────
import { T as C } from '../../themes/tokens'
import AdminIcon from '../../components/admin/ui/AdminIcon'

// Alias para compatibilidade com JSX já escrito abaixo
const Ico = {
  gear:    <AdminIcon name="gear"    size={16} />,
  db:      <AdminIcon name="db"      size={16} />,
  cloud:   <AdminIcon name="cloud"   size={16} />,
  eye:     <AdminIcon name="eye"     size={14} />,
  eyeOff:  <AdminIcon name="eyeOff"  size={14} />,
  trash:   <AdminIcon name="trash"   size={14} />,
  save:    <AdminIcon name="save"    size={14} />,
  refresh: <AdminIcon name="refresh" size={14} />,
  check:   <AdminIcon name="check"   size={14} />,
  x:       <AdminIcon name="x"       size={14} />,
  chevL:   <AdminIcon name="chevL"   size={14} />,
  chevR:   <AdminIcon name="chevR"   size={14} />,
  img:     <AdminIcon name="img"     size={14} />,
  video:   <AdminIcon name="video"   size={14} />,
  info:    <AdminIcon name="info"    size={14} />,
  copy:    <AdminIcon name="copy"    size={13} />,
  extLink: <AdminIcon name="extLink" size={12} />,
  cpu:     <AdminIcon name="cpu"     size={16} />,
  memory:  <AdminIcon name="memory"  size={16} />,
  clear:   <AdminIcon name="clear"   size={14} />,
  index:   <AdminIcon name="index"   size={14} />,
}

function Spin({ size = 16 }) {
  return <AdminIcon name="spinSm" size={size} />
}

// ─── Componentes base ─────────────────────────────────────────────────────────
function PageCard({ children, style }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: '20px 18px', ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <span style={{ color: C.blue }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{children}</h2>
    </div>
  )
}

function Badge({ color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: color + '22', color,
    }}>{children}</span>
  )
}

function Btn({ onClick, disabled, loading, variant = 'primary', small, children, style }) {
  const colors = {
    primary: { bg: '#1d4ed8', hov: '#2563eb' },
    success: { bg: '#166534', hov: '#15803d' },
    danger:  { bg: '#7f1d1d', hov: '#991b1b' },
    ghost:   { bg: 'transparent', hov: C.surf2, border: C.border },
  }
  const clr = colors[variant] || colors.primary
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: small ? '6px 12px' : '9px 16px',
        border: clr.border ? `1px solid ${clr.border}` : 'none',
        borderRadius: 8, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: small ? 12 : 13, fontWeight: 600,
        background: clr.bg, color: disabled ? C.muted : C.text,
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity .15s, background .15s',
        ...style,
      }}
    >
      {loading ? <Spin size={13} /> : null}
      {children}
    </button>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder, helper, showToggle, style }) {
  const [vis, setVis] = useState(false)
  const inputType = showToggle ? (vis ? 'text' : 'password') : type
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.subtle, marginBottom: 5, letterSpacing: '.04em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: showToggle ? '9px 40px 9px 12px' : '9px 12px',
            borderRadius: 8, fontSize: 13, background: C.bg,
            border: `1.5px solid ${C.border}`, color: C.text,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVis(!vis)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}
          >
            {vis ? Ico.eyeOff : Ico.eye}
          </button>
        )}
      </div>
      {helper && <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{helper}</p>}
    </div>
  )
}

function StatusDot({ ok }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: ok ? C.green : C.red,
      boxShadow: ok ? `0 0 6px ${C.green}88` : `0 0 6px ${C.red}88`,
    }}/>
  )
}

function BarraProgresso({ pct, color }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct || 0)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }}/>
    </div>
  )
}

function ModalConfirm({ titulo, descricao, loading, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 380, width: '100%' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{titulo}</p>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.55 }}>{descricao}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn onClick={onCancel} variant="ghost" disabled={loading}>Cancelar</Btn>
          <Btn onClick={onConfirm} variant="danger" loading={loading}>Confirmar exclusão</Btn>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  ABA 1 — CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════
function AbaConfiguracoes() {
  const [form, setForm] = useState({
    mongo_uri: '', cloudinary_cloud_name: '', cloudinary_api_key: '', cloudinary_api_secret: '',
  })
  const [carregando, setCarregando]   = useState(true)
  const [salvando,   setSalvando]     = useState(false)
  const [testando,   setTestando]     = useState(false)
  const [resultTeste, setResultTeste] = useState(null)

  useEffect(() => {
    setCarregando(true)
    setupService.lerEnvConfig()
      .then(d => setForm({
        mongo_uri:               d.mongo_uri               || '',
        cloudinary_cloud_name:   d.cloudinary_cloud_name   || '',
        cloudinary_api_key:      d.cloudinary_api_key      || '',
        cloudinary_api_secret:   d.cloudinary_api_secret   || '',
      }))
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setCarregando(false))
  }, [])

  async function handleSalvar() {
    setSalvando(true)
    try {
      await setupService.salvarEnvConfig(form)
      toast.success('Configurações salvas! As conexões serão usadas na próxima requisição.')
    } catch (e) {
      toast.error(e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleTestar() {
    setTestando(true)
    setResultTeste(null)
    try {
      const r = await infraestruturaService.testarConexoes()
      setResultTeste(r)
    } catch (e) {
      toast.error(e.message || 'Erro ao testar conexões')
    } finally {
      setTestando(false)
    }
  }

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Spin size={24} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ background: C.blue + '18', border: `1px solid ${C.blue}40`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <span style={{ color: C.blue, flexShrink: 0, marginTop: 1 }}>{Ico.info}</span>
        <div style={{ fontSize: 13, color: C.subtle, lineHeight: 1.6 }}>
          <b style={{ color: C.text }}>Onde obter as credenciais?</b><br/>
          <b>MongoDB:</b> <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" style={{ color: C.blue }}>cloud.mongodb.com</a> → Database → Connect → Drivers → copie a Connection String.<br/>
          <b>Cloudinary:</b> <a href="https://console.cloudinary.com/settings/api-keys" target="_blank" rel="noreferrer" style={{ color: C.blue }}>console.cloudinary.com</a> → Settings → API Keys.
        </div>
      </div>

      <PageCard>
        <SectionTitle icon={Ico.db}>MongoDB</SectionTitle>
        <Input
          label="Connection String (URI)"
          value={form.mongo_uri}
          onChange={v => setForm(p => ({ ...p, mongo_uri: v }))}
          showToggle
          placeholder="mongodb+srv://usuario:senha@cluster.mongodb.net/iguanews"
        />
      </PageCard>

      <PageCard>
        <SectionTitle icon={Ico.cloud}>Cloudinary</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <Input
            label="Cloud Name"
            value={form.cloudinary_cloud_name}
            onChange={v => setForm(p => ({ ...p, cloudinary_cloud_name: v }))}
            placeholder="meu-cloud"
          />
          <Input
            label="API Key"
            value={form.cloudinary_api_key}
            onChange={v => setForm(p => ({ ...p, cloudinary_api_key: v }))}
            placeholder="123456789012345"
          />
        </div>
        <Input
          label="API Secret"
          value={form.cloudinary_api_secret}
          onChange={v => setForm(p => ({ ...p, cloudinary_api_secret: v }))}
          showToggle
          placeholder="••••••••••••••••••••••"
          helper="Nunca compartilhe o API Secret."
        />
      </PageCard>

      {resultTeste && (
        <PageCard>
          <SectionTitle icon={Ico.check}>Resultado do Teste</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: C.surf2, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <StatusDot ok={resultTeste.mongodb?.ok} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>MongoDB</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                Estado: <b style={{ color: C.text }}>{resultTeste.mongodb?.estado}</b><br/>
                Banco: <b style={{ color: C.text }}>{resultTeste.mongodb?.db}</b>
              </p>
            </div>
            <div style={{ background: C.surf2, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <StatusDot ok={resultTeste.cloudinary?.ok} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Cloudinary</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                {resultTeste.cloudinary?.ok
                  ? <><b style={{ color: C.green }}>Conectado ✓</b></>
                  : <><b style={{ color: C.red }}>Erro:</b> {resultTeste.cloudinary?.erro}</>
                }
              </p>
            </div>
          </div>
        </PageCard>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={handleSalvar} loading={salvando} variant="success">
          {Ico.save} Salvar Configurações
        </Btn>
        <Btn onClick={handleTestar} loading={testando} variant="ghost">
          {Ico.refresh} Testar Conexões
        </Btn>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  ABA 2 — MONGODB
// ═══════════════════════════════════════════════════════════════
function AbaMongoDB() {
  const [status,    setStatus]    = useState(null)
  const [colecoes,  setColecoes]  = useState([])
  const [colSel,    setColSel]    = useState(null)
  const [docs,      setDocs]      = useState(null)
  const [page,      setPage]      = useState(1)
  const [busca,     setBusca]     = useState('')
  const [carregando, setCarregando] = useState(true)
  const [loadDocs,  setLoadDocs]  = useState(false)
  const [docVis,    setDocVis]    = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)
  const [deletando,  setDeletando] = useState(false)

  const [stats, setStats] = useState(null)
  const [carregandoStats, setCarregandoStats] = useState(false)

  const [indices, setIndices] = useState([])
  const [carregandoIndices, setCarregandoIndices] = useState(false)
  const [novoIndice, setNovoIndice] = useState({ campo: '', valor: 1, unique: false })
  const [criandoIndice, setCriandoIndice] = useState(false)
  const [removendoIndice, setRemovendoIndice] = useState(null)

  useEffect(() => {
    async function carregar() {
      try {
        const [s, c] = await Promise.all([
          infraestruturaService.mongoStatus(),
          infraestruturaService.mongoColecoes(),
        ])
        setStatus(s)
        setColecoes(c.colecoes || [])
      } catch (e) {
        toast.error(e.message || 'Erro ao carregar MongoDB')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const carregarDocs = useCallback(async (nome, pg = 1, q = '') => {
    setLoadDocs(true)
    try {
      const d = await infraestruturaService.mongoDocumentos(nome, pg, 20, q)
      setDocs(d)
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar documentos')
    } finally {
      setLoadDocs(false)
    }
  }, [])

  const carregarStatsEIndices = useCallback(async (nome) => {
    if (!nome) return
    setCarregandoStats(true)
    setCarregandoIndices(true)
    try {
      const [statsData, indicesData] = await Promise.all([
        infraestruturaService.mongoStatsColecao(nome),
        infraestruturaService.mongoIndices(nome),
      ])
      setStats(statsData)
      setIndices(indicesData.indices || [])
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar metadados da coleção')
    } finally {
      setCarregandoStats(false)
      setCarregandoIndices(false)
    }
  }, [])

  function selecionarColecao(nome) {
    setColSel(nome)
    setPage(1)
    setBusca('')
    setDocs(null)
    setStats(null)
    setIndices([])
    carregarDocs(nome, 1, '')
    carregarStatsEIndices(nome)
  }

  async function handleDelete() {
    if (!delConfirm) return
    setDeletando(true)
    try {
      await infraestruturaService.mongoExcluirDoc(delConfirm.colecao, delConfirm.id)
      toast.success('Documento excluído')
      setDelConfirm(null)
      carregarDocs(colSel, page, busca)
    } catch (e) {
      toast.error(e.message || 'Erro ao excluir')
    } finally {
      setDeletando(false)
    }
  }

  async function criarIndice() {
    if (!novoIndice.campo.trim()) {
      toast.error('Informe o nome do campo')
      return
    }
    const campos = { [novoIndice.campo.trim()]: parseInt(novoIndice.valor) }
    setCriandoIndice(true)
    try {
      await infraestruturaService.mongoCriarIndice(colSel, campos, novoIndice.unique)
      toast.success('Índice criado com sucesso')
      setNovoIndice({ campo: '', valor: 1, unique: false })
      carregarStatsEIndices(colSel)
    } catch (e) {
      toast.error(e.message || 'Erro ao criar índice')
    } finally {
      setCriandoIndice(false)
    }
  }

  async function removerIndice(nomeIndice) {
    setRemovendoIndice(nomeIndice)
    try {
      await infraestruturaService.mongoRemoverIndice(colSel, nomeIndice)
      toast.success(`Índice ${nomeIndice} removido`)
      carregarStatsEIndices(colSel)
    } catch (e) {
      toast.error(e.message || 'Erro ao remover índice')
    } finally {
      setRemovendoIndice(null)
    }
  }

  if (carregando) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin size={24} /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {delConfirm && (
        <ModalConfirm
          titulo="Excluir documento?"
          descricao={`Isso vai remover permanentemente o documento _id: ${delConfirm.id} da coleção "${delConfirm.colecao}".`}
          loading={deletando}
          onConfirm={handleDelete}
          onCancel={() => setDelConfirm(null)}
        />
      )}

      {status && (
        <PageCard>
          <SectionTitle icon={Ico.db}>Status da Conexão</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'Estado',    valor: status.estado,      cor: status.conectado ? C.green : C.red },
              { label: 'Banco',     valor: status.banco },
              { label: 'Host',      valor: status.host },
              { label: 'Versão',    valor: status.versao },
              { label: 'Coleções',  valor: String(status.colecoes) },
              { label: 'Objetos',   valor: String(status.objetos) },
              { label: 'Dados',     valor: status.tamanho_dados },
              { label: 'Storage',   valor: status.tamanho_armazenamento },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{ background: C.surf2, borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: cor || C.text, margin: 0, wordBreak: 'break-all' }}>{valor || '—'}</p>
              </div>
            ))}
          </div>
        </PageCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, alignItems: 'start' }}>
        <PageCard style={{ padding: '14px 10px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 10px 6px' }}>Coleções ({colecoes.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {colecoes.map(col => (
              <button
                key={col.nome}
                onClick={() => selecionarColecao(col.nome)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: colSel === col.nome ? C.blue + '22' : 'transparent',
                  color: colSel === col.nome ? C.blue : C.text,
                  fontSize: 13, textAlign: 'left', transition: 'background .15s',
                }}
              >
                <span style={{ fontWeight: colSel === col.nome ? 700 : 400, fontSize: 12, wordBreak: 'break-all' }}>{col.nome}</span>
                <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 4 }}>{col.contagem >= 0 ? col.contagem : '?'}</span>
              </button>
            ))}
          </div>
        </PageCard>

        <PageCard>
          {!colSel ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: C.muted }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>👈</span>
              <p style={{ margin: 0, fontSize: 13 }}>Selecione uma coleção</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>{colSel}</h3>
                  {docs && <Badge color={C.blue}>{docs.total} docs</Badge>}
                </div>
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setPage(1); carregarDocs(colSel, 1, busca) } }}
                  placeholder="Buscar por _id… (Enter)"
                  style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, width: 220 }}
                />
              </div>

              {carregandoStats ? (
                <div style={{ padding: 8, textAlign: 'center' }}><Spin size={16} /></div>
              ) : stats && (
                <div style={{ marginBottom: 16, background: C.surf2, borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div><span style={{ color: C.muted }}>📦 Tamanho:</span> <b>{formatBytes(stats.tamanho)}</b></div>
                  <div><span style={{ color: C.muted }}>💾 Armazenamento:</span> <b>{formatBytes(stats.armazenamento)}</b></div>
                  <div><span style={{ color: C.muted }}>📏 Obj médio:</span> <b>{formatBytes(stats.avgObjSize)}</b></div>
                  <div><span style={{ color: C.muted }}>🔍 Índices:</span> <b>{stats.indices}</b></div>
                </div>
              )}

              <details style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text, padding: '6px 0', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {Ico.index} Gerenciar índices
                </summary>
                <div style={{ marginTop: 12, background: C.surf2, borderRadius: 8, padding: '10px 12px' }}>
                  {carregandoIndices ? (
                    <Spin size={16} />
                  ) : indices.length === 0 ? (
                    <p style={{ fontSize: 12, color: C.muted }}>Nenhum índice além do _id_</p>
                  ) : (
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ textAlign: 'left', padding: '5px 0' }}>Nome</th>
                          <th style={{ textAlign: 'left', padding: '5px 0' }}>Campos</th>
                          <th style={{ textAlign: 'center', padding: '5px 0' }}>Unique</th>
                          <th style={{ textAlign: 'right', padding: '5px 0' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {indices.map(idx => (
                          <tr key={idx.name} style={{ borderBottom: `1px solid ${C.border}50` }}>
                            <td style={{ padding: '6px 0', fontFamily: 'monospace', fontSize: 11 }}>{idx.name}</td>
                            <td style={{ padding: '6px 0', fontFamily: 'monospace', fontSize: 11 }}>{JSON.stringify(idx.key)}</td>
                            <td style={{ padding: '6px 0', textAlign: 'center' }}>{idx.unique ? '✅' : '❌'}</td>
                            <td style={{ padding: '6px 0', textAlign: 'right' }}>
                              {idx.name !== '_id_' && (
                                <button onClick={() => removerIndice(idx.name)} disabled={removendoIndice === idx.name}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 11 }}>
                                  {removendoIndice === idx.name ? <Spin size={12} /> : '🗑️'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                    <p style={{ fontSize: 12, marginBottom: 6 }}>Criar novo índice composto</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="campo"
                        value={novoIndice.campo}
                        onChange={e => setNovoIndice(i => ({ ...i, campo: e.target.value }))}
                        style={{ background: C.bg, border: `1px solid ${C.border}`, padding: '5px 8px', borderRadius: 6, fontSize: 12, color: C.text, width: 120 }}
                      />
                      <select
                        value={novoIndice.valor}
                        onChange={e => setNovoIndice(i => ({ ...i, valor: e.target.value }))}
                        style={{ background: C.bg, border: `1px solid ${C.border}`, padding: '5px 8px', borderRadius: 6, fontSize: 12, color: C.text }}
                      >
                        <option value="1">Asc (1)</option>
                        <option value="-1">Desc (-1)</option>
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                        <input type="checkbox" checked={novoIndice.unique} onChange={e => setNovoIndice(i => ({ ...i, unique: e.target.checked }))} />
                        Único
                      </label>
                      <Btn onClick={criarIndice} loading={criandoIndice} small variant="primary">Criar índice</Btn>
                    </div>
                  </div>
                </div>
              </details>

              {loadDocs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spin size={20} /></div>
              ) : docs ? (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ padding: '7px 10px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>_id</th>
                          <th style={{ padding: '7px 10px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>Campos</th>
                          <th style={{ padding: '7px 10px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docs.documentos.map(doc => {
                          const id = doc._id?.toString() || '—'
                          const campos = Object.keys(doc).filter(k => k !== '_id').slice(0, 3)
                          return (
                            <tr key={id} style={{ borderBottom: `1px solid ${C.border}30` }}>
                              <td style={{ padding: '8px 10px', color: C.subtle, fontFamily: 'monospace', fontSize: 11, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {id}
                              </td>
                              <td style={{ padding: '8px 10px', color: C.muted }}>
                                {campos.map(k => {
                                  let v = doc[k]
                                  if (v && typeof v === 'object') v = '{...}'
                                  else if (typeof v === 'string' && v.length > 30) v = v.slice(0, 30) + '…'
                                  return (
                                    <span key={k} style={{ marginRight: 12 }}>
                                      <span style={{ color: C.blue }}>{k}:</span>{' '}
                                      <span style={{ color: C.text }}>{String(v)}</span>
                                    </span>
                                  )
                                })}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <Btn small variant="ghost" onClick={() => setDocVis(doc)}>
                                  {Ico.eye}
                                </Btn>
                                <Btn small variant="danger" onClick={() => setDelConfirm({ id, colecao: colSel })}>
                                  {Ico.trash}
                                </Btn>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {docs.paginas > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 14 }}>
                      <Btn small variant="ghost" disabled={page <= 1} onClick={() => { const np = page - 1; setPage(np); carregarDocs(colSel, np, busca) }}>
                        {Ico.chevL} Anterior
                      </Btn>
                      <span style={{ fontSize: 12, color: C.muted }}>{page} / {docs.paginas}</span>
                      <Btn small variant="ghost" disabled={page >= docs.paginas} onClick={() => { const np = page + 1; setPage(np); carregarDocs(colSel, np, busca) }}>
                        Próxima {Ico.chevR}
                      </Btn>
                    </div>
                  )}
                </>
              ) : null}
            </>
          )}
        </PageCard>
      </div>

      {docVis && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, maxWidth: 640, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Documento — {colSel}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn small variant="ghost" onClick={() => { navigator.clipboard.writeText(JSON.stringify(docVis, null, 2)); toast.success('JSON copiado!') }}>
                  {Ico.copy} Copiar
                </Btn>
                <Btn small variant="ghost" onClick={() => setDocVis(null)}>{Ico.x}</Btn>
              </div>
            </div>
            <pre style={{ overflowY: 'auto', flex: 1, margin: 0, padding: '12px 14px', background: C.bg, borderRadius: 8, fontSize: 12, color: C.subtle, lineHeight: 1.6 }}>
              {JSON.stringify(docVis, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++ }
  return `${bytes.toFixed(1)} ${units[i]}`
}

// ═══════════════════════════════════════════════════════════════
//  ABA 3 — CLOUDINARY
// ═══════════════════════════════════════════════════════════════
function AbaCloudinary() {
  const [status,     setStatus]     = useState(null)
  const [recursos,   setRecursos]   = useState([])
  const [cursor,     setCursor]     = useState(null)
  const [tipo,       setTipo]       = useState('image')
  const [carregando, setCarregando] = useState(true)
  const [loadMore,   setLoadMore]   = useState(false)
  const [erro,       setErro]       = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)
  const [deletando,  setDeletando]  = useState(false)

  async function carregarStatus() {
    try {
      const s = await infraestruturaService.cloudinaryStatus()
      setStatus(s)
    } catch (e) {
      setErro(e.message)
    }
  }

  async function carregarRecursos(novoCursor = null, novoTipo = tipo, reset = false) {
    if (reset) setCarregando(true)
    else setLoadMore(true)
    try {
      const r = await infraestruturaService.cloudinaryRecursos(novoTipo, 20, novoCursor)
      setRecursos(prev => reset ? r.recursos : [...prev, ...r.recursos])
      setCursor(r.cursor_proximo)
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar mídia')
    } finally {
      setCarregando(false)
      setLoadMore(false)
    }
  }

  useEffect(() => {
    carregarStatus()
    carregarRecursos(null, tipo, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function trocarTipo(t) {
    setTipo(t)
    setRecursos([])
    setCursor(null)
    carregarRecursos(null, t, true)
  }

  async function handleDelete() {
    if (!delConfirm) return
    setDeletando(true)
    try {
      await infraestruturaService.cloudinaryExcluir(delConfirm.public_id, delConfirm.tipo)
      toast.success('Recurso excluído do Cloudinary')
      setRecursos(prev => prev.filter(r => r.public_id !== delConfirm.public_id))
      setDelConfirm(null)
      await carregarStatus()
    } catch (e) {
      toast.error(e.message || 'Erro ao excluir')
    } finally {
      setDeletando(false)
    }
  }

  if (erro) return (
    <PageCard>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>⚠️</span>
        <p style={{ color: C.red, fontSize: 13, marginBottom: 14 }}>{erro}</p>
        <Btn onClick={() => { setErro(null); carregarStatus(); carregarRecursos(null, tipo, true) }} variant="ghost">
          {Ico.refresh} Tentar novamente
        </Btn>
      </div>
    </PageCard>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {delConfirm && (
        <ModalConfirm
          titulo="Excluir recurso do Cloudinary?"
          descricao={`O arquivo "${delConfirm.public_id}" será permanentemente removido.`}
          loading={deletando}
          onConfirm={handleDelete}
          onCancel={() => setDelConfirm(null)}
        />
      )}

      {status && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Cloud Name', valor: status.cloud_name, sub: status.plano },
            { label: 'Armazenamento', valor: status.storage_fmt, sub: `de ${status.storage_limite}`, barra: status.storage_pct, cor: status.storage_pct > 80 ? C.red : C.green },
            { label: 'Bandwidth', valor: status.bandwidth_fmt, sub: `de ${status.bandwidth_limite}`, barra: status.bandwidth_pct, cor: status.bandwidth_pct > 80 ? C.red : C.blue },
            { label: 'Imagens', valor: String(status.total_imagens) },
            { label: 'Vídeos', valor: String(status.total_videos) },
            { label: 'Transformações', valor: String(status.transformacoes) },
          ].map(({ label, valor, sub, barra, cor }) => (
            <div key={label} style={{ background: C.surf2, borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: cor || C.text, margin: '0 0 2px' }}>{valor}</p>
              {sub  && <p style={{ fontSize: 11, color: C.muted, margin: '0 0 6px' }}>{sub}</p>}
              {barra !== undefined && <BarraProgresso pct={barra} color={cor} />}
            </div>
          ))}
        </div>
      )}

      <PageCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <SectionTitle icon={tipo === 'image' ? Ico.img : Ico.video}>
            {tipo === 'image' ? 'Imagens' : 'Vídeos'} ({recursos.length})
          </SectionTitle>
          <div style={{ display: 'flex', gap: 6 }}>
            {['image', 'video'].map(t => (
              <button
                key={t}
                onClick={() => trocarTipo(t)}
                style={{
                  padding: '6px 14px', borderRadius: 7, border: `1px solid ${t === tipo ? C.blue : C.border}`,
                  background: t === tipo ? C.blue + '22' : 'transparent',
                  color: t === tipo ? C.blue : C.muted, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >
                {t === 'image' ? '🖼 Imagens' : '🎬 Vídeos'}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin size={24} /></div>
        ) : recursos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: C.muted }}>
            <p style={{ margin: 0, fontSize: 13 }}>Nenhum recurso encontrado</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {recursos.map(r => (
                <div key={r.public_id} style={{
                  background: C.surf2, borderRadius: 10, overflow: 'hidden',
                  border: `1px solid ${C.border}`,
                  display: 'flex', flexDirection: 'column',
                }}>
                  {r.tipo === 'image' ? (
                    <div style={{ height: 100, overflow: 'hidden', background: C.bg }}>
                      <img src={r.display_url} alt={r.public_id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" onError={e => e.target.style.display = 'none'} />
                    </div>
                  ) : (
                    <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, color: C.muted, fontSize: 28 }}>🎬</div>
                  )}
                  <div style={{ padding: '8px 10px', flex: 1 }}>
                    <p style={{ fontSize: 11, color: C.subtle, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.public_id}>
                      {r.public_id.split('/').pop()}
                    </p>
                    <p style={{ fontSize: 10, color: C.muted, margin: '0 0 6px' }}>
                      {r.bytes_fmt} {r.largura ? `· ${r.largura}×${r.altura}` : ''}
                    </p>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <a href={r.display_url} target="_blank" rel="noreferrer"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 0', borderRadius: 6, background: C.blue + '22', color: C.blue, fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>
                        {Ico.extLink} Ver
                      </a>
                      <button
                        onClick={() => setDelConfirm({ public_id: r.public_id, tipo: r.tipo })}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 0', borderRadius: 6, background: C.red + '22', color: C.red, fontSize: 11, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        {Ico.trash} Apagar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cursor && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                <Btn onClick={() => carregarRecursos(cursor, tipo, false)} loading={loadMore} variant="ghost">
                  {Ico.refresh} Carregar mais
                </Btn>
              </div>
            )}
          </>
        )}
      </PageCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  ABA 4 — SISTEMA
// ═══════════════════════════════════════════════════════════════
function AbaSistema() {
  const [metricas, setMetricas] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [limpandoCache, setLimpandoCache] = useState(false)

  async function carregarMetricas() {
    setCarregando(true)
    try {
      const data = await infraestruturaService.sistemaMetricas()
      setMetricas(data)
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar métricas')
    } finally {
      setCarregando(false)
    }
  }

  async function limparCache() {
    setLimpandoCache(true)
    try {
      const res = await infraestruturaService.limparCache()
      toast.success(res.mensagem || 'Cache limpo com sucesso')
      carregarMetricas()
    } catch (err) {
      toast.error(err.message || 'Erro ao limpar cache')
    } finally {
      setLimpandoCache(false)
    }
  }

  useEffect(() => {
    carregarMetricas()
  }, [])

  if (carregando) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin size={24} /></div>

  const { cpu, memoria, processo } = metricas || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageCard>
        <SectionTitle icon={Ico.cpu}>Processador</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <div><span style={{ color: C.muted }}>Cores:</span> <b>{cpu?.cores}</b></div>
          <div><span style={{ color: C.muted }}>Load 1 min:</span> <b>{cpu?.loadAvg1min?.toFixed(2)}</b></div>
          <div><span style={{ color: C.muted }}>Load 5 min:</span> <b>{cpu?.loadAvg5min?.toFixed(2)}</b></div>
          <div><span style={{ color: C.muted }}>Load 15 min:</span> <b>{cpu?.loadAvg15min?.toFixed(2)}</b></div>
        </div>
      </PageCard>

      <PageCard>
        <SectionTitle icon={Ico.memory}>Memória</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <div><span style={{ color: C.muted }}>Total (sistema):</span> <b>{formatBytes(memoria?.total)}</b></div>
          <div><span style={{ color: C.muted }}>Livre:</span> <b>{formatBytes(memoria?.livre)}</b></div>
          <div><span style={{ color: C.muted }}>Uso %:</span> <b>{memoria?.usoPercentual?.toFixed(1)}%</b></div>
          <BarraProgresso pct={memoria?.usoPercentual || 0} color={C.green} />
        </div>
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Processo Node.js</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            <div><span style={{ color: C.muted }}>RSS:</span> <b>{formatBytes(memoria?.rss)}</b></div>
            <div><span style={{ color: C.muted }}>Heap total:</span> <b>{formatBytes(memoria?.heapTotal)}</b></div>
            <div><span style={{ color: C.muted }}>Heap usado:</span> <b>{formatBytes(memoria?.heapUsed)}</b></div>
          </div>
        </div>
      </PageCard>

      <PageCard>
        <SectionTitle icon={Ico.info}>Informações do Servidor</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <div><span style={{ color: C.muted }}>Uptime:</span> <b>{processo?.uptimeFormatado || '—'}</b></div>
          <div><span style={{ color: C.muted }}>Node.js:</span> <b>{processo?.versaoNode}</b></div>
          <div><span style={{ color: C.muted }}>PID:</span> <b>{processo?.pid}</b></div>
          <div><span style={{ color: C.muted }}>Plataforma:</span> <b>{processo?.plataforma} ({processo?.arquitetura})</b></div>
          <div><span style={{ color: C.muted }}>Última atualização:</span> <b>{new Date(metricas?.timestamp).toLocaleString('pt-BR')}</b></div>
        </div>
      </PageCard>

      <PageCard>
        <SectionTitle icon={Ico.clear}>Cache</SectionTitle>
        <p style={{ fontSize: 13, marginBottom: 14, color: C.muted }}>
          O cache armazena respostas de rotas como configurações, módulos, etc. Limpe-o após alterar dados importantes no backend.
        </p>
        <Btn onClick={limparCache} loading={limpandoCache} variant="danger" style={{ width: 'auto' }}>
          {Ico.clear} Limpar todo o cache
        </Btn>
      </PageCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const ABAS = [
  { id: 'config',     label: 'Configurações', icon: Ico.gear  },
  { id: 'mongodb',    label: 'MongoDB',        icon: Ico.db    },
  { id: 'cloudinary', label: 'Cloudinary',     icon: Ico.cloud },
  { id: 'sistema',    label: 'Sistema',        icon: Ico.cpu   },
]

export default function AdminInfraestrutura() {
  const [abaAtiva, setAbaAtiva] = useState('config')

  return (
    <>
      <style>{`
        @keyframes infra-spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .infra-grid-cols { grid-template-columns: 1fr !important; }
          .infra-hide-sm   { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 960 }}>
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Infraestrutura</div>
            <div className="adm-page-sub">Gerencie as conexões, o banco de dados, o Cloudinary e monitore o servidor.</div>
          </div>
        </div>

        {/* ── Barra de abas ── */}
        <div className="adm-tabs">
          {ABAS.map(aba => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`adm-tab-btn${abaAtiva === aba.id ? ' active' : ''}`}
            >
              {aba.icon} {aba.label}
            </button>
          ))}
        </div>

        {abaAtiva === 'config'     && <AbaConfiguracoes />}
        {abaAtiva === 'mongodb'    && <AbaMongoDB />}
        {abaAtiva === 'cloudinary' && <AbaCloudinary />}
        {abaAtiva === 'sistema'    && <AbaSistema />}
      </div>
    </>
  )
}