import { MailCheck } from 'lucide-react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import ParcelasPage from '@/features/cobrancas/pages/ParcelasPage'
import { BotaoDeCobranca } from '@/features/notificacoes'
import { AcoesDaParcela } from '@/features/pagamentos'
import { usePapel } from '@/hooks/useSessao'
import type { Parcela } from '@/types/cobranca'

/**
 * As parcelas da turma, com a baixa manual, o estorno e a cobrança avulsa na linha de cada uma.
 *
 * Mora em `app/` porque compõe três features: a lista é de `cobrancas`, baixar e estornar são de
 * `pagamentos` e cobrar é de `notificacoes` — uma feature não importa de outra (Sprint 9: a baixa
 * manual começa na tela Parcelas; Sprint 13: o disparo avulso, também).
 */
export default function PaginaDeParcelas() {
  return (
    <ParcelasPage
      AcoesDaLinha={AcoesDaParcelaDaTurma}
      AcoesDaBarra={AcoesDaBarra}
      atalhosAdicionais={[
        { titulo: 'Avisos enviados', para: `${ROTAS.avisosEnviados}?origem=parcelas`, icone: MailCheck },
      ]}
    />
  )
}

/** No computador, o histórico de avisos continua na barra da lista; no celular fica na faixa de atalhos. */
function AcoesDaBarra() {
  return (
    <Button asChild size="xs">
      <LinkDaPagina to={`${ROTAS.avisosEnviados}?origem=parcelas`}>
        <MailCheck aria-hidden />
        Avisos enviados
      </LinkDaPagina>
    </Button>
  )
}

/**
 * Cobrar aparece só na parcela vencida e sem aviso de pagamento pendente: cobrar quem acabou de
 * avisar que pagou é o jeito mais rápido de a turma desinstalar o produto.
 */
function AcoesDaParcelaDaTurma({ parcela }: { parcela: Parcela }) {
  const { tem } = usePapel()
  const cobravel = parcela.status === 'Vencida' && !parcela.em_conferencia && tem(PAPEIS.tesoureiro)

  return (
    <AcoesDaLinha rotulo={`Ações da parcela de ${parcela.nome}`}>
      {cobravel ? <BotaoDeCobranca parcela={parcela} /> : null}
      <AcoesDaParcela parcela={parcela} />
    </AcoesDaLinha>
  )
}
