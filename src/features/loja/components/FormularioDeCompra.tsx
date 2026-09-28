import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { type UseFormSetError, useForm, useFormState, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { ComoVoceQuerPagar } from '@/components/ComoVoceQuerPagar'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { rotaDaCompra } from '@/config/rotas'
import { formatarCentavos } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { ehOpcao } from '@/lib/opcao'
import { MEIOS_DE_PAGAMENTO, type MeioDePagamento } from '@/types/pagamento'
import { useComprar } from '../hooks/useLoja'
import {
  compraEmBranco,
  esquemaDaCompra,
  type FormularioDaCompra as Valores,
  paraDadosDaCompra,
} from '../schemas/compra.schema'
import type { ItemDaLoja } from '../types/loja.types'

/**
 * A compra sem conta: convite, quantidade, nome, e-mail, CPF e o meio (P2, P7). O meio só aparece para
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

  const formulario = useForm<Valores>({
    resolver: zodResolver(esquemaDaCompra),
    defaultValues: compraEmBranco(meios[0]),
  })
  const { isSubmitting } = useFormState({ control: formulario.control })
  const [meio, quantidade] = useWatch({ control: formulario.control, name: ['meio', 'quantidade'] })

  const item = itens.find((candidato) => candidato.id === itemId) ?? itens[0]
  if (!item) return null

  const unidades = Number(quantidade) > 0 ? Number(quantidade) : 0
  const maximo = Math.min(item.limite_por_pessoa ?? 10, item.disponivel ?? 10)
  const enviando = comprar.isPending || isSubmitting

  const enviar = formulario.handleSubmit((valores) =>
    comprar.mutate(
      { formaturaId, dados: paraDadosDaCompra(valores, item.id, chave) },
      {
        onSuccess: (criada) => void navegar(rotaDaCompra(criada.token)),
        onError: (erro) => {
          if (ehErroDaApi(erro) && erro.codigo === 'loja.esgotado') aoEsgotar()
          exibirErro(erro, formulario.setError)
        },
      },
    ),
  )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
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
          dica="Nome, e-mail e CPF servem para emitir e entregar o convite e para o limite por pessoa. A turma e o Mercado Pago, que processa o pagamento, os recebem; eles são apagados 30 dias depois da festa."
        />

        <ErroDoFormulario />

        <Button type="submit" size="lg" disabled={enviando}>
          {enviando
            ? 'Reservando…'
            : `Reservar e pagar ${formatarCentavos(item.preco_em_centavos * Math.max(unidades, 1))}`}
        </Button>
      </form>
    </Form>
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

  for (const [campo, mensagens] of campos)
    setError(ehOpcao(campo, compraEmBranco()) ? campo : 'root', {
      type: 'server',
      message: mensagens.join(' '),
    })
}
