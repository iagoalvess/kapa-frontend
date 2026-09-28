import { Send, WalletMinimal } from 'lucide-react'
import { Link } from 'react-router'
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
  return <ParcelasPage AcoesDaLinha={AcoesDaLinha} AcoesDaBarra={AcoesDaBarra} />
}

/** Da lista da turma, a Gestão abre as próprias parcelas e o histórico de avisos. */
function AcoesDaBarra() {
  return (
    <>
      <Button asChild size="xs">
        <Link to={ROTAS.extrato}>
          <WalletMinimal aria-hidden />
          Minhas parcelas
        </Link>
      </Button>
      <Button asChild size="xs">
        <Link to={ROTAS.avisosEnviados}>
          <Send aria-hidden />
          Avisos enviados
        </Link>
      </Button>
    </>
  )
}

/**
 * Cobrar aparece só na parcela vencida e sem aviso de pagamento pendente: cobrar quem acabou de
 * avisar que pagou é o jeito mais rápido de a turma desinstalar o produto.
 */
function AcoesDaLinha({ parcela }: { parcela: Parcela }) {
  const { tem } = usePapel()
  const cobravel = parcela.status === 'Vencida' && !parcela.em_conferencia && tem(PAPEIS.tesoureiro)

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {cobravel ? <BotaoDeCobranca parcela={parcela} /> : null}
      <AcoesDaParcela parcela={parcela} />
    </div>
  )
}
