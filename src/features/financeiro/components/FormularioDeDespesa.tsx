import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeComprovante } from '@/components/CampoDeComprovante'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { diaDeHoje, formatarCentavos } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAtualizarDespesa, useLancarDespesa } from '../hooks/useDespesas'
import {
  despesaEmBranco,
  despesaParaContratar,
  esquemaDeDespesa,
  type FormularioDeDespesa as ValoresDaDespesa,
  paraDadosDaDespesa,
  paraFormularioDeDespesa,
  paraNovaDespesa,
} from '../schemas/financeiro.schema'
import type { ItemDaFesta } from '@/types/festa'
import {
  type CategoriaDeDespesa,
  type Despesa,
  type Fornecedor,
  ROTULOS_DE_CATEGORIA,
} from '../types/financeiro.types'

interface Props {
  /** Fornecedores ativos, para o seletor. A categoria de cada um vira o padrão do formulário. */
  fornecedores: Fornecedor[]
  /** Itens da festa de pé, para o seletor do vínculo. */
  itensDaFesta: ItemDaFesta[]
  /** Item já escolhido: o botão "Contratar" do cartão da festa abre o formulário preenchido por ele. */
  contratando?: ItemDaFesta
  /** Despesa em edição; ausente, o formulário lança uma nova. */
  editando?: Despesa
  /** Falso trava os campos — formatura fora de `Ativa`. */
  editavel: boolean
  /** Depois de salvar ou cancelar. */
  aoConcluir: () => void
}

/**
 * Lança ou corrige uma despesa, nos campos e na ordem em que o tesoureiro pensa: o que foi, quanto,
 * de quem, quando vence, em quantas vezes — e, por último, se já foi paga.
 *
 * Escolher o fornecedor preenche a categoria com a dele: quem lança oitenta despesas de buffet não
 * escolhe "Buffet" oitenta vezes. Trocar o fornecedor depois de mexer na categoria não desfaz a
 * escolha de quem digitou.
 *
 * Na correção, a linha é uma só: parcelas e "já paga" somem — quem paga é o diálogo de pagamento,
 * que exige o comprovante.
 */
export function FormularioDeDespesa({
  fornecedores,
  itensDaFesta,
  contratando,
  editando,
  editavel,
  aoConcluir,
}: Props) {
  const [comprovante, definirComprovante] = useState<File | undefined>(undefined)
  const [categoriaTocada, definirCategoriaTocada] = useState(false)
  const lancar = useLancarDespesa()
  const atualizar = useAtualizarDespesa()
  const salvando = lancar.isPending || atualizar.isPending

  const formulario = useForm<ValoresDaDespesa>({
    resolver: zodResolver(esquemaDeDespesa),
    defaultValues: editando
      ? paraFormularioDeDespesa(editando)
      : contratando
        ? despesaParaContratar(contratando)
        : despesaEmBranco(),
  })

  const [parcelas, modoDoValor, valor, jaPaga] = useWatch({
    control: formulario.control,
    name: ['numero_de_parcelas', 'modoDoValor', 'valor_em_centavos', 'jaPaga'],
  })

  const quantidade = Number(parcelas) || 1
  const total = modoDoValor === 'parcela' ? valor * quantidade : valor

  const enviar = formulario.handleSubmit((valores) => {
    const aoTerminar = {
      onSuccess: () => {
        toast.success(editando ? 'Despesa salva.' : 'Despesa lançada.')
        formulario.reset(despesaEmBranco())
        definirComprovante(undefined)
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (editando) atualizar.mutate({ id: editando.id, dados: paraDadosDaDespesa(valores) }, aoTerminar)
    else lancar.mutate({ dados: paraNovaDespesa(valores), comprovante }, aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <FormField
          control={formulario.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que foi</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Entrada do buffet" disabled={!editavel} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="valor_em_centavos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{editando || modoDoValor === 'total' ? 'Valor' : 'Valor por parcela'}</FormLabel>
                <FormControl>
                  <CampoDeMoeda {...field} disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="fornecedor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>De quem</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    disabled={!editavel}
                    onChange={(evento) => {
                      field.onChange(evento)
                      const fornecedor = fornecedores.find((item) => item.id === evento.target.value)
                      if (fornecedor && !categoriaTocada)
                        formulario.setValue('categoria', fornecedor.categoria)
                    }}
                  >
                    <option value="">Sem fornecedor cadastrado</option>
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
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
            name="item_da_festa_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item da festa</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    disabled={!editavel}
                    onChange={(evento) => {
                      field.onChange(evento)
                      const item = itensDaFesta.find((opcao) => opcao.id === evento.target.value)
                      if (item && !categoriaTocada) formulario.setValue('categoria', item.categoria)
                    }}
                  >
                    <option value="">Nenhum — não é da festa</option>
                    {itensDaFesta.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.titulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">
                  Vinculada a um item, esta despesa passa a contar no cartão dele em "A festa".
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    disabled={!editavel}
                    onChange={(evento) => {
                      definirCategoriaTocada(true)
                      field.onChange(evento.target.value as CategoriaDeDespesa)
                    }}
                  >
                    {Object.entries(ROTULOS_DE_CATEGORIA).map(([valorDaOpcao, rotulo]) => (
                      <option key={valorDaOpcao} value={valorDaOpcao}>
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
            name="vencimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{quantidade > 1 ? 'Primeiro vencimento' : 'Vencimento'}</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="competencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês de competência</FormLabel>
                <FormControl>
                  <Input {...field} type="month" disabled={!editavel} />
                </FormControl>
                <p className="text-texto-muted text-xs">Quando o gasto aconteceu, não quando é pago.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          {editando ? null : (
            <FormField
              control={formulario.control}
              name="numero_de_parcelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcelas</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="numeric" disabled={!editavel} />
                  </FormControl>
                  <p className="text-texto-muted text-xs">
                    {quantidade > 1
                      ? `${quantidade}× mensais, uma linha por vencimento.`
                      : 'À vista: uma linha só.'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {editando || quantidade === 1 ? null : (
          <FormField
            control={formulario.control}
            name="modoDoValor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>O valor digitado é</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel}>
                    <option value="parcela">de cada parcela</option>
                    <option value="total">o total do compromisso</option>
                  </Select>
                </FormControl>
                <output className="text-muted-foreground text-sm">
                  Total do compromisso: <strong className="text-foreground">{formatarCentavos(total)}</strong>
                </output>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {editando ? null : (
          <div className="border-border grid gap-3 rounded-xl border p-4">
            <FormField
              control={formulario.control}
              name="jaPaga"
              render={({ field }) => (
                <FormItem>
                  <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value}
                      disabled={!editavel}
                      onChange={(evento) => field.onChange(evento.target.checked)}
                      className="accent-primary size-4"
                    />
                    Esta despesa já foi paga
                    {quantidade > 1 ? <span className="text-muted-foreground">(a 1ª parcela)</span> : null}
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            {jaPaga ? (
              <div className="motion-safe:animate-entrar grid items-start gap-4 sm:grid-cols-2">
                <FormField
                  control={formulario.control}
                  name="paga_em"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia do pagamento</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" max={diaDeHoje()} disabled={!editavel} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem className="self-end">
                  <CampoDeComprovante
                    valor={comprovante}
                    aoEscolher={definirComprovante}
                    desabilitado={!editavel || salvando}
                    obrigatorio
                  />
                </FormItem>
              </div>
            ) : null}
          </div>
        )}

        <ErroDoFormulario />

        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} desabilitado={!editavel} />
      </form>
    </Form>
  )
}
