/**
 * AdminSetup.jsx — Instalador do IguaNews
 *
 * Melhorias v2:
 *  • Correção do bug ConfiguracaoHome (chave required)
 *  • Toggle para ver/ocultar senha + indicador de força
 *  • Seleção granular de dados a instalar (seed seletivo)
 *  • Seção "Configurações Avançadas" para editar MongoDB e Cloudinary
 */
import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { setupService }        from '../../services/api'
import toast                   from 'react-hot-toast'

/* ─── Tokens visuais ──────────────────────────────────────────── */
const C = {
  pageBg:    '#0f172a',
  surface:   '#1e293b',
  elevated:  '#263248',
  border:    '#334155',
  borderFoc: '#3b82f6',
  text:      '#f1f5f9',
  muted:     '#64748b',
  subtle:    '#94a3b8',
  green:     '#166534',
  greenHov:  '#15803d',
  greenAcc:  '#4ade80',
  blue:      '#3b82f6',
  orange:    '#f97316',
  red:       '#dc2626',
  redDim:    '#7f1d1d',
  yellow:    '#ca8a04',
}

const wrap = {
  minHeight: '100vh', background: C.pageBg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '16px 10px',
  fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
}
const card = (extra = {}) => ({
  background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 12, padding: '18px 16px', ...extra,
})
const labelSty = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: C.subtle, marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase',
}
const inputSty = (err = false, foc = false) => ({
  width: '100%', padding: '10px 13px', borderRadius: 8, fontSize: 13,
  background: '#0f172a',
  border: `1.5px solid ${err ? C.red : foc ? C.borderFoc : C.border}`,
  color: C.text, outline: 'none', boxSizing: 'border-box', transition: 'border .15s',
})
const errMsg = { color: '#f87171', fontSize: 11, marginTop: 4 }
const btnSty = (variant = 'green', disabled = false) => {
  const bg = disabled ? '#1e293b'
    : variant === 'green'  ? C.green
    : variant === 'blue'   ? '#1d4ed8'
    : variant === 'danger' ? C.redDim
    : '#1e293b'
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '11px 16px', borderRadius: 10, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13, fontWeight: 700, transition: 'opacity .15s',
    background: bg, color: disabled ? C.muted : C.text, opacity: disabled ? .55 : 1,
  }
}
const infoBox = (color = C.blue) => ({
  background: color + '1a', border: `1px solid ${color}40`,
  borderRadius: 10, padding: '10px 14px', marginBottom: 18,
  display: 'flex', gap: 9, alignItems: 'flex-start',
})
const divider  = { border: 'none', borderTop: `1px solid ${C.border}`, margin: '20px 0' }
const secTitle = {
  fontSize: 10, fontWeight: 800, color: C.muted,
  letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14,
}

/* ─── Ícones ──────────────────────────────────────────────────── */
const Ico = {
  shield:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="24" height="24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="38" height="38"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  arrow:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  warn:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  db:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  seed:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 22V12"/><path d="M5 12c0-4.4 3.1-8 7-8s7 3.6 7 8"/><path d="M5 12s4-2 7 2 7-2 7-2"/></svg>,
  trash:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  eye:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  gear:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  chev:    (up) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>,
  save:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
}

function Spin({ size = 14 }) {
  return (
    <>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        width={size} height={size}
        style={{ animation: '_spin .65s linear infinite' }}>
        <path d="M21 12a9 9 0 11-18 0"/>
      </svg>
    </>
  )
}

/* ─── Regras de senha ─────────────────────────────────────────── */
const REGRAS_SENHA = [
  { id: 'len',     label: 'Mínimo 8 caracteres',           test: s => s.length >= 8 },
  { id: 'upper',   label: 'Pelo menos uma letra maiúscula', test: s => /[A-Z]/.test(s) },
  { id: 'number',  label: 'Pelo menos um número',           test: s => /[0-9]/.test(s) },
  { id: 'special', label: 'Pelo menos um caractere especial (!@#$…)', test: s => /[^A-Za-z0-9]/.test(s) },
]

function RegrasSenha({ senha }) {
  if (!senha) return null
  return (
    <div style={{
      background: C.elevated, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '10px 12px', marginTop: 8,
      display: 'flex', flexDirection: 'column', gap: 5,
    }}>
      {REGRAS_SENHA.map(r => {
        const ok = r.test(senha)
        return (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg viewBox="0 0 12 12" fill="none" stroke={ok ? C.greenAcc : C.border}
              strokeWidth="2.5" width="11" height="11">
              {ok
                ? <polyline points="1 6 4.5 9.5 11 2"/>
                : <line x1="6" y1="1" x2="6" y2="11"/>
              }
            </svg>
            <span style={{ fontSize: 11, color: ok ? C.greenAcc : C.muted, transition: 'color .15s' }}>
              {r.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Campo de nível de acesso (bloqueado) ────────────────────── */
function CampoAcessoFixo() {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelSty}>Nível de acesso</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 13px', borderRadius: 8, fontSize: 13,
        background: '#0f172a', border: `1.5px solid ${C.border}`,
        color: C.muted, boxSizing: 'border-box',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={C.greenAcc} strokeWidth="2" width="14" height="14">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ color: C.text, fontWeight: 600 }}>Superadmin</span>
        <span style={{ color: C.muted, fontSize: 11 }}>— Acesso total ao sistema</span>
        <svg viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" width="13" height="13"
          style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
        O primeiro usuário recebe automaticamente acesso total. Outros perfis podem ser criados depois.
      </p>
    </div>
  )
}
function calcForca(senha) {
  if (!senha) return { nivel: 0, texto: '', cor: C.border }
  let pts = 0
  if (senha.length >= 8)  pts++
  if (senha.length >= 12) pts++
  if (/[A-Z]/.test(senha))  pts++
  if (/[0-9]/.test(senha))  pts++
  if (/[^A-Za-z0-9]/.test(senha)) pts++
  if (pts <= 1) return { nivel: 1, texto: 'Muito fraca',  cor: C.red }
  if (pts === 2) return { nivel: 2, texto: 'Fraca',       cor: C.orange }
  if (pts === 3) return { nivel: 3, texto: 'Média',       cor: C.yellow }
  if (pts === 4) return { nivel: 4, texto: 'Forte',       cor: C.greenAcc }
  return              { nivel: 5, texto: 'Muito forte',  cor: C.blue }
}

function BarraForca({ senha }) {
  const { nivel, texto, cor } = calcForca(senha)
  if (!senha) return null
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= nivel ? cor : C.border,
            transition: 'background .2s',
          }}/>
        ))}
      </div>
      <span style={{ fontSize: 10, color: cor, fontWeight: 600 }}>{texto}</span>
    </div>
  )
}

/* ─── Campo de formulário com toggle de senha ────────────────── */
function Campo({ label: lbl, type = 'text', placeholder, value, onChange, erro, autoComplete, mostrarForca }) {
  const [foc,    setFoc]    = useState(false)
  const [visivel, setVisivel] = useState(false)
  const eSenha = type === 'password'
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelSty}>{lbl}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={eSenha ? (visivel ? 'text' : 'password') : type}
          value={value} placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          style={{ ...inputSty(!!erro, foc), paddingRight: eSenha ? 38 : 13 }}
        />
        {eSenha && (
          <button
            type="button"
            onClick={() => setVisivel(v => !v)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.muted, padding: 2, display: 'flex', alignItems: 'center',
            }}
            title={visivel ? 'Ocultar senha' : 'Ver senha'}
          >
            {visivel ? Ico.eyeOff : Ico.eye}
          </button>
        )}
      </div>
      {erro && <p style={errMsg}>{erro}</p>}
      {eSenha && mostrarForca && <BarraForca senha={value} />}
    </div>
  )
}

/* ─── Checkbox estilizado ─────────────────────────────────────── */
function Check({ checked, onChange, label: lbl, desc, color = C.greenAcc, warnMode = false }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      display: 'flex', alignItems: 'flex-start', gap: 11, cursor: 'pointer',
      padding: '11px 13px', borderRadius: 10, marginBottom: 10,
      background: checked ? (warnMode ? '#7f1d1d22' : '#16653422') : C.elevated,
      border: `1.5px solid ${checked ? color + '55' : C.border}`,
      transition: 'all .15s',
    }}>
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `2px solid ${checked ? color : C.border}`,
        background: checked ? color : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s',
      }}>
        {checked && <svg viewBox="0 0 12 12" fill="none" stroke={warnMode ? 'white' : '#0f172a'} strokeWidth="2.5" width="10" height="10"><polyline points="1 6 4.5 9.5 11 2"/></svg>}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 2px' }}>{lbl}</p>
        {desc && <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, margin: 0 }}>{desc}</p>}
      </div>
    </div>
  )
}

/* ─── Seleção de dados (seed seletivo) ────────────────────────── */
const OPCOES_SEED = [
  { id: 'categorias',        label: 'Categorias',          desc: '15 categorias (Política, Saúde, Esportes, Turismo…)' },
  { id: 'noticias',          label: 'Notícias',            desc: '12 notícias de exemplo publicadas' },
  { id: 'fontes',            label: 'Fontes',              desc: '8 fontes jornalísticas (Prefeitura, Câmara, PM…)' },
  { id: 'topicos',           label: 'Tópicos da Faixa',    desc: '5 tópicos para a faixa rolante da home' },
  { id: 'eventos',           label: 'Eventos',             desc: '3 eventos futuros na agenda' },
  { id: 'onibus',            label: 'Horários de Ônibus',  desc: '2 linhas com horários semanais' },
  { id: 'modulos',           label: 'Módulos da Home',     desc: 'História da cidade, Belezas naturais, Eventos, Horário de ônibus' },
  { id: 'noticias_externas', label: 'Notícias Externas',   desc: '3 links de portais nacionais (G1, UOL, BBC)' },
]

function SeletorDados({ selecionados, onChange }) {
  const toggle = (id) => {
    onChange(selecionados.includes(id)
      ? selecionados.filter(x => x !== id)
      : [...selecionados, id])
  }
  const todos = selecionados.length === OPCOES_SEED.length
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={secTitle}>Dados a instalar</p>
        <button
          type="button"
          onClick={() => onChange(todos ? [] : OPCOES_SEED.map(o => o.id))}
          style={{
            fontSize: 11, fontWeight: 600, color: C.blue, background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 6px',
          }}
        >{todos ? 'Desmarcar todos' : 'Selecionar todos'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
        {OPCOES_SEED.map(op => (
          <Check
            key={op.id}
            checked={selecionados.includes(op.id)}
            onChange={() => toggle(op.id)}
            label={op.label}
            desc={op.desc}
          />
        ))}
      </div>
      {selecionados.length === 0 && (
        <p style={{ fontSize: 11, color: C.orange, marginTop: 4 }}>
          Nenhum dado selecionado — apenas a conta admin será criada.
        </p>
      )}
    </div>
  )
}

/* ─── Badge de status (OK / Erro) ─────────────────────────────── */
function StatusBadge({ status }) {
  if (!status) return null
  const ok = status.ok
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 12px', borderRadius: 8, marginTop: 10,
      background: ok ? '#16653422' : '#7f1d1d22',
      border: `1px solid ${ok ? C.greenAcc + '44' : C.red + '44'}`,
    }}>
      {ok
        ? <svg viewBox="0 0 24 24" fill="none" stroke={C.greenAcc} strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      }
      <span style={{ fontSize: 11, fontWeight: 600, color: ok ? C.greenAcc : '#f87171', lineHeight: 1.4 }}>
        {status.mensagem || status.erro}
      </span>
    </div>
  )
}

/* ─── Configurações MongoDB ───────────────────────────────────── */
// initialUri: valor já carregado do .env pelo componente pai no mount
function ConfigMongo({ initialUri = '' }) {
  const [aberta,  setAberta]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [testando, setTestando] = useState(false)
  const [uri, setUri]         = useState(initialUri)
  const [statusConexao, setStatusConexao] = useState(null)
  const configurado = !!uri.trim()

  // Sincroniza quando o pai termina de carregar (initialUri chega após fetch async)
  useEffect(() => { if (initialUri) setUri(initialUri) }, [initialUri])

  async function salvar() {
    setLoading(true)
    setStatusConexao(null)
    try {
      await setupService.salvarEnvConfig({ mongo_uri: uri })
      toast.success('URI do MongoDB salva!')
    } catch { toast.error('Erro ao salvar configuração') }
    finally { setLoading(false) }
  }

  async function testar() {
    if (!uri.trim()) { toast.error('Informe a URI antes de testar'); return }
    setTestando(true)
    setStatusConexao(null)
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const res = await fetch(`${BASE}/setup/test-mongo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mongo_uri: uri }),
      })
      const data = await res.json()
      setStatusConexao(data)
    } catch { setStatusConexao({ ok: false, erro: 'Erro ao comunicar com o servidor' }) }
    finally { setTestando(false) }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={() => setAberta(a => !a)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          background: C.elevated, border: `1px solid ${configurado ? C.greenAcc + '55' : C.border}`,
          color: C.subtle, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', letterSpacing: '.04em',
          transition: 'border-color .2s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: configurado ? C.greenAcc : C.muted }}>{Ico.db}</span>
          CONFIGURAÇÃO — MongoDB
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {configurado && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.greenAcc,
              background: C.greenAcc + '22', padding: '2px 8px', borderRadius: 20,
            }}>✓ Configurado</span>
          )}
          {Ico.chev(aberta)}
        </span>
      </button>

      {aberta && (
        <div style={{ ...card({ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none', paddingTop: 20 }) }}>
          <div style={infoBox(C.blue)}>
            <span style={{ color: C.blue, flexShrink: 0 }}>{Ico.info}</span>
            <span style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.5 }}>
              Lido do arquivo <code>.env</code> do servidor. Altere aqui para atualizar a conexão.
            </span>
          </div>

          <label style={labelSty}>URI de conexão</label>
          <input
            value={uri}
            onChange={e => { setUri(e.target.value); setStatusConexao(null) }}
            placeholder="mongodb+srv://usuario:senha@cluster.mongodb.net/banco"
            style={{ ...inputSty(), marginBottom: 10 }}
          />

          <StatusBadge status={statusConexao} />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={testar} disabled={testando || loading} style={{ ...btnSty('blue', testando || loading), flex: 1 }}>
              {testando ? <><Spin/> Testando…</> : 'Testar Conexão'}
            </button>
            <button onClick={salvar} disabled={loading || testando} style={{ ...btnSty('green', loading || testando), flex: 1 }}>
              {loading ? <><Spin/> Salvando…</> : <>{Ico.save} Salvar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Configurações Cloudinary ────────────────────────────────── */
function ConfigCloudinary({ initialValues = {} }) {
  const [aberta,   setAberta]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [testando, setTestando] = useState(false)
  const [visSecret, setVisSecret] = useState(false)
  const [form, setForm] = useState({
    cloudinary_cloud_name:  initialValues.cloudinary_cloud_name  || '',
    cloudinary_api_key:     initialValues.cloudinary_api_key     || '',
    cloudinary_api_secret:  initialValues.cloudinary_api_secret  || '',
  })
  const [statusConexao, setStatusConexao] = useState(null)
  const configurado = !!form.cloudinary_cloud_name.trim()

  // Sincroniza quando o pai termina de carregar (chega após fetch async)
  useEffect(() => {
    if (initialValues.cloudinary_cloud_name || initialValues.cloudinary_api_key) {
      setForm({
        cloudinary_cloud_name:  initialValues.cloudinary_cloud_name  || '',
        cloudinary_api_key:     initialValues.cloudinary_api_key     || '',
        cloudinary_api_secret:  initialValues.cloudinary_api_secret  || '',
      })
    }
  }, [initialValues.cloudinary_cloud_name, initialValues.cloudinary_api_key, initialValues.cloudinary_api_secret])

  const set = k => v => { setForm(f => ({ ...f, [k]: v })); setStatusConexao(null) }

  async function salvar() {
    setLoading(true)
    setStatusConexao(null)
    try {
      await setupService.salvarEnvConfig({
        cloudinary_cloud_name:  form.cloudinary_cloud_name,
        cloudinary_api_key:     form.cloudinary_api_key,
        cloudinary_api_secret:  form.cloudinary_api_secret,
      })
      toast.success('Configurações do Cloudinary salvas!')
    } catch { toast.error('Erro ao salvar configurações') }
    finally { setLoading(false) }
  }

  async function testar() {
    const { cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret } = form
    if (!cloudinary_cloud_name || !cloudinary_api_key || !cloudinary_api_secret) {
      toast.error('Preencha todos os campos antes de testar'); return
    }
    setTestando(true)
    setStatusConexao(null)
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const res = await fetch(`${BASE}/setup/test-cloudinary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setStatusConexao(data)
    } catch { setStatusConexao({ ok: false, erro: 'Erro ao comunicar com o servidor' }) }
    finally { setTestando(false) }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={() => setAberta(a => !a)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          background: C.elevated, border: `1px solid ${configurado ? C.greenAcc + '55' : C.border}`,
          color: C.subtle, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', letterSpacing: '.04em',
          transition: 'border-color .2s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: configurado ? C.greenAcc : C.muted }}>{Ico.gear}</span>
          CONFIGURAÇÃO — Cloudinary
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {configurado && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.greenAcc,
              background: C.greenAcc + '22', padding: '2px 8px', borderRadius: 20,
            }}>✓ Configurado</span>
          )}
          {Ico.chev(aberta)}
        </span>
      </button>

      {aberta && (
        <div style={{ ...card({ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none', paddingTop: 20 }) }}>
          <div style={infoBox(C.blue)}>
            <span style={{ color: C.blue, flexShrink: 0 }}>{Ico.info}</span>
            <span style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.5 }}>
              Credenciais para upload de imagens. Lidas do arquivo <code>.env</code> do servidor.
            </span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelSty}>Cloud Name</label>
            <input value={form.cloudinary_cloud_name} onChange={e => set('cloudinary_cloud_name')(e.target.value)}
              placeholder="meu-cloud" style={inputSty()} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSty}>API Key</label>
            <input value={form.cloudinary_api_key} onChange={e => set('cloudinary_api_key')(e.target.value)}
              placeholder="123456789012345" style={inputSty()} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSty}>API Secret</label>
            <div style={{ position: 'relative' }}>
              <input
                type={visSecret ? 'text' : 'password'}
                value={form.cloudinary_api_secret}
                onChange={e => set('cloudinary_api_secret')(e.target.value)}
                placeholder="••••••••••••••••••••"
                style={{ ...inputSty(), paddingRight: 38 }}
              />
              <button type="button" onClick={() => setVisSecret(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: C.muted,
                  display: 'flex', alignItems: 'center' }}>
                {visSecret ? Ico.eyeOff : Ico.eye}
              </button>
            </div>
          </div>

          <StatusBadge status={statusConexao} />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={testar} disabled={testando || loading} style={{ ...btnSty('blue', testando || loading), flex: 1 }}>
              {testando ? <><Spin/> Testando…</> : 'Testar Credenciais'}
            </button>
            <button onClick={salvar} disabled={loading || testando} style={{ ...btnSty('green', loading || testando), flex: 1 }}>
              {loading ? <><Spin/> Salvando…</> : <>{Ico.save} Salvar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TELA — Verificando
═══════════════════════════════════════════════════════════════ */
function TelaVerificando() {
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.muted, fontSize: 13 }}>
        <Spin/> Verificando instalação…
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TELA — Formulário de instalação
═══════════════════════════════════════════════════════════════ */
function TelaInstalacao({ onSucesso, statusBanco }) {
  const [form, setForm] = useState({ nomeSite: '', nome: '', email: '', senha: '', confirmar: '' })
  const [erros, setErros] = useState({})
  const [seed, setSeed]   = useState(true)
  const [dadosSel, setDadosSel] = useState(OPCOES_SEED.map(o => o.id))
  const [loading, setLoading]   = useState(false)
  const [envConfig, setEnvConfig] = useState({})

  // Carrega as configurações do .env automaticamente ao montar a tela
  useEffect(() => {
    setupService.lerEnvConfig()
      .then(data => setEnvConfig(data))
      .catch(() => {}) // silencioso — se falhar o usuário preenche manualmente
  }, [])

  const set = k => v => { setForm(f => ({ ...f, [k]: v })); setErros(e => ({ ...e, [k]: '' })) }

  function validar() {
    const e = {}
    if (!form.nomeSite.trim())         e.nomeSite  = 'Nome do site é obrigatório'
    if (!form.nome.trim())             e.nome      = 'Nome é obrigatório'
    if (!form.email.trim())            e.email     = 'Email é obrigatório'
    if (form.senha.length < 8)         e.senha     = 'Mínimo 8 caracteres'
    if (form.senha !== form.confirmar) e.confirmar = 'As senhas não coincidem'
    setErros(e)
    return !Object.keys(e).length
  }

  async function instalar() {
    if (!validar()) return
    setLoading(true)
    try {
      const res = await setupService.instalar({
        nome: form.nome, email: form.email, senha: form.senha,
        nome_site: form.nomeSite,
        importar_seed: seed,
        dados_escolhidos: seed ? dadosSel : [],
      })
      onSucesso(res)
    } catch (err) {
      toast.error(err.message || 'Erro na instalação')
    } finally { setLoading(false) }
  }

  return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            width: 54, height: 54, background: C.green, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', color: 'white',
          }}>{Ico.shield}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>
            Instalação do IguaNews
          </h1>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>
            Configure o acesso inicial ao painel.<br/>
            Este formulário só está disponível enquanto o banco estiver vazio.
          </p>
        </div>

        {/* Info banco */}
        {statusBanco?.banco_nome && (
          <div style={infoBox(C.blue)}>
            <span style={{ color: C.blue, flexShrink: 0, marginTop: 1 }}>{Ico.db}</span>
            <span style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.5 }}>
              Banco detectado: <strong>{statusBanco.banco_nome}</strong> — vazio e pronto para instalação.
            </span>
          </div>
        )}

        {/* Configurações ANTES do formulário */}
        <ConfigMongo initialUri={envConfig.mongo_uri} />
        <ConfigCloudinary initialValues={envConfig} />

        <div style={{ ...card(), marginTop: 16 }}>

          {/* Aviso perfis */}
          <div style={infoBox(C.blue)}>
            <span style={{ color: C.blue, flexShrink: 0, marginTop: 1 }}>{Ico.info}</span>
            <span style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.5 }}>
              Serão criados automaticamente os perfis&nbsp;
              <strong>Superadmin</strong>, <strong>Jornalista</strong> e&nbsp;<strong>Usuário</strong>.
              O Superadmin tem acesso irrestrito; o Jornalista acessa conteúdo editorial; o Usuário é reservado para uso futuro (sem acesso ao painel).
            </span>
          </div>

          {/* Seção: site */}
          <p style={secTitle}>Sobre o site</p>
          <Campo label="Nome do site *" placeholder="Ex.: IguaNews" value={form.nomeSite}
            onChange={set('nomeSite')} erro={erros.nomeSite} autoComplete="off"/>

          <hr style={divider}/>

          {/* Seção: admin */}
          <p style={secTitle}>Conta do administrador</p>
          <Campo label="Seu nome *"        type="text"     placeholder="Ex.: João da Silva"       value={form.nome}      onChange={set('nome')}      erro={erros.nome}      autoComplete="name"/>
          <Campo label="Email de acesso *" type="email"    placeholder="admin@exemplo.com"        value={form.email}     onChange={set('email')}     erro={erros.email}     autoComplete="email"/>
          <Campo label="Senha *"           type="password" placeholder="Mínimo 8 caracteres"     value={form.senha}     onChange={set('senha')}     erro={erros.senha}     autoComplete="new-password" mostrarForca/>
          <RegrasSenha senha={form.senha} />
          <div style={{ marginTop: 12 }}>
            <Campo label="Confirmar senha *" type="password" placeholder="Digite a senha novamente" value={form.confirmar} onChange={set('confirmar')} erro={erros.confirmar} autoComplete="new-password"/>
          </div>
          <CampoAcessoFixo />

          <hr style={divider}/>

          {/* Opção seed */}
          <Check
            checked={seed} onChange={setSeed}
            label="Importar dados de exemplo"
            desc="Popula o banco com categorias, notícias, eventos e horários de ônibus para explorar o painel."
          />

          {/* Seletor granular de dados */}
          {seed && (
            <div style={{
              background: C.elevated, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '14px 14px 4px', marginBottom: 16,
            }}>
              <SeletorDados selecionados={dadosSel} onChange={setDadosSel} />
            </div>
          )}

          <button onClick={instalar} disabled={loading} style={btnSty('green', loading)}>
            {loading ? <><Spin/> Instalando…</> : <>{Ico.arrow} Concluir Instalação</>}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 14 }}>
          Rota: <code style={{ color: C.subtle, fontSize: 11 }}>POST /api/setup</code>
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TELA — Sucesso
═══════════════════════════════════════════════════════════════ */
function TelaSucesso({ resultado, onIrPainel }) {
  const [desativarStatus, setDesativarStatus] = useState(null) // null | 'confirm' | 'loading' | 'done' | 'error'
  const [desativarMsg,    setDesativarMsg]    = useState('')

  async function handleDesativar() {
    setDesativarStatus('loading')
    try {
      const data = await setupService.desativarArquivo()
      setDesativarStatus('done')
      setDesativarMsg(data.mensagem || 'Setup desativado com sucesso!')
    } catch (err) {
      setDesativarStatus('error')
      setDesativarMsg(err.message || 'Erro ao desativar setup.')
    }
  }

  return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>

        {/* Ícone */}
        <div style={{ color: C.greenAcc, marginBottom: 14 }}>{Ico.check}</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6 }}>
          Instalação concluída!
        </h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
          O sistema foi configurado e você já está autenticado.
        </p>

        {/* Credenciais criadas */}
        {resultado?.usuario && (
          <div style={{ ...card({ textAlign: 'left' }), marginBottom: 14 }}>
            <p style={secTitle}>Conta criada</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: C.muted }}>Nome</span>
                <strong style={{ color: C.text }}>{resultado.usuario.nome}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: C.muted }}>Email</span>
                <strong style={{ color: C.text }}>{resultado.usuario.email}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Perfis criados */}
        {resultado?.perfis_criados?.length > 0 && (
          <div style={{ ...card({ textAlign: 'left' }), marginBottom: 14 }}>
            <p style={secTitle}>Perfis de acesso criados</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {resultado.perfis_criados.map(p => (
                <span key={p} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: C.greenAcc + '22', color: C.greenAcc,
                }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Dados de exemplo importados */}
        {resultado?.seed && Object.values(resultado.seed).some(v => v > 0) && (
          <div style={{ ...card({ textAlign: 'left' }), marginBottom: 14 }}>
            <p style={secTitle}>Dados de exemplo importados</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(resultado.seed).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: C.blue + '22', color: C.blue,
                }}>{k}: {v}</span>
              ))}
            </div>
          </div>
        )}

        {/* Aviso se seed falhou parcialmente */}
        {resultado?.seed_erro && (
          <div style={{ ...infoBox(C.orange), textAlign: 'left', marginBottom: 14 }}>
            <span style={{ color: C.orange, flexShrink: 0 }}>{Ico.warn}</span>
            <div style={{ fontSize: 12, color: '#fdba74', lineHeight: 1.5 }}>
              <strong>Dados de exemplo não importados:</strong><br/>
              {resultado.seed_erro}<br/>
              <span style={{ opacity: .8 }}>
                Você pode importá-los depois em <strong>Gerenciar Banco → Importar Seed</strong>.
              </span>
            </div>
          </div>
        )}

        {/* ── Segurança pós-instalação: desativar arquivo de setup ─────────── */}
        <div style={{ ...card({ textAlign: 'left' }), marginBottom: 20, borderColor: desativarStatus === 'done' ? C.green + '88' : C.border }}>
          <p style={secTitle}>🔒 Segurança pós-instalação</p>

          {desativarStatus === 'done' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={C.greenAcc} strokeWidth="2.2" width="16" height="16" style={{ flexShrink: 0, marginTop: 1 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <p style={{ fontSize: 12, color: C.greenAcc, fontWeight: 700, marginBottom: 3 }}>Setup desativado com sucesso!</p>
                <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{desativarMsg}</p>
              </div>
            </div>
          ) : desativarStatus === 'error' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ color: C.orange, flexShrink: 0 }}>{Ico.warn}</span>
              <p style={{ fontSize: 11, color: '#fdba74', lineHeight: 1.5 }}>{desativarMsg}</p>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
              Recomendamos desativar o arquivo de setup após a instalação para impedir que terceiros
              acessem esta tela e realizem alterações no sistema.
            </p>
          )}

          {desativarStatus !== 'done' && desativarStatus !== 'confirm' && (
            <button
              onClick={() => setDesativarStatus('confirm')}
              disabled={desativarStatus === 'loading'}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.redDim}`,
                background: C.redDim + '44', color: '#fca5a5',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {Ico.trash} Desativar arquivo de setup
            </button>
          )}

          {desativarStatus === 'confirm' && (
            <div style={{ background: C.redDim + '33', border: `1px solid ${C.red}44`, borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontSize: 12, color: '#fca5a5', marginBottom: 10, lineHeight: 1.5 }}>
                <strong>Atenção:</strong> Esta ação irá desativar as rotas de setup e renomear o arquivo.
                O servidor precisará ser reiniciado para aplicar completamente. Tem certeza?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleDesativar}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 0', borderRadius: 8, border: 'none',
                    background: C.redDim, color: C.text,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {Ico.trash} Sim, desativar
                </button>
                <button
                  onClick={() => setDesativarStatus(null)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${C.border}`,
                    background: 'none', color: C.muted,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {desativarStatus === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 12 }}>
              <Spin size={13}/> Desativando arquivo de setup…
            </div>
          )}
        </div>
        {/* ─────────────────────────────────────────────────────────────────── */}

        <button
          onClick={onIrPainel}
          style={{ ...btnSty('green'), width: 'auto', padding: '12px 40px', fontSize: 14 }}
        >
          {Ico.arrow} Entrar no Painel
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TELA — Painel de banco (já instalado)
═══════════════════════════════════════════════════════════════ */
function PainelBanco({ status: statusInicial, onConcluido }) {
  const [nomeSite, setNomeSite] = useState('IguaNews')
  const [dadosSel, setDadosSel] = useState(OPCOES_SEED.map(o => o.id))
  const [limpar, setLimpar]     = useState(false)
  const [mantUser, setMantUser] = useState(true)
  const [resetTxt, setResetTxt] = useState('')
  const [loading, setLoading]   = useState('')
  const [contagens, setContagens] = useState(statusInicial?.contagens ?? {})
  const [bancoDone, setBancoDone] = useState(null) // { tipo: 'reset'|'seed', msg }
  const [envConfig, setEnvConfig] = useState({})

  // Carrega as configurações do .env automaticamente ao montar a tela
  useEffect(() => {
    setupService.lerEnvConfig()
      .then(data => setEnvConfig(data))
      .catch(() => {}) // silencioso — se falhar o usuário preenche manualmente
  }, [])

  async function recarregarContagens() {
    try {
      const s = await setupService.status()
      setContagens(s.contagens ?? {})
    } catch {}
  }

  async function importarSeed() {
    setLoading('seed')
    setBancoDone(null)
    try {
      const res = await setupService.seed({ nome_site: nomeSite, limpar_antes: limpar, dados_escolhidos: dadosSel })
      const msg = res.mensagem || 'Dados importados com sucesso!'
      toast.success(msg)
      setBancoDone({ tipo: 'seed', msg })
      await recarregarContagens()
      if (onConcluido) onConcluido({ seed: res.importados, mensagem: msg })
    } catch (err) { toast.error(err.message || 'Erro ao importar') }
    finally { setLoading('') }
  }

  async function resetarBanco() {
    if (resetTxt !== 'CONFIRMAR_RESET') { toast.error('Digite CONFIRMAR_RESET'); return }
    setLoading('reset')
    setBancoDone(null)
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const res = await fetch(`${BASE}/setup/reset-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmar: resetTxt, manter_usuarios: mantUser }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`)
      const msg = data.mensagem || 'Banco resetado com sucesso!'
      toast.success(msg)
      // Recarrega para que o AdminSetup detecte o novo estado do banco
      setTimeout(() => { window.location.reload() }, 1200)
    } catch (err) { toast.error(err.message || 'Erro ao resetar') }
    finally { setLoading('') }
  }

  const cnt = contagens

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg,
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: '16px 10px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>
          Gerenciar Banco de Dados
        </h2>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>
          Banco: <strong style={{ color: C.subtle }}>{statusInicial?.banco_nome ?? '—'}</strong>
        </p>

        {/* Feedback pós-ação */}
        {bancoDone && (
          <div style={{
            ...infoBox(bancoDone.tipo === 'reset' ? C.orange : C.greenAcc),
            marginBottom: 20,
          }}>
            <span style={{ color: bancoDone.tipo === 'reset' ? C.orange : C.greenAcc, flexShrink: 0 }}>
              {bancoDone.tipo === 'reset' ? Ico.trash : Ico.seed}
            </span>
            <span style={{ fontSize: 12, color: bancoDone.tipo === 'reset' ? '#fdba74' : '#86efac', lineHeight: 1.5 }}>
              {bancoDone.msg}
            </span>
          </div>
        )}

        {/* Configurações */}
        <ConfigMongo initialUri={envConfig.mongo_uri} />
        <ConfigCloudinary initialValues={envConfig} />
        <div style={{ marginBottom: 8 }} />

        {/* Estado atual */}
        <div style={{ ...card(), marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ color: C.blue }}>{Ico.db}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Estado atual</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(cnt).map(([k, v]) => (
              <div key={k} style={{
                background: C.elevated, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '7px 14px', textAlign: 'center', minWidth: 64,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: v > 0 ? C.greenAcc : C.muted }}>{v}</div>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Importar seed */}
        <div style={{ ...card(), marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ color: C.greenAcc }}>{Ico.seed}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Importar dados de exemplo</span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSty}>Nome do site nos dados</label>
            <input value={nomeSite} onChange={e => setNomeSite(e.target.value)}
              style={inputSty()} placeholder="Ex.: IguaNews" />
          </div>

          <div style={{
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '14px 14px 4px', marginBottom: 14,
          }}>
            <SeletorDados selecionados={dadosSel} onChange={setDadosSel} />
          </div>

          <Check
            checked={limpar} onChange={setLimpar} warnMode color={C.red}
            label="Limpar dados existentes antes de importar"
            desc="Remove notícias, categorias, eventos e ônibus antes de recriar os exemplos."
          />

          {limpar && (
            <div style={{ ...infoBox(C.orange), marginBottom: 14 }}>
              <span style={{ color: C.orange, flexShrink: 0 }}>{Ico.warn}</span>
              <span style={{ fontSize: 11, color: '#fdba74', lineHeight: 1.5 }}>
                Todas as notícias, categorias, eventos e ônibus serão excluídos antes da importação.
              </span>
            </div>
          )}

          <button onClick={importarSeed} disabled={loading === 'seed'} style={btnSty(limpar ? 'danger' : 'green', loading === 'seed')}>
            {loading === 'seed' ? <><Spin/> Importando…</> : <>{Ico.seed} Importar Seed</>}
          </button>
        </div>

        {/* Reset total */}
        <div style={{ ...card({ border: `1px solid ${C.red}44` }) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ color: C.red }}>{Ico.trash}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Reset do banco</span>
          </div>

          <div style={{ ...infoBox(C.red), marginBottom: 14 }}>
            <span style={{ color: C.red, flexShrink: 0, marginTop: 1 }}>{Ico.warn}</span>
            <span style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.5 }}>
              Ação <strong>irreversível</strong>. Todo conteúdo será apagado permanentemente.
            </span>
          </div>

          <Check
            checked={mantUser} onChange={setMantUser}
            label="Manter usuários e perfis de acesso"
            desc="Apenas o conteúdo (notícias, eventos, etc.) será removido."
          />

          <div style={{ marginBottom: 16 }}>
            <label style={labelSty}>Digite <strong style={{ color: C.subtle }}>CONFIRMAR_RESET</strong> para continuar</label>
            <input value={resetTxt} onChange={e => setResetTxt(e.target.value)}
              style={inputSty()} placeholder="CONFIRMAR_RESET" />
          </div>

          <button
            onClick={resetarBanco}
            disabled={loading === 'reset' || resetTxt !== 'CONFIRMAR_RESET'}
            style={btnSty('danger', loading === 'reset' || resetTxt !== 'CONFIRMAR_RESET')}>
            {loading === 'reset' ? <><Spin/> Resetando…</> : <>{Ico.trash} Resetar Banco</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function AdminSetup() {
  const navigate = useNavigate()
  const [fase,   setFase]   = useState('verificando')
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    setupService.status()
      .then(s => {
        setStatus(s)
        if (s.setup_needed) {
          setFase('instalar')
        } else {
          setFase('painel')
        }
      })
      .catch(() => setFase('instalar'))
  }, [navigate])

  if (fase === 'verificando') return <TelaVerificando/>
  if (fase === 'painel')      return <PainelBanco status={status} onConcluido={res => { setResult(res); setFase('sucesso') }} />
  if (fase === 'sucesso')     return (
    <TelaSucesso
      resultado={result}
      onIrPainel={() => { window.location.href = '/admin' }}
    />
  )

  return (
    <TelaInstalacao
      statusBanco={status}
      onSucesso={res => { setResult(res); setFase('sucesso') }}
    />
  )
}
