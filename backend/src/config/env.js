/**
 * #14 — Validação de variáveis de ambiente com Zod.
 * O servidor recusa a inicializar se alguma variável obrigatória estiver ausente.
 *
 * IMPORTANTE: dotenv é carregado aqui, ANTES da validação Zod.
 * Isso garante que process.env já está populado com o .env quando o schema roda.
 * Em ES Modules os imports são hoistados — por isso dotenv/config NÃO pode
 * estar só no server.js (seria executado depois deste módulo).
 */
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  PORT:                    z.coerce.number().default(3001),
  MONGO_URI:               z.string().min(1, 'MONGO_URI é obrigatório'),
  JWT_SECRET:              z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN:          z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME:   z.string().min(1, 'CLOUDINARY_CLOUD_NAME é obrigatório'),
  CLOUDINARY_API_KEY:      z.string().min(1, 'CLOUDINARY_API_KEY é obrigatório'),
  CLOUDINARY_API_SECRET:   z.string().min(1, 'CLOUDINARY_API_SECRET é obrigatório'),
  REDIS_URL:               z.string().default('redis://localhost:6379'),
  FRONTEND_URL:            z.string().default('http://localhost:5173'),
  ADMIN_EMAIL:             z.string().email().optional(),
  ADMIN_SENHA:             z.string().optional(),
})

function validarEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Variáveis de ambiente inválidas:')
    for (const issue of parsed.error.issues) {
      console.error(`   • ${issue.path.join('.')}: ${issue.message}`)
    }
    process.exit(1)
  }
  return parsed.data
}

export const env = validarEnv()
