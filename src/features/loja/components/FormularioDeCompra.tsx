import { zodResolver } from '@hookform/resolvers/zod'
import { Minus, Plus } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import {
  type Path,
  type UseFormSetError,
  useFieldArray,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { ComoVoceQuerPagar } from '@/components/ComoVoceQuerPagar'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DOCUMENTOS } from '@/config/legal'
import { rotaDaCompra } from '@/config/rotas'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { ehOpcao } from '@/lib/opcao'
import { cn } from '@/lib/utils'
import { ROTULOS_DE_DOCUMENTO } from '@/types/festa'
import { MEIOS_DE_PAGAMENTO, type MeioDePagamento } from '@/types/pagamento'
import { useComprar } from '../hooks/useLoja'
import { aVenda } from '../lib/disponibilidade'
import {
  compraEmBranco,
  esquemaDaCompra,
  type FormularioDaCompra as Valores,
  paraDadosDaCompra,
  titularEmBranco,
} from '../schemas/compra.schema'
import type { ItemDaLoja } from '../types/loja.types'
import { CartoesDeConvite } from './CartoesDeConvite'

/** As etapas da compra: com mais de um convite, começa pela escolha; com um só, pelos dados de quem compra. */
type Etapa = 'convite' | 'comprador' | 'convidados'

const COM_ESCOLHA: Etapa[] = ['convite', 'comprador', 'convidados']
const SEM_ESCOLHA: Etapa[] = ['comprador', 'convidados']

/** A Política vigente, no site — o mesmo link do cadastro. A compra grava a versão vigente como lida. */
const politica = DOCUMENTOS.PoliticaDePrivacidade

/**
 * A compra sem conta, em etapas: com mais de um convite, primeiro a **escolha** (o cartão do convite e a
 * quantidade); depois quem compra, e-mail, CPF e o meio (P2, P7); e por fim quem vai usar cada convite. Com
 * um convite só, a escolha some — ele é o título da loja — e restam duas etapas. A reserva só acontece no
 * fim, já com os nomes. O meio só aparece para escolher quando a loja aceita mais de um (`ComoVoceQuerPagar`).
 *
 * A chave de idempotência é sorteada ao montar e **não muda** nas novas tentativas (decisão 7): F5 no
 * meio, clique duplo ou a fila cheia repetindo sozinha devolvem a mesma compra, e não uma segunda
 * reserva. O botão trava depois do clique.
 *
 * @param formaturaId A turma da loja.
 * @param itens Os convites da loja — os que estão à venda e os que não, para o cartão dizer por quê.
 * @param meios Os meios que a loja aceita, na ordem da tela — o primeiro é o padrão.
 * @param agora O agora do servidor, em milissegundos — quem decide se o cartão está à venda.
 * @param aoEsgotar Chamado quando a API diz que acabou — a tela relê a vitrine.
 */
export function FormularioDeCompra({
  formaturaId,
  itens,
  meios,
  agora,
  aoEsgotar,
}: {
  formaturaId: string
  itens: ItemDaLoja[]
  meios: MeioDePagamento[]
  agora: number
  aoEsgotar: () => void
}) {
  const navegar = useNavigate()
  const comprar = useComprar()
  const [chave] = useState(() => crypto.randomUUID())
  const escolha = itens.length > 1
  const etapas = escolha ? COM_ESCOLHA : SEM_ESCOLHA
  const [itemId, definirItemId] = useState(
    () => itens.find((item) => aVenda(item, agora))?.id ?? itens[0]?.id ?? '',
  )
  const [etapa, definirEtapa] = useState<Etapa>(escolha ? 'convite' : 'comprador')

  const formulario = useForm<Valores>({
    resolver: zodResolver(esquemaDaCompra),
    defaultValues: compraEmBranco(meios[0]),
  })
  const { isSubmitting } = useFormState({ control: formulario.control })
  const [meio, quantidade] = useWatch({ control: formulario.control, name: ['meio', 'quantidade'] })
  const titulares = useFieldArray({ control: formulario.control, name: 'convidados' })

  const item =
    itens.find((candidato) => candidato.id === itemId) ??
    itens.find((candidato) => aVenda(candidato, agora)) ??
    itens[0]
  if (!item) return null

  const unidades = Number(quantidade) > 0 ? Number(quantidade) : 0
  const maximo = Math.min(item.limite_por_pessoa ?? 10, item.disponivel ?? 10)
  const enviando = comprar.isPending || isSubmitting
  const total = formatarCentavos(item.preco_em_centavos * Math.max(unidades, 1))
  const convites = unidades > 1 ? `${formatarNumero(unidades)} convites` : 'convite'
  const numeroDaEtapa = etapas.indexOf(etapa) + 1

  // A escolha confere a quantidade; o comprador, os dados dele; os convidados nascem com um titular por convite.
  const continuarDaEscolha = async () => {
    if (!(await formulario.trigger(['quantidade']))) return
    definirEtapa('comprador')
  }

  const continuarDoComprador = async () => {
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
          // Erro num campo conhecido volta para a etapa em que ele está; o do convidado fica onde está.
          if (ehErroDaApi(erro)) {
            const campos = Object.keys(erro.erros)
            if (escolha && campos.includes('quantidade')) definirEtapa('convite')
            else if (campos.some((campo) => !campo.startsWith('convidados'))) definirEtapa('comprador')
          }
          exibirErro(erro, formulario.setError)
        },
      },
    ),
  )

  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (etapa === 'convidados') void enviar(evento)
    else if (etapa === 'convite') void continuarDaEscolha()
    else void continuarDoComprador()
  }

  return (
    <Form {...formulario}>
      <form onSubmit={aoEnviar} noValidate className="grid gap-4">
        {etapa === 'convite' ? (
          <>
            <div className="grid gap-1">
              <p className="text-muted-foreground text-xs font-medium">
                Etapa {numeroDaEtapa} de {etapas.length}
              </p>
              <h3 className="text-lg font-semibold">Escolha o convite</h3>
              <p className="text-muted-foreground text-sm">
                Você pode escolher quantos convites quiser deste tipo.
              </p>
            </div>

            <CartoesDeConvite itens={itens} agora={agora} escolhidoId={item.id} aoEscolher={definirItemId}>
              <CampoDaQuantidade item={item} />
            </CartoesDeConvite>

            <p className="flex items-baseline justify-between gap-3 border-t pt-4">
              <span className="text-muted-foreground text-sm">
                {formatarNumero(unidades)} {unidades > 1 ? 'convites' : 'convite'} · {item.descricao}
              </span>
              <span className="font-semibold tabular-nums">{total}</span>
            </p>

            <ErroDoFormulario />

            <Button type="submit" size="lg">
              Continuar · {total}
            </Button>
          </>
        ) : null}

        {etapa === 'comprador' ? (
          <>
            <p className="text-muted-foreground -mt-2 text-xs font-medium">
              Etapa {numeroDaEtapa} de {etapas.length}
            </p>

            <div className={cn('grid items-start gap-4', !escolha && 'sm:grid-cols-[minmax(0,1fr)_10rem]')}>
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

              {/* Com a etapa da escolha, a quantidade já foi dita lá; aqui só quando não há escolha. */}
              {!escolha ? (
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
                        <p className="text-texto-muted text-xs">
                          Até {formatarNumero(item.limite_por_pessoa)} por pessoa (CPF).
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
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
              dica={
                <>
                  Seu nome, e-mail e CPF enviam os convites; o nome e o documento de cada convidado são
                  conferidos na entrada. Ficam com a turma e são apagados 30 dias depois da festa. Detalhes na{' '}
                  <Link
                    to={politica.rota}
                    target="_blank"
                    rel="noopener"
                    className="text-brand-hover hover:text-brand-border font-semibold underline underline-offset-2"
                  >
                    {politica.rotulo}
                  </Link>
                  .
                </>
              }
            />

            <ErroDoFormulario />

            {escolha ? (
              <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
                <Button type="button" variant="outline" size="lg" onClick={() => definirEtapa('convite')}>
                  Voltar
                </Button>
                <Button type="submit" size="lg">
                  Continuar · {total}
                </Button>
              </div>
            ) : (
              <Button type="submit" size="lg">
                Continuar · {total}
              </Button>
            )}
          </>
        ) : null}

        {etapa === 'convidados' ? (
          <>
            <div className="grid gap-1">
              <p className="text-muted-foreground text-xs font-medium">
                Etapa {numeroDaEtapa} de {etapas.length}
              </p>
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
          </>
        ) : null}
      </form>
    </Form>
  )
}

/**
 * A quantidade dentro do cartão escolhido: menos, o número, mais. O número é o mesmo campo do formulário,
 * então digitar e a validação continuam valendo.
 *
 * @param item O convite escolhido — o limite e o estoque dele é que mandam no teto.
 */
function CampoDaQuantidade({ item }: { item: ItemDaLoja }) {
  const { control } = useFormContext<Valores>()
  const maximo = Math.min(item.limite_por_pessoa ?? 10, item.disponivel ?? 10)

  return (
    <FormField
      control={control}
      name="quantidade"
      render={({ field }) => {
        const valor = Number(field.value) > 0 ? Number(field.value) : 1
        const limitar = (novo: number) => field.onChange(String(Math.min(Math.max(novo, 1), maximo)))

        return (
          <FormItem className="border-t pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-0.5">
                <FormLabel>Quantos convites</FormLabel>
                {item.limite_por_pessoa ? (
                  <p className="text-texto-muted text-xs">
                    Até {formatarNumero(item.limite_por_pessoa)} por pessoa (CPF).
                  </p>
                ) : null}
              </div>
              <div className="border-border bg-card flex items-center rounded-lg border shadow-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-r-none"
                  aria-label="Menos um convite"
                  disabled={valor <= 1}
                  onClick={() => limitar(valor - 1)}
                >
                  <Minus aria-hidden />
                </Button>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maximo}
                    className="h-9 w-14 rounded-none border-0 text-center shadow-none"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-l-none"
                  aria-label="Mais um convite"
                  disabled={valor >= maximo}
                  onClick={() => limitar(valor + 1)}
                >
                  <Plus aria-hidden />
                </Button>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
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
