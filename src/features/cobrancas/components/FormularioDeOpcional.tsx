import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useItensDaFesta } from '@/hooks/useItensDaFesta'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { CamposDaGrade } from './CamposDaGrade'
import { useAlterarOpcional, useCriarOpcional } from '../hooks/useOpcionais'
import {
  esquemaDeOpcional,
  type FormularioDeOpcional as Valores,
  opcionalEmBranco,
  mesDeHoje,
  paraDadosDoOpcional,
  paraFormularioDoOpcional,
} from '../schemas/opcionais.schema'
import { type ItemDeCobranca, ROTULOS_DE_TIPO, TIPOS_DOS_OPCIONAIS } from '../types/cobrancas.types'

/**
 * O cadastro de um item opcional: preço unitário, parcelas, cota, prazo, estoque e abertura.
 *
 * Diferente do item do plano em duas coisas que a tela precisa dizer: o preço é de **uma unidade**
 * (decisão 2), e o campo "Item da festa" liga este item ao cartão de lá, trocando a estimativa pelo
 * que a turma de fato vendeu (decisão 11).
 *
 * O seletor da festa lista só os itens `PorFormando` de pé e ainda sem opcionais — a API recusaria os
 * demais com `cobranca.item_da_festa_invalido`, e oferecer o que ela recusa é pior que não oferecer.
 *
 * @param item Item em edição; ausente, cadastra um novo.
 * @param editavel Falso trava os campos — formatura fora de `Ativa`.
 * @param aoConcluir Depois de salvar ou cancelar: fecha o diálogo.
 */
export function FormularioDeOpcional({
  item,
  editavel,
  aoConcluir,
}: {
  item?: ItemDeCobranca
  editavel: boolean
  aoConcluir: () => void
}) {
  const criar = useCriarOpcional()
  const alterar = useAlterarOpcional()
  const itensDaFesta = useItensDaFesta()
  const salvando = criar.isPending || alterar.isPending
  const travaAGrade = !editavel || Boolean(item?.em_uso)

  const formulario = useForm<Valores>({
    resolver: zodResolver(esquemaDeOpcional),
    defaultValues: item ? paraFormularioDoOpcional(item) : opcionalEmBranco(),
  })

  // Só o que a decisão 11 aceita, mais o que este item já aponta — senão editar um item ligado
  // perderia o vínculo por o seletor não ter a opção dele.
  const daFesta = (itensDaFesta.data ?? []).filter(
    (candidato) =>
      candidato.rateio === 'PorFormando' &&
      !candidato.cancelado &&
      (candidato.item_de_cobranca_id === null || candidato.item_de_cobranca_id === item?.id),
  )

  // A loja muda o sentido de dois campos: a cota passa a ser por CPF, e o preço pode ser outro (P3, P4).
  const naLoja = useWatch({ control: formulario.control, name: 'modo_de_venda' }) === 'Publica'

  const enviar = formulario.handleSubmit((valores) => {
    const dados = paraDadosDoOpcional(valores, item?.primeiro_mes ?? mesDeHoje())
    const aoTerminar = {
      onSuccess: () => {
        toast.success(item ? 'Opcional salvo.' : 'Opcional criado.')
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (item) alterar.mutate({ itemId: item.id, dados }, aoTerminar)
    else criar.mutate(dados, aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome na vitrine</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!editavel} placeholder="Convite extra" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <Select {...field} disabled={travaAGrade}>
                    {TIPOS_DOS_OPCIONAIS.map((valor) => (
                      <option key={valor} value={valor}>
                        {ROTULOS_DE_TIPO[valor]}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                {/* O tipo não é rótulo: é ele que decide se o pagamento vira convite da festa. */}
                <p className="text-texto-muted text-xs">
                  “Convite extra” é o que emite convite da festa quando o pedido é quitado.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="modo_de_venda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Onde se vende</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel}>
                    <option value="AoFormando">Aos formandos, no app</option>
                    <option value="Publica">Na loja pública, por link</option>
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">
                  Na loja, qualquer pessoa com o link compra sem conta e paga na hora pelo Mercado Pago da
                  turma. O item sai da vitrine dos formandos.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {naLoja ? (
            <FormField
              control={formulario.control}
              name="preco_publico_em_centavos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço na loja</FormLabel>
                  <FormControl>
                    <CampoDeMoeda {...field} disabled={!editavel} />
                  </FormControl>
                  <p className="text-texto-muted text-xs">Zero, vale o mesmo preço dos formandos.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={formulario.control}
            name="valor_em_centavos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de cada unidade</FormLabel>
                <FormControl>
                  <CampoDeMoeda {...field} disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <CamposDaGrade
            control={formulario.control}
            rotuloDasParcelas="Parcelas até"
            travado={travaAGrade}
          />

          <FormField
            control={formulario.control}
            name="limite_por_formando"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{naLoja ? 'Limite por pessoa (CPF)' : 'Cota por formando'}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    disabled={!editavel}
                    placeholder="Sem cota"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="estoque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidades disponíveis</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    disabled={!editavel}
                    placeholder="Sem teto"
                  />
                </FormControl>
                <p className="text-texto-muted text-xs">
                  É o que cabe no salão. Vazio, a venda não tem teto.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="abertura_de_vendas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendas abrem em</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" disabled={!editavel} />
                </FormControl>
                <p className="text-texto-muted text-xs">Horário de Brasília.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="pedidos_ate_dia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pedidos até</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="ultimo_vencimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Último vencimento</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="cancelavel_ate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cancelável até</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={!editavel} />
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
                  <Select {...field} disabled={!editavel}>
                    <option value="">Nenhum</option>
                    {daFesta.map((candidato) => (
                      <option key={candidato.id} value={candidato.id}>
                        {candidato.titulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">
                  Ligado, o cartão da festa passa a mostrar o preço daqui vezes os pedidos confirmados.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {item?.em_uso ? (
          <p className="text-texto-muted text-xs">
            Este item já gerou parcelas: só o preço, o nome, a cota, o estoque e as datas mudam.
          </p>
        ) : null}

        <ErroDoFormulario />

        {editavel ? <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} /> : null}
      </form>
    </Form>
  )
}
