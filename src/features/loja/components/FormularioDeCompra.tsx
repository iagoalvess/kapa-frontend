import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
  type Path,
  type UseFormSetError,
  useFieldArray,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form'
import { useNavigate } from 'react-router'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { ComoVoceQuerPagar } from '@/components/ComoVoceQuerPagar'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { rotaDaCompra } from '@/config/rotas'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { ehOpcao } from '@/lib/opcao'
import { ROTULOS_DE_DOCUMENTO } from '@/types/festa'
import { MEIOS_DE_PAGAMENTO, type MeioDePagamento } from '@/types/pagamento'
import { useComprar } from '../hooks/useLoja'
import {
  compraEmBranco,
  esquemaDaCompra,
  type FormularioDaCompra as Valores,
  paraDadosDaCompra,
  titularEmBranco,
} from '../schemas/compra.schema'
import type { ItemDaLoja } from '../types/loja.types'

/**
 * A compra sem conta, em duas etapas: primeiro convite, quantidade, nome, e-mail, CPF e o meio (P2, P7); depois quem
 * vai usar cada convite. A reserva só acontece no fim, já com os nomes. O meio só aparece para
 * escolher quando a loja aceita mais de um (`ComoVoceQuerPagar`).
 *
 * A chave de idempotência é sorteada ao montar e **não muda** nas novas tentativas (decisão 7): F5 no
 * meio, clique duplo ou a fila cheia repetindo sozinha devolvem a mesma compra, e não uma segunda
 * reserva. O botão trava depois do clique.
 *
 * @param formaturaId A turma da loja.
 * @param itens Os convites que se vendem agora.
 * @param meios Os meios que a loja aceita, na ordem da tela — o primeiro é o padrão.
 * @param aoEsgotar Chamado quando a API diz que acabou — a tela relê a vitrine.
 */
export function FormularioDeCompra({
  formaturaId,
  itens,
  meios,
  aoEsgotar,
}: {
  formaturaId: string
  itens: ItemDaLoja[]
  meios: MeioDePagamento[]
  aoEsgotar: () => void
}) {
  const navegar = useNavigate()
  const comprar = useComprar()
  const [chave] = useState(() => crypto.randomUUID())
  const [itemId, definirItemId] = useState(itens[0]?.id ?? '')
  const [etapa, definirEtapa] = useState<'comprador' | 'convidados'>('comprador')

  const formulario = useForm<Valores>({
    resolver: zodResolver(esquemaDaCompra),
    defaultValues: compraEmBranco(meios[0]),
  })
  const { isSubmitting } = useFormState({ control: formulario.control })
  const [meio, quantidade] = useWatch({ control: formulario.control, name: ['meio', 'quantidade'] })
  const titulares = useFieldArray({ control: formulario.control, name: 'convidados' })

  const item = itens.find((candidato) => candidato.id === itemId) ?? itens[0]
  if (!item) return null

  const unidades = Number(quantidade) > 0 ? Number(quantidade) : 0
  const maximo = Math.min(item.limite_por_pessoa ?? 10, item.disponivel ?? 10)
  const enviando = comprar.isPending || isSubmitting
  const total = formatarCentavos(item.preco_em_centavos * Math.max(unidades, 1))
  const convites = unidades > 1 ? `${formatarNumero(unidades)} convites` : 'convite'

  // A primeira etapa confere o que é do comprador; a segunda nasce com um titular por convite.
  const continuar = async () => {
    if (!(await formulario.trigger(['quantidade', 'nome', 'email', 'cpf', 'meio', 'ciente']))) return

    const atual = titulares.fields.length
    if (unidades > atual) titulares.append(Array.from({ length: unidades - atual }, titularEmBranco))
    else if (unidades < atual)
      titulares.remove(Array.from({ length: atual - unidades }, (_, i) => unidades + i))
    definirEtapa('convidados')
  }

  const enviar = formulario.handleSubmit((valores) =>
    comprar.mutate(
      { formaturaId, dados: paraDadosDaCompra(valores, item.id, chave) },
      {
        onSuccess: (criada) => void navegar(rotaDaCompra(criada.token)),
        onError: (erro) => {
          if (ehErroDaApi(erro) && erro.codigo === 'loja.esgotado') aoEsgotar()
          // Erro num campo do comprador (o CPF, por exemplo) volta para a etapa em que ele está.
          if (ehErroDaApi(erro) && Object.keys(erro.erros).some((campo) => !campo.startsWith('convidados')))
            definirEtapa('comprador')
          exibirErro(erro, formulario.setError)
        },
      },
    ),
  )

  if (etapa === 'convidados')
    return (
      <Form {...formulario}>
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <div className="grid gap-1">
            <p className="text-muted-foreground text-xs font-medium">Etapa 2 de 2</p>
            <h3
              ref={(titulo) => titulo?.focus()}
              tabIndex={-1}
              className="text-lg font-semibold outline-none"
            >
              {unidades > 1 ? 'Quem vai usar cada convite' : 'Quem vai usar o convite'}
            </h3>
            <p className="text-muted-foreground text-sm">
              O nome e o documento são conferidos na entrada. Se mudar de ideia, dá para trocar depois pelo
              link da compra, até a véspera da festa.
            </p>
          </div>

          {titulares.fields.map((campo, indice) => (
            <CamposDoTitular key={campo.id} indice={indice} numerado={titulares.fields.length > 1} />
          ))}

          <ErroDoFormulario />

          <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
            <Button type="button" variant="outline" size="lg" onClick={() => definirEtapa('comprador')}>
              Voltar
            </Button>
            <Button type="submit" size="lg" disabled={enviando}>
              {enviando ? 'Um instante…' : `Comprar ${convites} · ${total}`}
            </Button>
          </div>
        </form>
      </Form>
    )

  return (
    <Form {...formulario}>
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          void continuar()
        }}
        noValidate
        className="grid gap-4"
      >
        <p className="text-muted-foreground -mt-2 text-xs font-medium">Etapa 1 de 2</p>

        {itens.length > 1 ? (
          <div className="grid gap-2">
            <label htmlFor="convite-da-loja" className="text-sm font-medium">
              Convite
            </label>
            <Select
              id="convite-da-loja"
              value={item.id}
              onChange={(evento) => definirItemId(evento.target.value)}
            >
              {itens.map((candidato) => (
                <option key={candidato.id} value={candidato.id}>
                  {candidato.descricao} — {formatarCentavos(candidato.preco_em_centavos)}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <FormField
            control={formulario.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seu nome</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantos convites</FormLabel>
                <FormControl>
                  <Input {...field} type="number" inputMode="numeric" min={1} max={maximo} />
                </FormControl>
                {item.limite_por_pessoa ? (
                  <p className="text-texto-muted text-xs">Até {item.limite_por_pessoa} por pessoa (CPF).</p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ComoVoceQuerPagar
          opcoes={meios.map((opcao) => ({ chave: opcao, rotulo: MEIOS_DE_PAGAMENTO[opcao].rotulo }))}
          escolhida={meio}
          aoEscolher={(escolhido) => {
            if (ehOpcao(escolhido, MEIOS_DE_PAGAMENTO)) formulario.setValue('meio', escolhido)
          }}
        />

        <CampoDeMarcar
          control={formulario.control}
          name="ciente"
          rotulo="Li como meus dados são usados"
          dica="Seu nome, e-mail e CPF servem para enviar os convites; o nome e o documento de cada convidado, para conferir na entrada. Tudo fica com a turma — o Mercado Pago, que cuida do pagamento, só recebe os seus dados — e é apagado 30 dias depois da festa."
        />

        <ErroDoFormulario />

        <Button type="submit" size="lg">
          Continuar · {total}
        </Button>
      </form>
    </Form>
  )
}

/**
 * Nome e documento de quem vai usar um convite.
 *
 * @param indice A posição do convite na compra.
 * @param numerado Se mostra "Convite N" — só faz sentido com mais de um.
 */
function CamposDoTitular({ indice, numerado }: { indice: number; numerado: boolean }) {
  const { control } = useFormContext<Valores>()

  return (
    <fieldset className="grid gap-3 rounded-xl border p-4">
      {numerado ? (
        <legend className="text-muted-foreground px-1 text-xs font-medium">Convite {indice + 1}</legend>
      ) : null}

      <FormField
        control={control}
        name={`convidados.${indice}.nome`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome completo</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid items-start gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <FormField
          control={control}
          name={`convidados.${indice}.tipo_do_documento`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documento</FormLabel>
              <FormControl>
                <Select {...field}>
                  {Object.entries(ROTULOS_DE_DOCUMENTO).map(([valor, rotulo]) => (
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
          control={control}
          name={`convidados.${indice}.numero_do_documento`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" placeholder="Com ou sem pontuação" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </fieldset>
  )
}

/**
 * O erro da compra no formulário: o de um campo conhecido vai para o campo; o resto — esgotado, limite por
 * pessoa, fila cheia — vai para o formulário inteiro.
 */
function exibirErro(erro: unknown, setError: UseFormSetError<Valores>) {
  const campos = ehErroDaApi(erro) ? Object.entries(erro.erros) : []

  if (campos.length === 0) {
    setError('root', { message: mensagemDoErro(erro) })
    return
  }

  for (const [campo, mensagens] of campos) {
    // O do titular volta como `convidados[0].numero_do_documento`; o formulário o chama `convidados.0.numero_do_documento`.
    const caminho = campo.replace(/\[(\d+)\]/g, '.$1')
    const doFormulario = ehOpcao(caminho, compraEmBranco()) || /^convidados\.\d+\.\w+$/.test(caminho)

    setError(doFormulario ? (caminho as Path<Valores>) : 'root', {
      type: 'server',
      message: mensagens.join(' '),
    })
  }
}
