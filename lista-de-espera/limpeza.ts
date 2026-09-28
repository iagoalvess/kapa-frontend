/**
 * Apaga as inscrições cujo aceite passou de 12 meses (Sprint 36, P8). Roda uma vez por dia, pelo
 * Cron Trigger do `wrangler.toml`. Quem se inscreve de novo renova o aceite e recomeça a contagem.
 */
import type { BancoD1 } from '../functions/api/lista-de-espera.ts'

/**
 * O corte da guarda: a mesma data, 12 meses antes, em UTC — o formato que a Function grava.
 *
 * @param agora A data de referência.
 */
export function limiteDaGuarda(agora: Date) {
  const limite = new Date(agora)
  limite.setUTCFullYear(limite.getUTCFullYear() - 1)
  return limite.toISOString()
}

export default {
  async scheduled(_: unknown, env: { LISTA_DE_ESPERA: BancoD1 }) {
    await env.LISTA_DE_ESPERA.prepare('DELETE FROM inscricoes WHERE aceito_em < ?1')
      .bind(limiteDaGuarda(new Date()))
      .run()
  },
}
