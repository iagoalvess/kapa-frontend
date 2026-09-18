import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { type UseFormReturn, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAdicionarItem, useAlterarItem } from '../hooks/usePlano'
import { useSimulacao } from '../hooks/useSimulacao'
import {
  esquemaDeItem,
  type FormularioDeItem as ValoresDoItem,
  itemEmBranco,
  mesCorrente,
  paraDadosDoItem,
  paraFormularioDeItem,
} from '../schemas/cobranca.schema'
import {
  type DadosDoItem,
  type ItemDeCobranca,
  ROTULOS_DE_TIPO,
  type TipoDeCobranca,
} from '../types/cobrancas.types'

const DIAS = Array.from({ length: 31 }, (_, indice) => String(indice + 1))

/**
 * O formulário do item e o que ele vale agora — o rascunho que alimenta a prévia.
 *
 * Mora na página, e não dentro do formulário, porque a prévia fica ao lado: os dois leem os mesmos
 * valores. O rascunho só existe quando o formulário é válido; enquanto isso a prévia mostra o plano
 * gravado.
 *
 * @param inicial Os valores do item em edição (o diálogo); ausente, o item novo em branco.
 */
export function useFormularioDeItem(inicial?: ValoresDoItem) {
  const formulario = useForm<ValoresDoItem>({
    resolver: zodResolver(esquemaDeItem),
    defaultValues: inicial ?? itemEmBranco(),
  })
  const valores = useWatch({ control: formulario.control })
  const validado = esquemaDeItem.safeParse(valores)

  return { formulario, rascunho: validado.success ? paraDadosDoItem(validado.data) : undefined }
}

interface Props {
  planoId: string
  formulario: UseFormReturn<ValoresDoItem>
  /** Item em edição; ausente, o formulário inclui um novo. */
  editando?: ItemDeCobranca
  /** Falso trava os campos — formatura fora de `Ativa`. */
  editavel: boolean
  /** Depois de salvar ou cancelar: fecha o diálogo. */
  aoConcluir: () => void
  /** Quantos já aderiram ao plano: item novo não os alcança (decisão de 14/09/2026). */
  jaAderiram?: number
  /** O que o item faz com a grade, logo acima do botão. Quem calcula é quem conhece o plano. */
  resumo?: ReactNode
}

/**
 * Tipo, valor, parcelas, dia e primeiro mês de um item.
 *
 * O valor se digita **por parcela** (R$ 350 por mês) ou **no total** (R$ 1.000 em 3×); a API
 * sempre recebe o total e divide, com o centavo que sobrar na primeira parcela.
 *
 * Item que já gerou parcela só muda valor e descrição: os outros campos travam, e a API recusaria
 * com `cobranca.item_em_uso` de qualquer forma.
 */
export function FormularioDeItem({
  planoId,
  formulario,
  editando,
  editavel,
  aoConcluir,
  jaAderiram = 0,
  resumo,
}: Props) {
  const adicionar = useAdicionarItem()
  const alterar = useAlterarItem()
  const salvando = adicionar.isPending || alterar.isPending
  const travaAGrade = !editavel || Boolean(editando?.em_uso)

  const [tipo, modoDoValor, rateio] = useWatch({
    control: formulario.control,
    name: ['tipo', 'modoDoValor', 'aplicar_a_quem_ja_aderiu'],
  })

  const enviar = formulario.handleSubmit((valores) => {
    const dados = paraDadosDoItem(valores)
    const aoTerminar = {
      onSuccess: () => {
        toast.success(editando ? 'Item salvo.' : 'Item incluído.')
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (editando) alterar.mutate({ planoId, itemId: editando.id, dados }, aoTerminar)
    else adicionar.mutate({ planoId, dados }, aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <Select {...field} disabled={travaAGrade}>
                    {Object.entries(ROTULOS_DE_TIPO).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>
                        {rotulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={!editavel}
                    placeholder={ROTULOS_DE_TIPO[tipo as TipoDeCobranca]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="valor_em_centavos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{modoDoValor === 'parcela' ? 'Valor de cada parcela' : 'Valor total'}</FormLabel>
                <FormControl>
                  <CampoDeMoeda {...field} disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="modoDoValor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>O valor é</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel}>
                    <option value="parcela">Por parcela</option>
                    <option value="total">O total, dividido nas parcelas</option>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="numero_de_parcelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelas</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={120}
                    disabled={travaAGrade}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="dia_de_vencimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vence todo dia</FormLabel>
                <FormControl>
                  <Select {...field} disabled={travaAGrade}>
                    {DIAS.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="primeiro_mes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primeiro vencimento</FormLabel>
                <FormControl>
                  {/* No rateio, o mês que já passou nasceria vencido — com multa e juros de um
                      atraso que ninguém teve como cometer. */}
                  <Input
                    {...field}
                    type="month"
                    min={rateio ? mesCorrente() : undefined}
                    disabled={travaAGrade}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-texto-muted text-xs">
          {editando?.em_uso
            ? 'Este item já gerou parcelas: só o valor e a descrição mudam, e o valor novo vale só para as parcelas que ainda não venceram.'
            : 'Dias 29, 30 e 31 caem no último dia nos meses mais curtos.'}
        </p>

        {resumo}

        {/* A parcela só nasce na adesão, então o item novo não alcança quem já aderiu — a não ser
            que a turma tenha decidido por todos, e aí é um rateio extraordinário. */}
        {!editando && editavel && jaAderiram > 0 ? (
          <div className="border-border grid gap-3 rounded-xl border p-4">
            <p className={rateio ? 'text-texto-muted text-sm' : 'text-warning-text text-sm'}>
              {jaAderiram === 1
                ? '1 formando já aderiu'
                : `${formatarNumero(jaAderiram)} formandos já aderiram`}
              {rateio
                ? ' e serão cobrados por este item, mesmo sem tê-lo aceitado no termo.'
                : ' e não serão cobrados por este item: ele vale para quem aderir daqui em diante.'}
            </p>

            <FormField
              control={formulario.control}
              name="aplicar_a_quem_ja_aderiu"
              render={({ field }) => (
                <FormItem>
                  <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(evento) => field.onChange(evento.target.checked)}
                      className="accent-primary size-4"
                    />
                    Cobrar também quem já aderiu
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            {rateio ? (
              <div className="motion-safe:animate-entrar grid gap-3">
                <FormField
                  control={formulario.control}
                  name="origem_da_decisao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Onde a turma decidiu</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Assembleia de 12/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-texto-muted text-xs">
                  Fica gravado no item e é a prova da cobrança. Só use quando a decisão obrigar a turma toda e
                  o termo de adesão previr cobranças extraordinárias.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <ErroDoFormulario />

        {/* O mesmo rodapé dos outros diálogos do app: incluir e editar são o mesmo formulário, no
            mesmo lugar, e só o verbo do botão muda. */}
        {editavel ? (
          <AcoesDoFormulario
            aoCancelar={aoConcluir}
            ocupado={salvando}
            rotulo={editando ? 'Salvar' : 'Incluir item'}
          />
        ) : null}
      </form>
    </Form>
  )
}

/**
 * O formulário do item novo, com o que ele faz à grade — o conteúdo do diálogo de inclusão.
 *
 * O resumo é a prévia que antes ficava ao lado do formulário na página: quem monta o plano quer
 * saber quanto o item acrescenta **antes** de incluí-lo, e num diálogo a grade da direita fica
 * escondida. Continua sendo o servidor que calcula (`useSimulacao`), sobre os itens que já estão no
 * plano mais o rascunho — nenhuma conta é refeita aqui.
 *
 * @param itensDoPlano Os itens ativos do plano, para a simulação sair completa.
 * @param aoConcluir Depois de salvar ou cancelar: fecha o diálogo.
 */
export function FormularioDeItemNovo({
  planoId,
  itensDoPlano,
  editavel,
  aoConcluir,
  jaAderiram,
}: {
  planoId: string
  itensDoPlano: DadosDoItem[]
  editavel: boolean
  aoConcluir: () => void
  jaAderiram?: number
}) {
  const { formulario, rascunho } = useFormularioDeItem()
  const previa = useSimulacao(planoId, rascunho ? [...itensDoPlano, rascunho] : undefined)

  return (
    <FormularioDeItem
      planoId={planoId}
      formulario={formulario}
      editavel={editavel}
      aoConcluir={aoConcluir}
      jaAderiram={jaAderiram}
      resumo={
        rascunho && previa.data ? (
          <p
            className="bg-muted text-muted-foreground rounded-xl px-4 py-3 text-sm"
            aria-busy={previa.isFetching}
          >
            Com este item, cada formando passa a dever{' '}
            <span className="text-foreground font-medium tabular-nums">
              {formatarCentavos(previa.data.total_por_formando)}
            </span>{' '}
            em {formatarNumero(previa.data.parcelas.length)} parcelas.
          </p>
        ) : null
      }
    />
  )
}

/**
 * O formulário de um item já gravado, com os valores dele — o conteúdo do diálogo de edição da
 * página. Componente à parte porque o `useForm` precisa nascer com os valores do item.
 *
 * @param item O item em edição.
 * @param aoConcluir Depois de salvar ou cancelar: fecha o diálogo.
 */
export function FormularioDeItemEmEdicao({
  planoId,
  item,
  editavel,
  aoConcluir,
}: {
  planoId: string
  item: ItemDeCobranca
  editavel: boolean
  aoConcluir: () => void
}) {
  const { formulario } = useFormularioDeItem(paraFormularioDeItem(item))

  return (
    <FormularioDeItem
      planoId={planoId}
      formulario={formulario}
      editando={item}
      editavel={editavel}
      aoConcluir={aoConcluir}
    />
  )
}
