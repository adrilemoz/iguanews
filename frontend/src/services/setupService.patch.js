// ─── PATCH para frontend/src/services/api.js ─────────────────────────────────
//
// Substitua o bloco "setupService" existente por este:
//

export const setupService = {
  // Verifica se o setup já foi feito e o estado atual do banco
  async status() {
    return api('/setup/status')
  },

  // Instalação inicial (primeiro acesso — banco vazio)
  async instalar(dados) {
    return api('/setup', { method: 'POST', body: JSON.stringify(dados) })
  },

  // Importar dados de exemplo via web (requer autenticação)
  async seed({ nome_site = 'IguaNews', limpar_antes = false } = {}) {
    return api('/setup/seed', {
      method: 'POST',
      body: JSON.stringify({ nome_site, limpar_antes }),
    })
  },

  // Resetar banco (requer autenticação + confirmação textual)
  async resetDb({ confirmar, manter_usuarios = true } = {}) {
    return api('/setup/reset-db', {
      method: 'POST',
      body: JSON.stringify({ confirmar, manter_usuarios }),
    })
  },
}
