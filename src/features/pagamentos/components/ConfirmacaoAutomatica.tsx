import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import mascoteCelular from '@/assets/mascote/celular.webp'
import { Cartao, TextoDoCartao } from '@/components/Cartao'

/**
 * O passo 2 quando o meio baixa sozinho — os do Mercado Pago da turma (Sprint 25): no
 * lugar do "Já paguei", a explicação de que não há o que avisar.
 *
 * A tela que o mostra relê a parcela a cada poucos segundos (`useParcela` com `acompanhar`), e troca
 * sozinha para "paga" quando o aviso do Mercado Pago chega. O Kapinha segura a espera.
 *
 * @param children O que o pagamento cobre, quando a tela mostra.
 */
export function ConfirmacaoAutomatica({ children }: { children?: ReactNode }) {
  return (
    <Cartao
      passo={2}
      titulo="Não precisa avisar"
      descricao="O Mercado Pago confirma o pagamento automaticamente, sem você precisar avisar a tesouraria."
    >
      {children}

      <div className="bg-muted flex items-center gap-4 rounded-2xl p-4">
        <img src={mascoteCelular} alt="" className="w-14 shrink-0 drop-shadow-lg" />
        <TextoDoCartao className="flex items-start gap-2">
          <LoaderCircle className="mt-0.5 size-4 shrink-0 motion-safe:animate-spin" aria-hidden />
          Depois de pagar, aguarde nesta tela. Assim que o pagamento for confirmado, a parcela aparecerá como
          paga. Você também receberá um e-mail.
        </TextoDoCartao>
      </div>
    </Cartao>
  )
}
