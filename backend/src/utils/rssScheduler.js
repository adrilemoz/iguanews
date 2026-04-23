/**
 * Scheduler de Importação RSS Automática.
 *
 * Verifica a cada minuto quais fontes RSS têm auto_update ativo
 * e cujo intervalo desde a última importação já foi atingido.
 *
 * A configuração (intervalo, ativa, auto_update) é lida do banco
 * em cada ciclo, garantindo que alterações feitas na UI entrem
 * em vigor sem reiniciar o servidor.
 */
import RssFonte           from '../models/RssFonte.js'
import { importarFonte }  from '../services/rssImporter.js'   // ✅ usa o serviço, não a rota
import { logger }         from './logger.js'

let schedulerTimer = null
let emExecucao     = false // evita execuções concorrentes

/**
 * Executa um ciclo de verificação e importação das fontes pendentes.
 */
async function cicloScheduler() {
  if (emExecucao) return
  emExecucao = true

  try {
    const fontes = await RssFonte.find({ ativa: true, auto_update: true })
    if (!fontes.length) return

    const agora = Date.now()

    for (const fonte of fontes) {
      const ultimaMs    = fonte.ultima_importacao ? fonte.ultima_importacao.getTime() : 0
      const intervaloMs = (fonte.intervalo_min || 60) * 60 * 1_000

      if (agora - ultimaMs < intervaloMs) continue // ainda não é hora

      try {
        const r = await importarFonte(fonte)
        logger.info({ fonte: fonte.nome, ...r }, '🔄 RSS auto-importado')
      } catch (err) {
        logger.error({ fonte: fonte.nome, err: err.message }, '❌ Erro no auto-import RSS')
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Erro no ciclo do scheduler RSS')
  } finally {
    emExecucao = false
  }
}

/**
 * Inicia o scheduler RSS.
 * Deve ser chamado após a conexão com o MongoDB.
 */
export function iniciarSchedulerRss() {
  if (schedulerTimer) return // já iniciado

  // Aguarda 30s na primeira vez (permite o servidor estabilizar)
  setTimeout(() => {
    cicloScheduler()  // primeira execução

    // Verifica a cada minuto se alguma fonte precisa ser atualizada
    schedulerTimer = setInterval(cicloScheduler, 60_000)
    logger.info('📡 Scheduler RSS iniciado (verificação a cada 60s)')
  }, 30_000)
}

/**
 * Para o scheduler RSS (útil no graceful shutdown).
 */
export function pararSchedulerRss() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
    logger.info('📡 Scheduler RSS encerrado')
  }
}
