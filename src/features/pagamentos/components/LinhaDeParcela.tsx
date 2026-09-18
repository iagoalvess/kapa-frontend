import { useId } from 'react'
import { Link } from 'react-router'
import { ChipDeStatus } from '@/components/ChipDeStatus'
import { Button } from '@/components/ui/button'
import { rotaDoPagamento } from '@/config/rotas'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { emAberto, pagaEmParte, rotuloDoItem, type TipoDeCobranca, valorNaLista } from '@/types/cobranca'
import type { Parcela } from '../types/pagamentos.types'
import { CalculoDoValor, temEncargoOuDesconto } from './CalculoDoValor'

/**
 * A cor do círculo por tipo de cobrança — a mensalidade do mês e a rifa se distinguem de relance.
 *
 * Sai da paleta dos avatares (`Avatar`), a mesma que nomeia as pessoas em Membros; o laranja
 * (`avatar-5`) fica de fora, que é a cor da marca e só o botão a usa.
 */
const CORES_DE_TIPO: Record<TipoDeCobranca, string> = {
  Mensalidade: 'bg-avatar-2',
  Adesao: 'bg-avatar-1',
  Rifa: 'bg-avatar-4',
  ConviteExtra: 'bg-avatar-3',
  Avulsa: 'bg-avatar-6',
}

/**
 * Uma parcela na grade do formando: o número no círculo do tipo, vencimento, valor, situação e o
 * "Pagar" — as mesmas colunas da lista da gestão, sem o formando (aqui é sempre ele).
 *
 * A vencida mostra o valor de hoje, com multa e juros, e a conta abre ao tocar (`<details>`,
 * nativo: teclado e leitor de tela vêm prontos).
 *
 * @param proxima A primeira a pagar: só ela leva o botão cheio, como o "Conferir" vazado das listas
 *   da gestão nas demais — vinte botões laranja seguidos não destacam nenhum.
 */
export function LinhaDeParcela({ parcela, proxima = false }: { parcela: Parcela; proxima?: boolean }) {
  // Um balão por linha: id e âncora próprios, senão todos os gatilhos abrem o primeiro.
  const balao = `calculo-${useId().replaceAll(':', '')}`
  const ancora = `--${balao}`
  const podePagar = emAberto(parcela) && !parcela.em_conferencia
  const calculo =
    emAberto(parcela) && temEncargoOuDesconto(parcela.valor_do_dia) ? parcela.valor_do_dia : undefined
  const valor = valorNaLista(parcela)

  return (
    <tr className="border-b last:border-0">
      {/* O item nomeia a linha: cabeçalho de linha, como nas outras planilhas. */}
      <th scope="row" className="py-3 pr-4 text-left font-normal">
        <div className="flex items-center gap-3">
          {/* A posição da parcela no círculo da cor do tipo, como o avatar de Membros nomeia a
              pessoa. Miúdo de propósito: "12/24" tem de caber no círculo do tamanho do avatar. */}
          <span
            className={cn(
              'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-medium text-white tabular-nums',
              CORES_DE_TIPO[parcela.tipo],
            )}
          >
            {parcela.numero}/{parcela.de}
          </span>
          <span className="text-foreground font-medium">{rotuloDoItem(parcela)}</span>
        </div>
      </th>
      <td className="py-3 pr-4">
        {formatarData(parcela.vencimento)}
        {parcela.pago_em ? (
          <span className="text-texto-muted block text-xs">Paga em {formatarData(parcela.pago_em)}</span>
        ) : null}
        {/* O parcial precisa aparecer: sem isso, a coluna Valor cai sozinha e parece erro de cobrança. */}
        {pagaEmParte(parcela) ? (
          <span className="text-texto-muted block text-xs">
            Já pagou {formatarCentavos(parcela.valor_pago_em_centavos ?? 0)}
          </span>
        ) : null}
      </td>
      <td className="py-3 pr-4 text-right">
        <span className="grid justify-items-end">
          {formatarCentavos(valor)}
          {/* Balão `popover` nativo, e não um `<details>`: aberto, ele vive na camada de cima e não
              empurra a linha — a grade não muda de altura ao abrir a conta. Clique fora e Esc
              fecham sozinhos; sem posicionamento por âncora, o balão abre no centro da tela. */}
          {calculo ? (
            <>
              <button
                type="button"
                popoverTarget={balao}
                style={{ anchorName: ancora }}
                className="text-brand-text focus-visible:ring-ring cursor-pointer rounded text-xs focus-visible:ring-2 focus-visible:outline-none"
              >
                {calculo.desconto_em_centavos ? 'Com desconto' : 'Por que este valor?'}
              </button>
              <div
                id={balao}
                popover="auto"
                data-painel=""
                style={{ positionAnchor: ancora }}
                className="bg-card shadow-cartao text-foreground w-64 rounded-2xl border p-3 text-left font-normal"
              >
                <CalculoDoValor valor={calculo} />
              </div>
            </>
          ) : null}
        </span>
      </td>
      <td className="py-3 pr-4">
        <ChipDeStatus status={parcela.status} em_conferencia={parcela.em_conferencia} />
      </td>
      <td className="py-3 text-right">
        {podePagar ? (
          <Button asChild size="sm" variant={proxima ? 'default' : 'outline'}>
            <Link
              to={rotaDoPagamento(parcela.id)}
              aria-label={`Pagar a parcela ${parcela.numero}/${parcela.de}`}
            >
              Pagar
            </Link>
          </Button>
        ) : null}
      </td>
    </tr>
  )
}
