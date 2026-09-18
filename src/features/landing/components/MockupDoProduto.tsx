import printDaConferencia from '@/assets/prints/conferencia.png'
import printDoCaixa from '@/assets/prints/caixa.png'
import printDoPagamento from '@/assets/prints/pagar.png'
import { cn } from '@/lib/utils'

/** As telas que a página mostra, e o que cada uma responde. */
const TELAS = [
  {
    src: printDoCaixa,
    titulo: 'O caixa da turma',
    legenda: 'Quanto entrou, quanto saiu e quanto sobra — a tela que abre na assembleia.',
    destaque: true,
  },
  {
    src: printDoPagamento,
    titulo: 'A parcela do formando',
    legenda: 'QR do PIX, copia-e-cola e o botão "já paguei".',
    destaque: false,
  },
  {
    src: printDaConferencia,
    titulo: 'A conferência',
    legenda: 'A fila de avisos de pagamento, conferida em lote contra o extrato.',
    destaque: false,
  },
] as const

/**
 * As telas do produto, como elas são hoje.
 *
 * São prints do sistema rodando (`docs/design/atual`), e não ilustração: quem está escolhendo
 * assessoria quer ver a tela que vai usar. Ilustração de produto é o que se faz quando o produto
 * ainda não existe.
 *
 * Carregam com `loading="lazy"`: são três imagens pesadas abaixo da dobra, e a primeira tela da
 * landing não pode esperar por elas.
 */
export function MockupDoProduto() {
  return (
    <section className="px-4 pb-16 sm:pb-24">
      {/* Duas colunas, e a tela de destaque ocupando as duas em cima. Com três colunas a terceira
          caía sozinha na linha de baixo e deixava dois terços da seção vazios. */}
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        {TELAS.map((tela) => (
          <figure
            key={tela.titulo}
            className={cn(
              'revelar bg-card shadow-cartao grid content-start gap-4 overflow-hidden rounded-3xl p-4',
              tela.destaque && 'lg:col-span-2',
            )}
          >
            {/* Proporção fixa: os prints têm alturas diferentes, e sem ela os dois cartões da
                linha de baixo ficam com a legenda em alturas diferentes. */}
            <img
              src={tela.src}
              alt={`Tela do Kapa: ${tela.titulo}`}
              loading="lazy"
              decoding="async"
              className={cn(
                'ring-border w-full rounded-2xl object-cover object-top ring-1',
                tela.destaque ? 'aspect-[21/9]' : 'aspect-[16/9]',
              )}
            />
            <figcaption className="grid gap-1 px-1 pb-1">
              <p className="text-foreground font-medium">{tela.titulo}</p>
              <p className="text-muted-foreground text-sm text-pretty">{tela.legenda}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
