import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { faixasDePublicacao, FiltroDePeriodo } from '@/components/FiltroDePeriodo'

/**
 * O painel de filtros da trilha: o período, e só ele.
 *
 * Quem fez e o que aconteceu são seletores à vista na barra — as duas perguntas da assembleia não
 * merecem um clique a mais. Aqui fica o "no mês passado", que é o recorte que a contagem ao lado já
 * repete por extenso.
 *
 * O período usa as faixas de publicação: a trilha olha para trás, não para vencimentos.
 *
 * @param aoMudar Grava na query string; recebe as duas pontas do período de uma vez.
 */
export function FiltroDeAuditoria({
  de,
  ate,
  aoMudar,
}: {
  de?: string
  ate?: string
  aoMudar: (mudancas: Record<string, string | null>) => void
}) {
  return (
    <BotaoDeFiltros id="filtros-da-auditoria" ligados={de || ate ? 1 : 0} largura="w-80">
      <FiltroDePeriodo
        de={de}
        ate={ate}
        legenda="Quando"
        faixas={faixasDePublicacao()}
        aoMudar={(faixa) => aoMudar({ de: faixa.de, ate: faixa.ate })}
      />
    </BotaoDeFiltros>
  )
}
