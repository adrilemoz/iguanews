import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useNoticias } from '../hooks/useNoticias'
import { NoticiaCardV, NoticiaCardLista } from '../components/NoticiaCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  Newspaper, Star, ArrowRight, Tag, X, Globe,
  BookOpen, Mountain, Users, Heart,
  Church, ExternalLink, Bus, CalendarDays,
  Search, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  configuracoesService,
  modulosService,
  noticiasExternasService,
  topicosService,
  eventosService,
  onibusService,
} from '../services/api'

const ICON_MAP = {
  church: Church, mountain: Mountain, users: Users, heart: Heart,
  book: BookOpen, globe: Globe, star: Star, newspaper: Newspaper,
  bus: Bus, calendarDays: CalendarDays, calendar: CalendarDays,
}

// ─── Hero ──────────────────────────────────────────────────────
function Hero({ cfg }) {
  const titulo1   = cfg.hero_titulo_linha1 || 'Nossa cidade,'
  const titulo2   = cfg.hero_titulo_linha2 || 'nossa história.'
  const subtitulo = cfg.hero_subtitulo     || 'Seu portal de notícias, curiosidades e histórias sobre Iguatama.'
  const btn1Label = cfg.hero_btn1_label    || 'Últimas Notícias'
  const btn1Link  = cfg.hero_btn1_link     || '/#noticias'
  const btn2Label = cfg.hero_btn2_label    || 'Curiosidades'
  const btn2Link  = cfg.hero_btn2_link     || '/?categoria=curiosidades'
  const imgUrl    = cfg.hero_imagem_url    || ''

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: 480 }}>
      {imgUrl
        ? <img src={imgUrl} alt="Iguatama vista aérea" className="absolute inset-0 w-full h-full object-cover"/>
        : <div className="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-600"/>
      }
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70"/>

      <div className="relative z-10 wrap h-full flex flex-col justify-end pb-14 pt-20">
        <span className="inline-flex items-center gap-1.5 self-start mb-5 bg-forest-600/90
                         backdrop-blur text-white text-xs font-extrabold uppercase tracking-widest
                         px-3 py-1.5 rounded-full animate-slide-right">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          Iguatama, MG
        </span>

        <h1 className="text-white font-heading font-black text-4xl sm:text-5xl leading-tight
                       animate-slide-up" style={{ animationDelay: '100ms' }}>
          {titulo1}
        </h1>
        <h1 className="font-script italic text-accent-400 text-4xl sm:text-5xl leading-tight mb-4
                       animate-slide-up" style={{ animationDelay: '200ms' }}>
          {titulo2}
        </h1>
        <p className="text-gray-200 text-base sm:text-lg max-w-md leading-relaxed mb-8 font-semibold
                      animate-slide-up" style={{ animationDelay: '300ms' }}>
          {subtitulo}
        </p>
        <div className="flex items-center gap-3 flex-wrap animate-slide-up" style={{ animationDelay: '400ms' }}>
          <Link to={btn1Link} className="btn-primary flex items-center gap-2 shadow-lg">
            <Newspaper size={16}/> {btn1Label}
          </Link>
          <Link to={btn2Link} className="btn-outline-white flex items-center gap-2">
            <Heart size={16}/> {btn2Label}
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Faixa de tópicos ──────────────────────────────────────────
function FaixaTopicos({ topicos }) {
  if (!topicos.length) return null
  return (
    <div className="wrap">
      <div className="-mt-8 relative z-20 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-5">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${topicos.length}, 1fr)` }}>
          {topicos.map(t => {
            const Icon = ICON_MAP[t.icone] || Heart
            const isInterno = t.link?.startsWith('/')
            const inner = (
              <>
                <div className="w-12 h-12 rounded-2xl bg-forest-50 flex items-center justify-center
                                group-hover:bg-forest-100 transition-colors">
                  <Icon size={22} className="text-forest-600" strokeWidth={1.5}/>
                </div>
                <p className="font-extrabold text-xs text-gray-900 leading-tight">{t.label}</p>
                {t.descricao && (
                  <p className="text-gray-500 text-[10px] leading-snug hidden sm:block">{t.descricao}</p>
                )}
              </>
            )
            return isInterno ? (
              <Link key={t._id || t.id} to={t.link}
                className="flex flex-col items-center text-center gap-2 px-1 group">{inner}</Link>
            ) : (
              <a key={t._id || t.id} href={t.link || '/'}
                className="flex flex-col items-center text-center gap-2 px-1 group">{inner}</a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Seção de Serviços (Ônibus + Eventos) ──────────────────────
function SecaoServicos({ modulos, proximoEvento, proximoOnibus }) {
  const temEventos = modulos['eventos']?.ativo !== false
  const temOnibus  = modulos['onibus']?.ativo  !== false

  if (!temEventos && !temOnibus) return null

  const cols = [temEventos, temOnibus].filter(Boolean).length

  return (
    <div className="wrap">
      <div className="mt-4 grid gap-3"
        style={{ gridTemplateColumns: cols === 1 ? '1fr' : '1fr 1fr' }}>

        {/* Card Eventos */}
        {temEventos && (
          <Link to="/eventos"
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm
                       hover:shadow-md hover:border-forest-200 transition-all duration-200
                       overflow-hidden flex flex-col">
            <div className="h-1.5 bg-gradient-to-r from-forest-600 to-forest-400" />
            <div className="p-4 flex items-center gap-3 flex-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-forest-50 flex items-center
                              justify-center flex-shrink-0 group-hover:bg-forest-100 transition-colors">
                <CalendarDays size={20} className="text-forest-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-gray-900 text-sm leading-tight">Agenda de Eventos</p>
                {proximoEvento ? (
                  <p className="text-xs text-gray-500 mt-0.5 truncate font-semibold">📅 {proximoEvento}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Iguatama e região</p>
                )}
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-forest-500 flex-shrink-0
                                               group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        )}

        {/* Card Ônibus */}
        {temOnibus && (
          <Link to="/onibus"
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm
                       hover:shadow-md hover:border-blue-200 transition-all duration-200
                       overflow-hidden flex flex-col">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-sky-400" />
            <div className="p-4 flex items-center gap-3 flex-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 flex items-center
                              justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <Bus size={20} className="text-blue-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-gray-900 text-sm leading-tight">Horário de Ônibus</p>
                {proximoOnibus ? (
                  <p className="text-xs text-gray-500 mt-0.5 font-semibold">🚌 Próximo às {proximoOnibus}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Ver partidas e horários</p>
                )}
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0
                                               group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Notícias Externas ─────────────────────────────────────────
function NoticiasExternas({ items }) {
  if (!items.length) return null
  const lista = items.slice(0, 4)
  return (
    <section>
      <div className="section-title">
        <h2 className="section-title-text">
          <Globe size={20} className="text-forest-600"/> Notícias do Brasil e do Mundo
        </h2>
      </div>
      <div className="scroll-x pb-2">
        {lista.map(item => (
          <a key={item._id || item.id} href={item.url_externa} target="_blank" rel="noopener noreferrer"
            className="group block w-44 sm:w-52 flex-shrink-0">
            <div className="card h-full flex flex-col">
              <div className="relative h-28 overflow-hidden bg-gray-100 flex-shrink-0">
                {item.imagem_url ? (
                  <img src={item.imagem_url} alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                    <Globe size={24} className="text-gray-300"/>
                  </div>
                )}
                {item.categoria_label && (
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white uppercase tracking-wide shadow-sm"
                      style={{ backgroundColor: item.categoria_cor || '#1B5E3B' }}>
                      {item.categoria_label}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="font-heading font-extrabold text-gray-900 text-xs leading-snug
                               group-hover:text-forest-700 transition-colors line-clamp-3 flex-1">
                  {item.titulo}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
                    {item.fonte_nome}
                  </span>
                  <ExternalLink size={12} className="text-gray-300 group-hover:text-forest-500 transition-colors"/>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

// ─── Paginação ─────────────────────────────────────────────────
function Paginacao({ pagina, paginas, onMudar }) {
  if (paginas <= 1) return null
  const pages = Array.from({ length: paginas }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button onClick={() => onMudar(pagina - 1)} disabled={pagina === 1}
        className="p-2 rounded-xl border border-gray-200 text-gray-500
                   hover:border-forest-400 hover:text-forest-600 disabled:opacity-30
                   disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={16}/>
      </button>

      {pages.map(p => (
        <button key={p} onClick={() => onMudar(p)}
          className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
            p === pagina
              ? 'bg-forest-600 text-white shadow-sm'
              : 'border border-gray-200 text-gray-600 hover:border-forest-400 hover:text-forest-600'
          }`}>
          {p}
        </button>
      ))}

      <button onClick={() => onMudar(pagina + 1)} disabled={pagina === paginas}
        className="p-2 rounded-xl border border-gray-200 text-gray-500
                   hover:border-forest-400 hover:text-forest-600 disabled:opacity-30
                   disabled:cursor-not-allowed transition-colors">
        <ChevronRight size={16}/>
      </button>
    </div>
  )
}

// ─── Home ──────────────────────────────────────────────────────
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const catSlug    = searchParams.get('categoria') || null
  const q          = searchParams.get('q')         || null
  const page       = parseInt(searchParams.get('page') || '1', 10)
  const dataInicio = searchParams.get('dataInicio') || null
  const dataFim    = searchParams.get('dataFim')    || null
  const ordem      = searchParams.get('ordem')      || 'recente'

  const { noticias, total, paginas, loading, error, recarregar } =
    useNoticias({ categoriaSlug: catSlug, q, page, limit: 9, dataInicio, dataFim, ordem })

  const [cfg,      setCfg]      = useState({})
  const [modulos,  setModulos]  = useState({})
  const [topicos,  setTopicos]  = useState([])
  const [externas, setExternas] = useState([])
  const [proximoEvento,  setProximoEvento]  = useState(null)
  const [proximoOnibus,  setProximoOnibus]  = useState(null)

  useEffect(() => {
    configuracoesService.listar().then(setCfg).catch(() => {})
    modulosService.listar().then(list => {
      const map = {}
      list.forEach(m => { map[m.chave] = m })
      setModulos(map)
    }).catch(() => {})
    topicosService.listar().then(setTopicos).catch(() => {})
    noticiasExternasService.listar().then(setExternas).catch(() => {})

    // Preview: proximo evento futuro
    eventosService.listar().then(evs => {
      const hoje = new Date(); hoje.setHours(0,0,0,0)
      const proximo = evs
        .filter(e => new Date(e.data) >= hoje)
        .sort((a, b) => new Date(a.data) - new Date(b.data))[0]
      if (proximo) {
        const d = new Date(proximo.data)
        const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        setProximoEvento(proximo.titulo + " · " + label)
      }
    }).catch(() => {})

    // Preview: proximo onibus do dia (primeira linha ativa)
    onibusService.listar().then(linhas => {
      if (!linhas.length) return
      const diasMap = ["dom","seg","ter","qua","qui","sex","sab"]
      const diaAtual = diasMap[new Date().getDay()]
      const minutosAgora = new Date().getHours() * 60 + new Date().getMinutes()
      for (const linha of linhas) {
        const candidatos = (linha.horarios || [])
          .filter(h => h.dias?.includes(diaAtual))
          .map(h => {
            const [hh, mm] = h.hora.split(":").map(Number)
            return { hora: h.hora, min: hh * 60 + mm }
          })
          .filter(h => h.min >= minutosAgora)
          .sort((a, b) => a.min - b.min)
        if (candidatos.length) {
          setProximoOnibus(candidatos[0].hora)
          break
        }
      }
    }).catch(() => {})
  }, [])

  const destaques = noticias.filter(n => n.destaque)
  const recentes  = noticias.filter(n => !n.destaque).slice(0, 3)
  const emFiltro  = !!(catSlug || q || dataInicio || dataFim || (ordem && ordem !== 'recente'))
  const isAtivo   = chave => modulos[chave]?.ativo !== false

  function mudarParam(key, value) {
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  function mudarPagina(p) {
    const next = new URLSearchParams(searchParams)
    if (p === 1) next.delete('page')
    else next.set('page', String(p))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {!emFiltro && isAtivo('hero')    && <Hero cfg={cfg} />}
      {!emFiltro && isAtivo('topicos') && <FaixaTopicos topicos={topicos} />}
      {!emFiltro && (
        <SecaoServicos
          modulos={modulos}
          proximoEvento={proximoEvento}
          proximoOnibus={proximoOnibus}
        />
      )}

      <div className="wrap py-10 space-y-12">

        {/* Painel de filtros avançados — visível em modo busca/filtro ou quando q está ativo */}
        {(q || catSlug) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            {/* Linha 1: badges de filtros ativos + limpar */}
            <div className="flex items-center gap-2 flex-wrap">
              {catSlug && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest-100
                                 text-forest-700 rounded-full text-sm font-bold">
                  <Tag size={13} aria-hidden="true"/> {catSlug}
                </span>
              )}
              {q && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100
                                 text-blue-700 rounded-full text-sm font-bold">
                  <Search size={13} aria-hidden="true"/> &ldquo;{q}&rdquo;
                </span>
              )}
              {dataInicio && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100
                                 text-purple-700 rounded-full text-sm font-bold">
                  De: {dataInicio}
                </span>
              )}
              {dataFim && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100
                                 text-purple-700 rounded-full text-sm font-bold">
                  Até: {dataFim}
                </span>
              )}
              <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold
                                      text-gray-400 hover:text-gray-600 transition-colors ml-auto">
                <X size={14} aria-hidden="true"/> Limpar tudo
              </Link>
            </div>

            {/* Linha 2: filtros de data + ordenação */}
            <div className="flex items-end gap-3 flex-wrap border-t border-gray-50 pt-3">
              <div>
                <label htmlFor="filtro-data-inicio" className="label text-xs">De</label>
                <input
                  id="filtro-data-inicio"
                  type="date"
                  value={dataInicio || ''}
                  onChange={e => mudarParam('dataInicio', e.target.value)}
                  className="input text-sm py-1.5 w-36"
                />
              </div>
              <div>
                <label htmlFor="filtro-data-fim" className="label text-xs">Até</label>
                <input
                  id="filtro-data-fim"
                  type="date"
                  value={dataFim || ''}
                  onChange={e => mudarParam('dataFim', e.target.value)}
                  className="input text-sm py-1.5 w-36"
                />
              </div>
              <div className="ml-auto">
                <label htmlFor="filtro-ordem" className="label text-xs">Ordenar por</label>
                <select
                  id="filtro-ordem"
                  value={ordem}
                  onChange={e => mudarParam('ordem', e.target.value === 'recente' ? '' : e.target.value)}
                  className="input text-sm py-1.5 w-44"
                >
                  <option value="recente">Mais recentes</option>
                  <option value="antigo">Mais antigos</option>
                  {q && <option value="relevancia">Relevância</option>}
                </select>
              </div>
            </div>

            {!loading && (
              <p className="text-xs text-gray-400 font-medium pt-1">
                {total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {loading && <LoadingSpinner texto="Buscando notícias..."/>}
        {error   && <ErrorMessage mensagem={error} onRetry={recarregar}/>}

        {!loading && !error && noticias.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">{q ? '🔍' : '📰'}</p>
            <p className="font-extrabold text-gray-500 text-lg">
              {q
                ? `Nenhuma notícia encontrada para "${q}".`
                : catSlug
                  ? `Nenhuma notícia em "${catSlug}".`
                  : 'Nenhuma notícia publicada ainda.'}
            </p>
            {emFiltro && <Link to="/" className="btn-primary mt-5 inline-flex">Ver todas</Link>}
          </div>
        )}

        {/* Modo filtro/busca — grid paginado */}
        {!loading && !error && emFiltro && noticias.length > 0 && (
          <section id="noticias">
            <div className="section-title">
              <h2 className="section-title-text">
                <Newspaper size={20} className="text-forest-600"/>
                {q ? `Resultados para "${q}"` : 'Notícias'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {noticias.map((n, i) => (
                <div key={n._id || n.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <NoticiaCardV noticia={n} fullWidth/>
                </div>
              ))}
            </div>
            <Paginacao pagina={page} paginas={paginas} onMudar={mudarPagina}/>
          </section>
        )}

        {/* Modo normal — seções da home */}
        {!loading && !error && !emFiltro && noticias.length > 0 && (
          <>
            {isAtivo('ultimas_noticias') && (
              <section id="noticias">
                <div className="section-title">
                  <h2 className="section-title-text">
                    <Newspaper size={20} className="text-forest-600"/> Últimas Notícias
                  </h2>
                  <Link to="/?page=1" className="section-title-link">
                    Ver todas <ArrowRight size={14}/>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentes.map((n, i) => (
                    <div key={n._id || n.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <NoticiaCardV noticia={n} fullWidth/>
                    </div>
                  ))}
                </div>
                <Paginacao pagina={page} paginas={paginas} onMudar={mudarPagina}/>
              </section>
            )}

            {isAtivo('noticias_externas') && externas.length > 0 && (
              <NoticiasExternas items={externas}/>
            )}

            {isAtivo('destaques') && destaques.length > 0 && (
              <section>
                <div className="section-title">
                  <h2 className="section-title-text">
                    <Star size={20} className="text-forest-600"/> Destaques
                  </h2>
                  <Link to="/eventos" className="section-title-link">
                    Ver eventos <ArrowRight size={14}/>
                  </Link>
                </div>
                <div className="space-y-3">
                  {destaques.slice(0, 4).map((n, i) => (
                    <div key={n._id || n.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <NoticiaCardLista noticia={n}/>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}