import { Check, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { ICONE_DE_PLANO_PADRAO, ICONES_DE_PLANO } from '@/config/planos'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { Plano } from '@/types/plano'

/**
 * Os destaques da vitrine: cinco linhas, não os dez módulos.
 *
 * A lista inteira faz a pessoa ler dez itens para achar os quatro que separam um plano do outro.
 * Cada linha agrupa o que anda junto e se liga ao <b>código que a representa</b> — é a presença
 * desse código no plano que decide o ✓ ou o ✗, então retirar um módulo do catálogo apaga a linha
 * correspondente em vez de deixar a vitrine prometendo o que a API não dá.
 *
 * O nome sai daqui, e não de `nomeDoModulo`: ali é o rótulo de um módulo, aqui é a frase de venda
 * de um conjunto deles.
 */
const DESTAQUES = [
  { modulo: 'cobrancas', texto: 'Cobranças, parcelas e PIX da turma' },
  { modulo: 'termo', texto: 'Termo de adesão digital e convites' },
  { modulo: 'despesas', texto: 'Despesas, fornecedores e caixa' },
  { modulo: 'avisos', texto: 'Mural, avisos e régua de cobrança' },
  { modulo: 'relatorios', texto: 'Balancete, planilhas e relatórios em PDF' },
] as const

/**
 * O card de um plano, com o que ele **não** inclui à vista — o mesmo na landing e na assinatura.
 *
 * Os cards listam os mesmos destaques, e o que muda é o sinal: quem não tem leva um ✗. Listar
 * em cada card só o que ele inclui obriga a pessoa a comparar duas listas de tamanhos diferentes
 * para descobrir o que falta — que é a única pergunta que ela tem diante de dois planos.
 *
 * @param plano O plano do ciclo escolhido.
 * @param faixa O texto da faixa no topo. Ausente, só o recomendado ganha a sua ("Melhor oferta").
 * @param children O rodapé: o botão de cada tela.
 */
export function CartaoDePlano({
  plano,
  faixa,
  children,
}: {
  plano: Plano
  faixa?: string
  children: ReactNode
}) {
  const Icone = ICONES_DE_PLANO[plano.codigo] ?? ICONE_DE_PLANO_PADRAO
  const textoDaFaixa = faixa ?? (plano.recomendado ? 'Melhor oferta' : undefined)
  // O anual é anunciado pelo equivalente mensal, e a cobrança cheia vem na linha de baixo.
  const porMes = plano.ciclo === 'Anual' ? Math.round(plano.preco_em_centavos / 12) : plano.preco_em_centavos

  return (
    <li
      aria-labelledby={`plano-${plano.codigo}`}
      className={cn(
        'relative flex flex-col rounded-[26px]',
        // O destacado é uma moldura da marca com a faixa no topo; o outro, um cartão branco.
        textoDaFaixa ? 'bg-brand shadow-destaque' : 'border-border bg-card shadow-cartao border',
      )}
    >
      {textoDaFaixa ? (
        <p className="text-on-brand py-2 text-center text-xs font-semibold">{textoDaFaixa}</p>
      ) : null}

      <div
        className={cn(
          // Coluna flex, e não grade: é o que faz o `mt-auto` do rodapé descer até o pé do cartão.
          // Numa grade com `content-start` a sobra fica fora das faixas e os dois botões param em
          // alturas diferentes — o degrau que se vê com listas de tamanhos diferentes.
          'flex flex-1 flex-col gap-3.5 rounded-3xl p-5',
          textoDaFaixa && 'from-card to-brand-wash mx-1.5 mb-1.5 bg-gradient-to-b',
        )}
      >
        <div className="flex items-start gap-3">
          <span className="bg-brand-tint text-brand-text inline-flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Icone className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="grid gap-1">
            <h3 id={`plano-${plano.codigo}`} className="text-foreground text-xl font-semibold">
              {plano.nome}
            </h3>
            <p className="text-muted-foreground text-sm text-pretty">{plano.descricao}</p>
          </div>
        </div>

        <div className="grid gap-1">
          <p className="flex items-baseline gap-1.5">
            <span className="text-foreground text-4xl font-semibold tracking-tight tabular-nums">
              {formatarCentavos(porMes)}
            </span>
            <span className="text-muted-foreground text-sm">/ mês</span>
          </p>
          <p className="text-texto-muted text-sm">
            {plano.ciclo === 'Anual'
              ? `Cobrança única de ${formatarCentavos(plano.preco_em_centavos)} ao assinar`
              : 'Cobrado mês a mês, uma assinatura por formatura'}
          </p>
        </div>

        <ul className="grid gap-2">
          <li className="text-foreground flex items-start gap-2 text-sm">
            <Check className="text-brand-text mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            <span>
              Até <strong className="font-semibold">{formatarNumero(plano.limite_de_formandos)}</strong>{' '}
              formandos
            </span>
          </li>
          {DESTAQUES.map((destaque) => {
            const incluido = plano.modulos.includes(destaque.modulo)

            return (
              <li
                key={destaque.modulo}
                className={cn(
                  'flex items-start gap-2 text-sm',
                  incluido ? 'text-muted-foreground' : 'text-texto-muted',
                )}
              >
                {incluido ? (
                  <Check className="text-brand-text mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                ) : (
                  <X className="text-danger-text mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                )}
                <span className="sr-only">{incluido ? 'Incluído: ' : 'Não incluído: '}</span>
                {destaque.texto}
              </li>
            )
          })}
        </ul>

        <div className="mt-auto grid gap-2 pt-2">{children}</div>
      </div>
    </li>
  )
}
