import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Rota que exige apenas login (qualquer usuário autenticado). */
export default function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

/**
 * Rota exclusiva do painel admin.
 * Usuários do tipo "Usuário" (sem permissões) são redirecionados para a home,
 * evitando que vejam o painel mesmo que tenham credenciais válidas.
 */
export function AdminRoute({ children }) {
  const { user, podeAcessarAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!podeAcessarAdmin()) return <Navigate to="/" replace />
  return children
}
