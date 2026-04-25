import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import PrivateRoute, { AdminRoute } from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import GlobalMeta from './components/GlobalMeta'
import LoadingSpinner from './components/LoadingSpinner'
import { ThemeProvider } from './context/ThemeContext'

// Páginas públicas — carregadas no bundle principal (pequenas, sempre necessárias)
import Home from './pages/Home'
import NoticiaDetalhe from './pages/NoticiaDetalhe'
import Login from './pages/Login'
import Eventos from './pages/Eventos'
import HorarioOnibus from './pages/HorarioOnibus'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'

// Páginas admin — lazy: só visitantes autenticados as usam.
// Cada import() vira um chunk separado; se o hash mudar após um deploy,
// o ChunkLoadError é capturado pelo handler em main.jsx → reload automático.
const AdminLayout       = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminNoticiaForm  = lazy(() => import('./pages/admin/AdminNoticiaForm'))
const AdminNoticias     = lazy(() => import('./pages/admin/AdminNoticias'))
const AdminCategorias   = lazy(() => import('./pages/admin/AdminCategorias'))  // B1
const AdminModulos      = lazy(() => import('./pages/admin/AdminModulos'))
const AdminOnibus       = lazy(() => import('./pages/admin/AdminOnibus'))
const AdminEventos      = lazy(() => import('./pages/admin/AdminEventos'))
const AdminNewsletter   = lazy(() => import('./pages/admin/AdminNewsletter'))
const AdminSEO          = lazy(() => import('./pages/admin/AdminSEO'))
const AdminErros        = lazy(() => import('./pages/admin/AdminErros'))
const AdminUsuarios     = lazy(() => import('./pages/admin/AdminUsuarios'))
const AdminBackup       = lazy(() => import('./pages/admin/AdminBackup'))
const AdminSetup        = lazy(() => import('./pages/admin/AdminSetup'))
// ADICIONADO - Infraestrutura
const AdminInfraestrutura = lazy(() => import('./pages/admin/AdminInfraestrutura'))
// Temas
const AdminTemas = lazy(() => import('./pages/admin/AdminTemas'))
// Importação RSS
const AdminRssImport = lazy(() => import('./pages/admin/AdminRssImport'))
// Editor de arquivos de configuração
const AdminArquivos = lazy(() => import('./pages/admin/AdminArquivos'))

function AdminSuspense({ children }) {
  return (
    <Suspense fallback={<LoadingSpinner texto="Carregando painel..." />}>
      {children}
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <GlobalMeta />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
        <Route path="/noticia/:id" element={<><Navbar /><NoticiaDetalhe /><Footer /></>} />
        <Route path="/onibus" element={<><Navbar /><HorarioOnibus /><Footer /></>} />
        <Route path="/eventos" element={<><Navbar /><Eventos /><Footer /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        {/* Admin — lazy + Suspense */}
        <Route path="/admin" element={
          <AdminRoute>
            <ThemeProvider>
              <AdminSuspense>
                <AdminLayout />
              </AdminSuspense>
            </ThemeProvider>
          </AdminRoute>
        }>
          <Route index element={<AdminSuspense><AdminDashboard /></AdminSuspense>} />
          <Route path="nova-noticia" element={<AdminSuspense><AdminNoticiaForm /></AdminSuspense>} />
          <Route path="editar/:id" element={<AdminSuspense><AdminNoticiaForm /></AdminSuspense>} />
          <Route path="noticias"    element={<AdminSuspense><AdminNoticias /></AdminSuspense>} />
          <Route path="categorias"  element={<AdminSuspense><AdminCategorias /></AdminSuspense>} />
          <Route path="modulos" element={<AdminSuspense><AdminModulos /></AdminSuspense>} />
          <Route path="onibus" element={<AdminSuspense><AdminOnibus /></AdminSuspense>} />
          <Route path="eventos" element={<AdminSuspense><AdminEventos /></AdminSuspense>} />
          <Route path="newsletter" element={<AdminSuspense><AdminNewsletter /></AdminSuspense>} />
          <Route path="seo" element={<AdminSuspense><AdminSEO /></AdminSuspense>} />
          <Route path="erros"    element={<AdminSuspense><AdminErros /></AdminSuspense>} />
          <Route path="usuarios" element={<AdminSuspense><AdminUsuarios /></AdminSuspense>} />
          <Route path="backup"   element={<AdminSuspense><AdminBackup /></AdminSuspense>} />
          {/* ADICIONADO - Rota de Infraestrutura */}
          <Route path="infraestrutura" element={<AdminSuspense><AdminInfraestrutura /></AdminSuspense>} />
          {/* Gerenciamento de Temas */}
          <Route path="temas" element={<AdminSuspense><AdminTemas /></AdminSuspense>} />
          {/* Importação via RSS */}
          <Route path="rss-import" element={<AdminSuspense><AdminRssImport /></AdminSuspense>} />
          <Route path="arquivos" element={<AdminSuspense><AdminArquivos /></AdminSuspense>} />
        </Route>

        {/* Setup — sem autenticação, redireciona se já instalado */}
        <Route path="/admin/setup" element={<AdminSuspense><AdminSetup /></AdminSuspense>} />

        {/* 404 */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen flex-col gap-3">
            <h1 className="text-6xl font-heading font-black text-gray-200">404</h1>
            <p className="text-gray-500">Página não encontrada</p>
            <a href="/" className="btn-primary mt-2">Voltar ao início</a>
          </div>
        } />
      </Routes>
    </>
  )
}