import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  noticiasService,
  errosService,
  configuracoesService,
  categoriasService,
  infraestruturaService,
  newsletterService,
  eventosService,
} from '../../services/api'

import { T as C } from '../../themes/tokens'
import AdminIcon from '../../components/admin/ui/AdminIcon'

// Alias para compatibilidade com JSX já escrito abaixo
const Ico = {
  news:    <AdminIcon name="news"    size={18} />,
  draft:   <AdminIcon name="draft"   size={18} />,
  review:  <AdminIcon name="review"  size={18} />,
  archive: <AdminIcon name="archive" size={18} />,
  alert:   <AdminIcon name="alert"   size={18} />,
  mail:    <AdminIcon name="mail"    size={18} />,
  db:      <AdminIcon name="db"      size={16} />,
  cloud:   <AdminIcon name="cloudUp" size={16} />,
  seo:     <AdminIcon name="seo"     size={16} />,
  cat:     <AdminIcon name="cat"     size={16} />,
  plus:    <AdminIcon name="plus"    size={14} />,
  layers:  <AdminIcon name="layers"  size={16} />,
  bus:     <AdminIcon name="bus"     size={16} />,
  cal:     <AdminIcon name="cal"     size={16} />,
  chart:   <AdminIcon name="chart"   size={16} />,
  ext:     <AdminIcon name="extLink" size={13} />,
  server:  <AdminIcon name="server"  size={16} />,
}

function fmt(n) { return (n ?? 0).toLocaleString('pt-BR') }

function RelTime({ iso }) {
  if (!iso) return <span style={{ color: C.muted }}>—</span>
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return <span>agora</span>
  if (m < 60) return <span>{m}min atrás</span>
  const h = Math.floor(m / 60)
  if (h < 24) return <span>{h}h atrás</span>
  return <span>{Math.floor(h / 24)}d atrás</span>
}

function Dot({ color }) {
  return <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:color, flexShrink:0, boxShadow:`0 0 6px ${color}88` }} />
}
function Spin() {
  return <AdminIcon name="spinSm" size={14} />
}

function StatCard({ icon, label, value, sub, accent, loading }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px', display:'flex', flexDirection:'column', gap:8, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent, borderRadius:'12px 12px 0 0' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:accent+'22', display:'flex', alignItems:'center', justifyContent:'center', color:accent }}>{icon}</div>
        <span style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'.07em', paddingTop:2 }}>{label}</span>
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:C.text, lineHeight:1 }}>
        {loading ? <span style={{ opacity:.3, fontSize:20 }}>···</span> : fmt(value)}
      </div>
      {sub && <div style={{ fontSize:11, color:C.muted }}>{sub}</div>}
    </div>
  )
}

function StatusChip({ ok, loading, label }) {
  const color = loading ? C.amber : ok ? '#22c55e' : C.red
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 12px', background:color+'14', border:`1px solid ${color}33`, borderRadius:8 }}>
      {loading ? <Spin /> : <Dot color={color} />}
      <span style={{ fontSize:12, fontWeight:600, color }}>{label}</span>
    </div>
  )
}

function SectionHead({ icon, title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <span style={{ color:C.muted }}>{icon}</span>
        <span style={{ fontSize:12, fontWeight:700, color:C.text, textTransform:'uppercase', letterSpacing:'.07em' }}>{title}</span>
      </div>
      {action}
    </div>
  )
}

function QuickBtn({ to, icon, label, color }) {
  return (
    <Link to={to} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'14px 10px', borderRadius:10, textDecoration:'none', background:C.surf2, border:`1px solid ${C.border}`, transition:'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.background=color+'14' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.surf2 }}>
      <span style={{ color, width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</span>
      <span style={{ fontSize:11, fontWeight:600, color:C.muted, whiteSpace:'nowrap' }}>{label}</span>
    </Link>
  )
}

const TIPO_LABEL = { javascript:'JS', unhandled_rejection:'Promise', '404':'404', api_error:'API', chunk_load:'Chunk' }
const TIPO_COR   = { JS:C.amber, Promise:C.amber, '404':C.blue, API:'var(--adm-red,#ef4444)', Chunk:'#8b5cf6' }

function ErroItem({ erro }) {
  const tipo = TIPO_LABEL[erro.tipo] || erro.tipo || '?'
  const cor  = TIPO_COR[tipo] || C.muted
  return (
    <div style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
      <span style={{ flexShrink:0, padding:'2px 7px', borderRadius:5, fontSize:10, fontWeight:700, background:cor+'20', color:cor }}>{tipo}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, color:C.text, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{erro.mensagem || '(sem mensagem)'}</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
          <RelTime iso={erro.criado_em} />
          {erro.rota && <span style={{ marginLeft:8, opacity:.6 }}>{erro.rota}</span>}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats,    setStats]   = useState(null)
  const [erros,    setErros]   = useState(null)
  const [cats,     setCats]    = useState(null)
  const [subs,     setSubs]    = useState(null)
  const [eventos,  setEventos] = useState(null)
  const [mongo,    setMongo]   = useState({ status:'loading' })
  const [cloudy,   setCloudy]  = useState({ status:'loading' })
  const [seo,      setSeo]     = useState(null)
  const [errosRec, setErrosRec]= useState([])
  const [agora,    setAgora]   = useState(new Date())

  const carregar = useCallback(() => {
    noticiasService.contagemStatus()
      .then(setStats).catch(() => setStats({ rascunho:0, revisao:0, publicado:0, arquivado:0 }))
    errosService.contagem()
      .then(setErros).catch(() => setErros({ nao_lidos:0, total:0 }))
    categoriasService.listar()
      .then(setCats).catch(() => setCats([]))
    newsletterService.listarAssinantes({ limit:1 })
      .then(r => setSubs(r.total ?? 0)).catch(() => setSubs(0))
    eventosService.listarTodos()
      .then(r => setEventos(Array.isArray(r) ? r.filter(e => e.ativo).length : 0))
      .catch(() => setEventos(0))
    configuracoesService.listar().then(cfg => setSeo({
      titulo:    cfg.site_titulo    || cfg.nome_site   || '—',
      descricao: cfg.site_descricao || cfg.descricao   || '—',
      keywords:  cfg.site_keywords  || '—',
    })).catch(() => setSeo({ titulo:'—', descricao:'—', keywords:'—' }))
    errosService.listar({ lido:false, limit:5 })
      .then(r => setErrosRec(r.erros ?? [])).catch(() => setErrosRec([]))
  }, [])

  useEffect(() => {
    carregar()
    infraestruturaService.mongoStatus()
      .then(r => setMongo({ status:r.conectado?'ok':'error', nome:r.banco }))
      .catch(() => setMongo({ status:'error' }))
    infraestruturaService.cloudinaryStatus()
      .then(r => setCloudy({ status:r.ok?'ok':'error', plano:r.plano }))
      .catch(() => setCloudy({ status:'error' }))
  }, [carregar])

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const hora = agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
  const data = agora.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })
  const totalNoticias = (stats?.publicado??0)+(stats?.rascunho??0)+(stats?.revisao??0)+(stats?.arquivado??0)
  const loadingStats = stats === null

  return (
    <>
      <style>{`
        @keyframes dash-spin { to { transform:rotate(360deg) } }
        .dash-grid-6 { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:20px; }
        @media(max-width:1100px){.dash-grid-6{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:640px) {.dash-grid-6{grid-template-columns:repeat(2,1fr);}}
        .dash-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
        @media(max-width:768px){.dash-row-2{grid-template-columns:1fr;}}
        .dash-card { background:var(--adm-surface); border:1px solid var(--adm-border); border-radius:12px; padding:18px; }
        .dash-quick-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .dash-seo-key { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--adm-muted); margin-bottom:3px; }
        .dash-seo-val { font-size:12px; color:var(--adm-text); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .dash-db-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
      `}</style>

      {/* Cabeçalho */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-title">Dashboard</div>
          <div className="adm-page-sub">{data} · {hora}</div>
        </div>
        <Link to="/admin/nova-noticia" className="adm-btn adm-btn-primary adm-btn-sm"
          style={{ display:'flex', alignItems:'center', gap:6 }}>
          {Ico.plus} Nova notícia
        </Link>
      </div>

      {/* 6 stat cards */}
      <div className="dash-grid-6">
        <StatCard icon={Ico.news}    label="Publicadas"  value={stats?.publicado}  accent="var(--adm-accent)"          loading={loadingStats} />
        <StatCard icon={Ico.draft}   label="Rascunhos"   value={stats?.rascunho}   accent="var(--adm-muted)"           loading={loadingStats} />
        <StatCard icon={Ico.review}  label="Em revisão"  value={stats?.revisao}    accent="#f59e0b"                    loading={loadingStats} />
        <StatCard icon={Ico.archive} label="Arquivadas"  value={stats?.arquivado}  accent="#3b82f6"                    loading={loadingStats} />
        <StatCard icon={Ico.alert}   label="Erros"       value={erros?.nao_lidos}
          sub={erros?.total ? `${erros.total} total` : undefined}
          accent={erros?.nao_lidos > 0 ? 'var(--adm-red,#ef4444)' : 'var(--adm-muted)'}
          loading={erros === null}
        />
        <StatCard icon={Ico.mail}    label="Assinantes"  value={subs}              accent="#8b5cf6"                    loading={subs === null} />
      </div>

      {/* Saúde do sistema + Ações rápidas */}
      <div className="dash-row-2">
        <div className="dash-card">
          <SectionHead icon={Ico.server} title="Saúde do Sistema" />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            <StatusChip ok={mongo.status==='ok'}  loading={mongo.status==='loading'}  label={`MongoDB${mongo.nome?` · ${mongo.nome}`:''}`} />
            <StatusChip ok={cloudy.status==='ok'} loading={cloudy.status==='loading'} label={`Cloudinary${cloudy.plano?` · ${cloudy.plano}`:''}`} />
          </div>
          <div className="dash-db-grid">
            {[
              { label:'Notícias',   value:totalNoticias,  icon:Ico.news,  loading:loadingStats },
              { label:'Categorias', value:cats?.length,   icon:Ico.cat,   loading:cats===null },
              { label:'Eventos',    value:eventos,        icon:Ico.cal,   loading:eventos===null },
            ].map(({ label, value, icon, loading }) => (
              <div key={label} style={{ background:'var(--adm-surface2)', border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:4, color:C.muted }}>{icon}</div>
                <div style={{ fontSize:18, fontWeight:800, color:C.text }}>{loading ? <span style={{opacity:.3}}>·</span> : fmt(value)}</div>
                <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>
          <Link to="/admin/infraestrutura" style={{ fontSize:12, color:'#3b82f6', textDecoration:'none', fontWeight:600, display:'inline-flex', alignItems:'center', gap:4 }}>
            {Ico.ext} Ver detalhes de infraestrutura
          </Link>
        </div>

        <div className="dash-card">
          <SectionHead icon={Ico.chart} title="Ações Rápidas"
            action={<Link to="/admin/noticias" style={{ fontSize:11, color:'#3b82f6', textDecoration:'none', fontWeight:600 }}>Ver notícias →</Link>}
          />
          <div className="dash-quick-grid">
            <QuickBtn to="/admin/nova-noticia" icon={Ico.plus}   label="Nova notícia" color="var(--adm-accent)" />
            <QuickBtn to="/admin/modulos"      icon={Ico.layers} label="Módulos"      color="#f59e0b"           />
            <QuickBtn to="/admin/onibus"       icon={Ico.bus}    label="Ônibus"       color="#06b6d4"           />
            <QuickBtn to="/admin/eventos"      icon={Ico.cal}    label="Eventos"      color="#8b5cf6"           />
          </div>
          <div className="dash-quick-grid" style={{ marginTop:8 }}>
            <QuickBtn to="/admin/seo"         icon={Ico.seo}   label="SEO"         color="#3b82f6"           />
            <QuickBtn to="/admin/noticias"    icon={Ico.news}  label="Notícias"    color="var(--adm-accent)" />
            <QuickBtn to="/admin/newsletter"  icon={Ico.mail}  label="Newsletter"  color="#8b5cf6"           />
            <QuickBtn to="/admin/erros"       icon={Ico.alert} label="Erros"       color="var(--adm-red,#ef4444)" />
          </div>
        </div>
      </div>

      {/* SEO + Erros recentes */}
      <div className="dash-row-2">
        <div className="dash-card">
          <SectionHead icon={Ico.seo} title="SEO / Metadados"
            action={<Link to="/admin/seo" style={{ fontSize:11, color:'#3b82f6', textDecoration:'none', fontWeight:600 }}>Editar →</Link>}
          />
          {seo ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { key:'Título do site', val:seo.titulo },
                { key:'Descrição',      val:seo.descricao },
                { key:'Palavras-chave', val:seo.keywords },
              ].map(({ key, val }) => (
                <div key={key}>
                  <div className="dash-seo-key">{key}</div>
                  <div className="dash-seo-val" style={{ color:val==='—'?C.muted:C.text, fontStyle:val==='—'?'italic':'normal' }}>{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color:C.muted, fontSize:13, display:'flex', alignItems:'center', gap:6, padding:'12px 0' }}>
              <Spin /> Carregando…
            </div>
          )}
        </div>

        <div className="dash-card">
          <SectionHead icon={Ico.alert} title="Erros Recentes"
            action={
              <Link to="/admin/erros" style={{ fontSize:11, color:'var(--adm-red,#ef4444)', textDecoration:'none', fontWeight:600 }}>
                {erros?.nao_lidos > 0 ? `${erros.nao_lidos} não lidos →` : 'Ver todos →'}
              </Link>
            }
          />
          {errosRec.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 0', gap:8, color:C.muted }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{opacity:.3}}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span style={{ fontSize:13 }}>Nenhum erro registrado</span>
            </div>
          ) : (
            errosRec.map((e, i) => <ErroItem key={e._id ?? e.id ?? i} erro={e} />)
          )}
        </div>
      </div>
    </>
  )
}
