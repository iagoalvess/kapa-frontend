import { HandCoins } from 'lucide-react'
import { type FormEvent, type ReactNode, useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CABECALHO_GRUDADO, CaixaRolavel } from '@/components/CaixaRolavel'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Button } from '@/components/ui/button'
import { rotaDoPagamentoEmLote } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { type Parcela, rotuloDoItem, valorNaLista } from '@/types/cobranca'

interface Props {
  /** As parcelas em aberto e sem aviso pendente — as únicas que a API aceita no mesmo pagamento. */
  parcelas: Parcela[]
}

/**
 * O "pagar várias parcelas": escolhe o que o PIX vai cobrir e leva para a tela do pagamento.
 *
 * Escolher e pagar são dois momentos, e só o primeiro cabe num diálogo: o QR com a soma, o nome do
 * titular e o "Já paguei" pedem a tela inteira, a mesma da parcela avulsa. Daqui não sai requisição
 * nenhuma — quem monta o BR Code do total é a API, na tela seguinte.
 *
 * @param parcelas As parcelas que podem entrar no pagamento.
 */
export function DialogoDeEscolhaDeParcelas({ parcelas }: Props) {
  const grupo = useId()
  const [aberto, definirAberto] = useState(false)
  const [escolhidas, definirEscolhidas] = useState<string[]>([])
  const liberado = useEscritaLiberada()
  const navegar = useNavigate()

  // O tipo só entra na coluna quando a grade mistura cobranças: com 24 mensalidades, repetir
  // "Mensalidade" em toda linha é ruído — é o que a grade do termo de adesão faz.
  const variosTipos = new Set(parcelas.map(rotuloDoItem)).size > 1

  const todasEscolhidas = parcelas.length > 0 && escolhidas.length === parcelas.length

  const soma = parcelas
    .filter((parcela) => escolhidas.includes(parcela.id))
    .reduce((total, parcela) => total + valorNaLista(parcela), 0)

  /** Cada abertura recomeça: nada escolhido. */
  const abrir = () => {
    definirEscolhidas([])
    definirAberto(true)
  }

  // A ordem da tela é a do extrato — por vencimento —, e é a mesma que a API usa para distribuir.
  const continuar = (evento: FormEvent) => {
    evento.preventDefault()
    const ids = parcelas.filter((parcela) => escolhidas.includes(parcela.id)).map((parcela) => parcela.id)
    navegar(rotaDoPagamentoEmLote(ids))
  }

  if (parcelas.length < 2) return null

  return (
    <>
      {/* Laranja e `h-8`, como a ação principal das outras listas: é a única ação desta tela, e o
          contorno a deixava com cara de filtro. */}
      <Button size="sm" className="h-8" onClick={abrir}>
        <HandCoins aria-hidden />
        Pagar várias parcelas
      </Button>

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Pagar várias parcelas"
        descricao="Escolha o que este pagamento vai cobrir. Na tela seguinte sai um PIX só, com a soma."
      >
        <form onSubmit={continuar} noValidate className="grid gap-4">
          {/* Só respiro lateral: o de cima e o de baixo vem do `py-2` das células, senão o cabeçalho
              e o degradê não encostam nas bordas da caixa. */}
          <CaixaRolavel className="border-border rounded-xl border px-4" altura="max-h-72">
            <table className="w-full text-sm">
              <caption className="sr-only">Parcelas em aberto, por vencimento</caption>
              {/* Cabeçalho grudado no topo, como o da grade do termo: rolando 24 linhas, a coluna
                  do meio vira "uma data qualquer" sem ele. */}
              <thead className="text-texto-muted sticky top-0 text-left text-xs">
                <tr>
                  <th className={`${CABECALHO_GRUDADO} w-8 font-normal`}>
                    <input
                      type="checkbox"
                      aria-label="Incluir todas as parcelas no pagamento"
                      className="accent-primary size-4 align-middle"
                      checked={todasEscolhidas}
                      // Alguma marcada, mas não todas: o traço do meio, que o HTML só tem por
                      // propriedade — não há atributo para ele.
                      ref={(campo) => {
                        if (campo) campo.indeterminate = escolhidas.length > 0 && !todasEscolhidas
                      }}
                      onChange={(evento) =>
                        definirEscolhidas(evento.target.checked ? parcelas.map((parcela) => parcela.id) : [])
                      }
                    />
                  </th>
                  <th className={`${CABECALHO_GRUDADO} pr-3 font-normal`}>Parcela</th>
                  <th className={`${CABECALHO_GRUDADO} pr-3 font-normal`}>Vencimento</th>
                  <th className={`${CABECALHO_GRUDADO} text-right font-normal`}>Valor</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {parcelas.map((parcela) => {
                  const campo = `${grupo}-${parcela.id}`
                  const rotulo = (conteudo: ReactNode) => (
                    <label htmlFor={campo} className="block cursor-pointer">
                      {conteudo}
                    </label>
                  )

                  return (
                    <tr key={parcela.id} className="border-b last:border-0">
                      <td className="py-2">
                        <input
                          id={campo}
                          type="checkbox"
                          // Os rótulos visíveis são os das outras colunas, e nenhum deles é "a
                          // parcela inteira": quem ouve a linha precisa do número junto do verbo.
                          aria-label={`Incluir a parcela ${parcela.numero}/${parcela.de} de ${rotuloDoItem(parcela)} no pagamento`}
                          className="accent-primary size-4 align-middle"
                          checked={escolhidas.includes(parcela.id)}
                          onChange={(evento) =>
                            definirEscolhidas((atuais) =>
                              evento.target.checked
                                ? [...atuais, parcela.id]
                                : atuais.filter((id) => id !== parcela.id),
                            )
                          }
                        />
                      </td>
                      <td className="py-2 pr-3">
                        {rotulo(
                          <>
                            {parcela.numero}/{parcela.de}
                            {variosTipos ? (
                              <span className="text-muted-foreground"> · {rotuloDoItem(parcela)}</span>
                            ) : null}
                          </>,
                        )}
                      </td>
                      <td className="py-2 pr-3">{rotulo(formatarData(parcela.vencimento))}</td>
                      <td className="py-2 text-right">{rotulo(formatarCentavos(valorNaLista(parcela)))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CaixaRolavel>

          {escolhidas.length > 0 ? (
            <output className="text-muted-foreground text-sm">
              As parcelas escolhidas somam{' '}
              <strong className="text-foreground tabular-nums">{formatarCentavos(soma)}</strong>.
            </output>
          ) : null}

          <AcoesDoFormulario
            aoCancelar={() => definirAberto(false)}
            desabilitado={!liberado || escolhidas.length === 0}
            rotulo="Continuar"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}
