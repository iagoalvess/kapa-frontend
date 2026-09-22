import { Link } from 'react-router'
import { rotaDoItemDaFesta } from '@/config/rotas'
import { formatarCentavos } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { ItemDaFesta } from '@/types/festa'
import { ICONE_DA_CATEGORIA } from './iconeDaCategoria'

/**
 * Um item na lista da esquerda: ícone da categoria, título, fornecedor ou preço, e o que falta.
 *
 * É a linha de uma lista, e não um cartão — quem leva sombra e respiro é o cartão que a contém. O
 * item aberto fica com o fundo da marca e `aria-current`, que é como o leitor de tela sabe qual
 * dos links está sendo mostrado ao lado. É o mesmo desenho do mural.
 *
 * A segunda linha muda com o estado, porque o que interessa muda: quem ainda não contratou quer
 * saber quantas propostas há e quanto está orçado; quem já contratou quer o fornecedor e quanto
 * falta pagar.
 */
export function LinhaDoItem({ item, aberto }: { item: ItemDaFesta; aberto: boolean }) {
  const Icone = ICONE_DA_CATEGORIA[item.categoria]

  return (
    <li>
      <Link
        to={rotaDoItemDaFesta(item.id)}
        aria-current={aberto ? 'true' : undefined}
        className={cn(
          'flex items-center gap-3 border-l-2 px-4 py-3',
          aberto ? 'bg-brand-tint border-brand' : 'hover:bg-border/40 border-transparent',
        )}
      >
        <span
          className={cn(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-xl',
            item.cancelado ? 'bg-muted text-muted-foreground' : 'bg-brand-tint text-brand-text',
          )}
        >
          <Icone className="size-4.5" strokeWidth={1.75} aria-hidden />
        </span>

        <span className="grid min-w-0 flex-1 gap-0.5">
          <span
            className={cn(
              'text-foreground truncate text-sm font-medium',
              item.cancelado && 'text-muted-foreground line-through',
            )}
          >
            {item.titulo}
          </span>
          <span className="text-muted-foreground truncate text-xs">{segundaLinha(item)}</span>
        </span>

        {item.custo_em_centavos > 0 ? (
          <span className="text-texto-muted shrink-0 text-xs tabular-nums">
            {formatarCentavos(item.custo_em_centavos)}
          </span>
        ) : null}
      </Link>
    </li>
  )
}

/**
 * A segunda linha, que muda com o estado do item.
 *
 * Não mostra "0 propostas": ausência não é notícia, e um "0" em cada linha de turma nova faria a
 * lista inteira parecer um relatório de nada.
 *
 * @param item O item da linha.
 */
function segundaLinha(item: ItemDaFesta) {
  if (item.cancelado) return 'A turma desistiu'
  if (item.fornecedor) {
    const falta = item.contratado_em_centavos - item.pago_em_centavos

    return falta > 0 ? `${item.fornecedor} · falta ${formatarCentavos(falta)}` : `${item.fornecedor} · pago`
  }
  if (item.quantidade_de_propostas > 0)
    return `${item.quantidade_de_propostas} ${item.quantidade_de_propostas === 1 ? 'proposta' : 'propostas'}`

  return item.custo_em_centavos > 0 ? 'Orçado, sem proposta' : 'Sem orçamento'
}
