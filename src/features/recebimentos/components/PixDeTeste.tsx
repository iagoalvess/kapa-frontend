import { CircleCheck, ScanQrCode } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { QrCodePix } from '@/components/QrCodePix'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarCentavos } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { useConferirConta, usePixDeTeste } from '../hooks/useContaDeRecebimento'
import type { ContaDeRecebimento } from '../types/recebimentos.types'

/**
 * O único jeito de conferir a chave sem banco: o Presidente paga R$ 1,00 do próprio celular e vê o
 * nome que o banco mostra. O real cai na conta da própria turma.
 *
 * Recomendado, não obrigatório (decisão de 14/09/2026): a turma pode começar a pagar sem ele, mas
 * chave digitada errada é dinheiro na conta de um desconhecido, sem volta.
 */
export function PixDeTeste({ conta, className }: { conta: ContaDeRecebimento; className?: string }) {
  const pix = usePixDeTeste(true)
  const conferir = useConferirConta()
  const liberado = useEscritaLiberada()

  return (
    // `rotulo` em vez de `titulo`: o cabeçalho é desenhado aqui dentro, na coluna da esquerda, para
    // o QR começar na altura do título em vez de depois da descrição.
    <Cartao rotulo="PIX de teste" className={cn('@container', className)}>
      <div className="grid gap-6 @md:grid-cols-[minmax(0,1fr)_auto]">
        {/* `grid-rows-[auto_1fr]`: os passos ficam com a altura que sobra ao lado do QR e se centram
            nela, em vez de colarem no cabeçalho. */}
        <div className="grid gap-6 @md:grid-rows-[auto_1fr]">
          <header className="flex flex-wrap items-start gap-3">
            <span className="bg-brand-tint text-brand-text inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
              <ScanQrCode className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <h2 className="text-foreground flex flex-wrap items-center gap-2 text-xl leading-snug font-medium">
                PIX de teste
                <Selo tom="marca">Recomendado</Selo>
              </h2>
              <p className="text-muted-foreground text-[15px]">
                Pague do seu celular e confira o nome que o banco mostra.
              </p>
            </div>
          </header>

          <ol className="grid content-center gap-6 text-[15px]">
            <Passo numero={1}>
              No app do seu banco, pague {formatarCentavos(pix.data?.valor_em_centavos ?? 100)} lendo o QR ou
              colando o código.
            </Passo>
            <Passo numero={2}>Antes de confirmar o pagamento, veja o nome que o banco mostra.</Passo>
            <Passo numero={3}>
              Se for <strong className="text-foreground font-medium">{conta.nome_do_titular}</strong>, a chave
              está certa. Se aparecer outro nome, não pague: troque a chave.
            </Passo>
          </ol>
        </div>

        {pix.isPending ? (
          <EsqueletoDeCartoes quantidade={1} altura="h-44" className="self-start md:grid-cols-1" />
        ) : pix.isError ? (
          <ErroDaConsulta erro={pix.error} />
        ) : (
          <div className="border-border motion-safe:animate-entrar self-start rounded-2xl border p-4">
            <QrCodePix copiaECola={pix.data.copia_e_cola} />
          </div>
        )}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!liberado || conferir.isPending}
        onClick={() =>
          conferir.mutate(undefined, {
            onSuccess: () => toast.success('Chave conferida.'),
            onError: (erro) => toast.error(mensagemDoErro(erro)),
          })
        }
      >
        <CircleCheck aria-hidden />
        Conferi: o banco mostrou este titular
      </Button>
    </Cartao>
  )
}

/** Um passo do teste: o número num círculo da marca, como os passos do modelo. */
function Passo({ numero, children }: { numero: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="bg-brand-tint text-brand-text inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
        {numero}
      </span>
      <span className="text-muted-foreground pt-1 leading-relaxed">{children}</span>
    </li>
  )
}
