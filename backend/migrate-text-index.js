/**
 * migrate-text-index.js
 *
 * Cria o índice de texto ($text) na coleção `noticias` para os campos
 * `titulo` (peso 10) e `conteudo` (peso 1), com idioma português.
 *
 * Executar UMA VEZ em produção:
 *   node migrate-text-index.js
 *
 * Depois disso o Mongoose/server.js mantém o índice automaticamente via
 * noticiaSchema.index({ titulo: 'text', conteudo: 'text' }, ...).
 *
 * ATENÇÃO: Se já existe um índice $text na coleção com nome diferente,
 * drope-o antes com:
 *   db.noticias.dropIndex("idx_text_busca")
 */

import 'dotenv/config'
import mongoose from 'mongoose'

async function migrar() {
  await mongoose.connect(process.env.MONGO_URI)
  const db = mongoose.connection.db
  const col = db.collection('noticias')

  // Verifica índices existentes
  const indices = await col.indexes()
  const jaExiste = indices.some(idx => idx.name === 'idx_text_busca')

  if (jaExiste) {
    console.log('✅ Índice idx_text_busca já existe. Nada a fazer.')
  } else {
    await col.createIndex(
      { titulo: 'text', conteudo: 'text' },
      {
        weights: { titulo: 10, conteudo: 1 },
        name: 'idx_text_busca',
        default_language: 'portuguese',
      }
    )
    console.log('✅ Índice idx_text_busca criado com sucesso.')
  }

  await mongoose.connection.close()
}

migrar().catch(err => {
  console.error('❌ Erro na migração:', err.message)
  process.exit(1)
})
