import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { type Control, type UseFormReturn, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { CamposDaGrade } from './CamposDaGrade'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { Chip } from '@/components/Chip'
import { useAlcanceDoPreco, useAlcanceDoRateio } from '../hooks/useAlcance'
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
  type ItemDeCobranca,
  rotuloDoItem,
  ROTULOS_DE_TIPO,
  TIPOS_DOS_PACOTES,
  TIPOS_DOS_RATEIOS,
  type TipoDeCobranca,
} from '../types/cobrancas.types'

/**
 * O formulário do item e o que ele vale agora — o rascunho que alimenta a prévia.
 *
 * Mora na página, e não dentro do formulário, porque a prévia fica ao lado: os dois leem os mesmos
 * valores. O rascunho só existe quando o formulário é válido; enquanto isso a prévia mostra o plano
 * gravado.
 *
 * @param inicial Os valores do item em edição (o diálogo); ausente, o item novo em branco.
 */
function useFormularioDeItem(inicial?: ValoresDoItem) {
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
  /** Os pacotes do catálogo — o alvo do rateio é escolhido entre eles (Sprint 48, D19). */
  pacotes?: ItemDeCobranca[]
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
  pacotes = [],
}: Props) {
  const adicionar = useAdicionarItem()
  const alterar = useAlterarItem()
  const salvando = adicionar.isPending || alterar.isPending
  const travaAGrade = !editavel || Boolean(editando?.em_uso)

  const [tipo, modoDoValor, rateio, valorDigitado, numeroDeParcelas] = useWatch({
    control: formulario.control,
    name: ['tipo', 'modoDoValor', 'aplicar_a_quem_ja_aderiu', 'valor_em_centavos', 'numero_de_parcelas'],
  })
  const total = modoDoValor === 'parcela' ? valorDigitado * (Number(numeroDeParcelas) || 0) : valorDigitado
  // A pergunta da D21 só existe quando o preço de um item já escolhido muda.
  const precoMudou = Boolean(editando?.em_uso) && total !== editando?.valor_em_centavos
  const alcanceDoPreco = useAlcanceDoPreco(planoId, editando?.id, total, precoMudou && editavel)

  const enviar = formulario.handleSubmit((valores) => {
    const dados = paraDadosDoItem(valores)
    const aoTerminar = {
      onSuccess: () => {
        toast.success(editando ? 'Cobrança salva.' : 'Cobrança criada.')
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
                    {(rateio || editando?.origem_da_decisao ? TIPOS_DOS_RATEIOS : TIPOS_DOS_PACOTES).map(
                      (valor) => (
                        <option key={valor} value={valor}>
                          {ROTULOS_DE_TIPO[valor]}
                        </option>
                      ),
                    )}
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

          <CamposDaGrade control={formulario.control} rotuloDasParcelas="Parcelas" travado={travaAGrade} />

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

        {rateio || editando?.origem_da_decisao ? null : (
          <CamposDoPacote control={formulario.control} editavel={editavel} travado={travaAGrade} />
        )}

        {precoMudou && editavel ? (
          <div className="border-border grid gap-2 rounded-xl border p-4">
            <CampoDeMarcar
              control={formulario.control}
              name="aplicar_aos_atuais"
              rotulo="Aplicar o preço novo também a quem já aderiu"
            />
            <p className="text-texto-muted text-xs" aria-busy={alcanceDoPreco.isFetching}>
              {alcanceDoPreco.data
                ? alcanceDoPreco.data.formandos === 0
                  ? 'Ninguém que já aderiu tem parcela a vencer deste pacote.'
                  : `Alcança ${formatarNumero(alcanceDoPreco.data.formandos)} ${alcanceDoPreco.data.formandos === 1 ? 'formando' : 'formandos'}, ${formatarNumero(alcanceDoPreco.data.parcelas)} ${alcanceDoPreco.data.parcelas === 1 ? 'parcela' : 'parcelas'} a vencer — ${alcanceDoPreco.data.total_em_centavos >= 0 ? '+' : '−'}${formatarCentavos(Math.abs(alcanceDoPreco.data.total_em_centavos))} no total.`
                : 'Calculando quem o preço novo alcança…'}{' '}
              Sem marcar, o preço novo vale só para quem aderir daqui em diante — quem já aderiu fica com o
              contrato.
            </p>
          </div>
        ) : null}

        <p className="text-texto-muted text-xs">
          {editando?.em_uso
            ? 'Este pacote já foi escolhido: só o valor e a descrição mudam.'
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
                ? ' e serão cobrados por esta cobrança, mesmo sem tê-la aceitado no termo.'
                : ' e não mudam de cesta: o pacote novo entra no catálogo de quem aderir daqui em diante.'}
            </p>

            <CampoDeMarcar
              control={formulario.control}
              name="aplicar_a_quem_ja_aderiu"
              rotulo="Não é pacote: é um rateio da assembleia, cobrado de todos que já aderiram"
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
                  Fica gravado na cobrança e é a prova da decisão. Só use quando a decisão obrigar a turma
                  toda e o termo de adesão previr cobranças extraordinárias.
                </p>

                <AlvoDoRateio
                  control={formulario.control}
                  planoId={planoId}
                  pacotes={pacotes}
                  valorPorFormando={total}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <ErroDoFormulario />

        {/* O mesmo rodapé dos outros diálogos do app: criar e editar são o mesmo formulário, no
            mesmo lugar, com o mesmo "Salvar". */}
        {editavel ? <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} /> : null}
      </form>
    </Form>
  )
}

/**
 * O que só o pacote tem (Sprint 47): o grupo de faixas, os convites que ele concede e o último vencimento.
 *
 * O grupo é o que transforma pacotes em faixas — "Festa" com "10 pessoas", "15 pessoas", "20 pessoas" —, e a
 * cesta aceita uma faixa por grupo. Os convites são o benefício: a faixa de 15 pessoas emite 15 convites da festa.
 * Com o pacote já escolhido por alguém, só o preço muda: os convites foram emitidos por estes números.
 */
function CamposDoPacote({
  control,
  editavel,
  travado,
}: {
  control: Control<ValoresDoItem>
  editavel: boolean
  travado: boolean
}) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="grupo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Escolha única entre</FormLabel>
            <FormControl>
              <Input {...field} disabled={travado} placeholder="Ex.: Álbum" />
            </FormControl>
            <FormDescription>
              Opcional. Pacotes com o mesmo nome aqui são versões uma da outra e o formando fica com uma só —
              "Álbum 20 páginas" e "Álbum 40 páginas", os dois com "Álbum". Em branco, o pacote se soma aos
              outros.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="ultimo_vencimento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Último vencimento</FormLabel>
            <FormControl>
              <Input {...field} type="date" disabled={!editavel} />
            </FormControl>
            <FormDescription>Opcional. A última parcela não pode vencer depois desta data.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="cancelavel_ate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cancelável até</FormLabel>
            <FormControl>
              <Input {...field} type="date" disabled={!editavel} />
            </FormControl>
            <FormDescription>
              Opcional. Depois desta data o formando não pede mais o cancelamento — antes, a comissão decide.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="convites_da_festa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Convites da festa</FormLabel>
            <FormControl>
              <Input {...field} inputMode="numeric" disabled={travado} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="convites_da_colacao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Convites da colação</FormLabel>
            <FormControl>
              <Input {...field} inputMode="numeric" disabled={travado} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

/**
 * De quem o rateio cobra (Sprint 48, D19): um grupo de faixas inteiro ("Festa"), um pacote avulso ("Fotos") ou todos
 * os que já aderiram — e quantos isso alcança hoje, antes de confirmar.
 *
 * O grupo vira os ids de todas as faixas dele: quem tem qualquer faixa da festa vai à festa.
 */
function AlvoDoRateio({
  control,
  planoId,
  pacotes,
  valorPorFormando,
}: {
  control: Control<ValoresDoItem>
  planoId: string
  pacotes: ItemDeCobranca[]
  valorPorFormando: number
}) {
  const alvo = useWatch({ control, name: 'alvo' })
  const alcance = useAlcanceDoRateio(planoId, alvo, valorPorFormando, true)
  const grupos = [...new Set(pacotes.flatMap((pacote) => (pacote.grupo ? [pacote.grupo] : [])))]
  const opcoes = [
    ...grupos.map((grupo) => ({
      rotulo: grupo,
      ids: pacotes.filter((pacote) => pacote.grupo === grupo).map((pacote) => pacote.id),
    })),
    ...pacotes
      .filter((pacote) => !pacote.grupo)
      .map((pacote) => ({ rotulo: rotuloDoItem(pacote), ids: [pacote.id] })),
  ]

  return (
    <FormField
      control={control}
      name="alvo"
      render={({ field }) => {
        const marcada = (ids: string[]) => ids.every((id) => field.value.includes(id))
        const alternar = (ids: string[]) =>
          field.onChange(
            marcada(ids)
              ? field.value.filter((id) => !ids.includes(id))
              : [...new Set([...field.value, ...ids])],
          )

        return (
          <FormItem>
            <FormLabel>Quem paga</FormLabel>
            <fieldset aria-label="Quem paga" className="flex flex-wrap gap-2">
              <Chip ativo={field.value.length === 0} onClick={() => field.onChange([])}>
                Todos que já aderiram
              </Chip>
              {opcoes.map((opcao) => (
                <Chip key={opcao.rotulo} ativo={marcada(opcao.ids)} onClick={() => alternar(opcao.ids)}>
                  {opcao.rotulo}
                </Chip>
              ))}
            </fieldset>
            <FormDescription aria-busy={alcance.isFetching}>
              {alcance.data
                ? `Alcança ${formatarNumero(alcance.data.formandos)} ${alcance.data.formandos === 1 ? 'formando' : 'formandos'} hoje — ${formatarCentavos(alcance.data.total_em_centavos)} no total. Quem aderir depois não deve o rateio.`
                : 'Só quem tem um dos pacotes marcados paga.'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

/**
 * O formulário do item novo, com o que ele faz à grade — o conteúdo do diálogo de inclusão.
 *
 * O resumo é a prévia que antes ficava ao lado do formulário na página: quem monta o plano quer
 * saber quanto o item acrescenta **antes** de incluí-lo, e num diálogo a grade da direita fica
 * escondida. Continua sendo o servidor que calcula (`useSimulacao`), só sobre o rascunho: desde a Sprint 47 o
 * plano é um catálogo, e cada formando deve a própria cesta — somar os pacotes não diria nada a ninguém.
 *
 * @param aoConcluir Depois de salvar ou cancelar: fecha o diálogo.
 */
export function FormularioDeItemNovo({
  planoId,
  editavel,
  aoConcluir,
  jaAderiram,
  pacotes,
}: {
  planoId: string
  editavel: boolean
  aoConcluir: () => void
  jaAderiram?: number
  /** Os pacotes do catálogo, para o alvo do rateio. */
  pacotes?: ItemDeCobranca[]
}) {
  const { formulario, rascunho } = useFormularioDeItem()
  // Só o rascunho: o catálogo não se soma — cada formando escolhe o dele (Sprint 47).
  const previa = useSimulacao(planoId, rascunho ? [rascunho] : undefined)

  return (
    <FormularioDeItem
      planoId={planoId}
      formulario={formulario}
      editavel={editavel}
      aoConcluir={aoConcluir}
      jaAderiram={jaAderiram}
      pacotes={pacotes}
      resumo={
        rascunho && previa.data ? (
          <p
            className="bg-muted text-muted-foreground rounded-xl px-4 py-3 text-sm"
            aria-busy={previa.isFetching}
          >
            Quem escolher este pacote paga{' '}
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
