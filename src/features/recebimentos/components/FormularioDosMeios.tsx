import { zodResolver } from '@hookform/resolvers/zod'
import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'
import { type Control, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useGravarConta } from '../hooks/useContaDeRecebimento'
import {
  esquemaDosMeios,
  type FormularioDosMeios as ValoresDosMeios,
  MEIOS,
  nenhumMeioMarcado,
  paraFormularioDosMeios,
  paraMeios,
  SEM_MEIO,
  TIPOS_DE_CHAVE,
} from '../schemas/meios.schema'
import type { ContaDeRecebimento, TipoDeChavePix } from '../types/recebimentos.types'

interface Props {
  /** A conta atual, na troca; ausente, o formulário cadastra os primeiros meios. */
  conta?: ContaDeRecebimento | null
  /** Depois de gravar ou de desistir. */
  aoConcluir?: () => void
}

/** Os interruptores — o campo que liga cada meio. */
type Interruptor = 'pix_ativo' | 'transferencia_ativo' | 'dinheiro_ativo'

/** Os campos de texto do formulário; os interruptores ficam de fora, que são caixas de marcar. */
type CampoDeTexto =
  | 'pix.chave'
  | 'pix.nome_do_titular'
  | 'pix.cidade'
  | 'transferencia.banco'
  | 'transferencia.agencia'
  | 'transferencia.conta'
  | 'transferencia.titular'
  | 'dinheiro.nome'
  | 'dinheiro.onde'

/**
 * Os três meios num formulário só: um interruptor por meio, e os campos dele aparecem ao ligá-lo.
 *
 * Mexer na chave PIX pede confirmação com os dados novos na frente — é o ponto de fraude, e a
 * confirmação diz o que acontece: a comissão inteira recebe e-mail e a chave volta a ficar a
 * conferir. Na primeira gravação não há o que confirmar; quem confere é o PIX de teste em seguida.
 *
 * Monte com `key` pela conta: os valores iniciais só são lidos na montagem.
 */
export function FormularioDosMeios({ conta, aoConcluir }: Props) {
  const gravar = useGravarConta()
  const formulario = useForm<ValoresDosMeios>({
    resolver: zodResolver(esquemaDosMeios),
    defaultValues: paraFormularioDosMeios(conta),
  })
  const controle = formulario.control
  const ligados = useWatch({
    control: controle,
    name: ['pix_ativo', 'transferencia_ativo', 'dinheiro_ativo'],
  })
  const [pixLigado, tedLigado, dinheiroLigado] = ligados
  const tipo = TIPOS_DE_CHAVE[useWatch({ control: controle, name: 'pix.tipo_de_chave' })]
  const [aConfirmar, definirAConfirmar] = useState<ValoresDosMeios>()

  const salvar = (novos: ValoresDosMeios) =>
    gravar.mutate(paraMeios(novos), {
      onSuccess: () => {
        toast.success(conta ? 'Meios atualizados. A comissão foi avisada por e-mail.' : 'Meios cadastrados.')
        aoConcluir?.()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    })

  const enviar = formulario.handleSubmit((novos) => {
    if (nenhumMeioMarcado(novos)) {
      formulario.setError('root', { message: SEM_MEIO })
      return
    }

    // Só quem já tem PIX confirma: é dele que sai a chave para onde o dinheiro da turma vai.
    if (conta?.meios.pix) definirAConfirmar(novos)
    else salvar(novos)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <Meio nome="pix_ativo" meio="Pix" ligado={pixLigado} controle={controle}>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <FormField
              control={controle}
              name="pix.tipo_de_chave"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de chave</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      onChange={(evento) => {
                        field.onChange(evento.target.value as TipoDeChavePix)
                        // A chave digitada para um tipo quase nunca serve para outro.
                        formulario.setValue('pix.chave', '')
                        formulario.clearErrors('pix.chave')
                      }}
                    >
                      {Object.entries(TIPOS_DE_CHAVE).map(([valor, { rotulo }]) => (
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

            <Campo
              controle={controle}
              nome="pix.chave"
              rotulo="Chave PIX"
              placeholder={tipo.exemplo}
              inputMode={tipo.teclado}
            />
            <Campo
              controle={controle}
              nome="pix.nome_do_titular"
              rotulo="Nome do titular"
              placeholder="Como o banco mostra"
            />
            <Campo
              controle={controle}
              nome="pix.cidade"
              rotulo="Cidade do titular"
              placeholder="Curitiba"
              autoComplete="address-level2"
            />
          </div>
        </Meio>

        <Meio nome="transferencia_ativo" meio="Transferencia" ligado={tedLigado} controle={controle}>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Campo
              controle={controle}
              nome="transferencia.banco"
              rotulo="Banco"
              placeholder="Banco do Brasil"
            />
            <FormField
              control={controle}
              name="transferencia.tipo_de_conta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de conta</FormLabel>
                  <FormControl>
                    <Select {...field}>
                      <option value="Corrente">Corrente</option>
                      <option value="Poupança">Poupança</option>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Campo controle={controle} nome="transferencia.agencia" rotulo="Agência" placeholder="1234-5" />
            <Campo controle={controle} nome="transferencia.conta" rotulo="Conta" placeholder="98765-4" />
            <Campo
              controle={controle}
              nome="transferencia.titular"
              rotulo="Titular da conta"
              placeholder="Como está no banco"
              className="sm:col-span-2"
            />
          </div>
          <p className="text-texto-muted text-xs">
            O Kapa só mostra estes dados ao formando — ele não transfere nada e não confere o dígito da conta.
            Confira antes de salvar.
          </p>
        </Meio>

        <Meio nome="dinheiro_ativo" meio="Dinheiro" ligado={dinheiroLigado} controle={controle}>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Campo
              controle={controle}
              nome="dinheiro.nome"
              rotulo="Quem recebe"
              placeholder="Ana Souza, tesoureira"
            />
            <Campo
              controle={controle}
              nome="dinheiro.onde"
              rotulo="Onde encontrar (opcional)"
              placeholder="Nas reuniões de quinta, sala 12"
            />
          </div>
          <p className="text-texto-muted text-xs">
            Dinheiro em mãos é o único meio sem comprovante do banco. O nome de quem recebe fica no aviso de
            pagamento, e é o que a tesouraria tem para conferir depois.
          </p>
        </Meio>

        <ErroDoFormulario />

        <div className="flex flex-wrap justify-end gap-2">
          {conta && aoConcluir ? (
            <Button type="button" variant="outline" onClick={aoConcluir}>
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={gravar.isPending}>
            {conta ? 'Salvar meios' : 'Cadastrar meios'}
          </Button>
        </div>
      </form>

      <DialogoDeConfirmacao
        aberto={aConfirmar !== undefined}
        aoFechar={() => definirAConfirmar(undefined)}
        titulo="Salvar os meios de recebimento?"
        descricao={<Resumo valores={aConfirmar} />}
        rotuloDeCancelar="Revisar"
        rotulo="Salvar"
        aoConfirmar={() => aConfirmar && salvar(aConfirmar)}
      />
    </Form>
  )
}

/** O que a confirmação mostra: para onde o PIX passa a ir, e o que isso desfaz. */
function Resumo({ valores }: { valores?: ValoresDosMeios }) {
  if (!valores?.pix_ativo)
    return (
      <>
        A turma deixa de aceitar PIX, e os formandos passam a ver só os meios que sobraram. Todos da comissão
        recebem um e-mail com o que mudou.
      </>
    )

  return (
    <>
      Os PIX passam a ir para a chave {TIPOS_DE_CHAVE[valores.pix.tipo_de_chave].rotulo}{' '}
      <strong className="text-foreground">{valores.pix.chave}</strong>, em nome de{' '}
      <strong className="text-foreground">{valores.pix.nome_do_titular}</strong>. Todos da comissão recebem um
      e-mail com o que mudou, e a chave volta a ficar a conferir se ela tiver mudado.
    </>
  )
}

/**
 * Um meio com o interruptor no cabeçalho e os campos escondidos enquanto ele está desligado.
 *
 * Desligado não é só invisível: o `paraMeios` manda `null` no lugar do grupo, e o backend lê isso
 * como "a turma não aceita" — é o que garante que o formando não veja a opção.
 */
function Meio({
  nome,
  meio,
  ligado,
  controle,
  children,
}: {
  nome: Interruptor
  meio: keyof typeof MEIOS
  ligado: boolean
  controle: Control<ValoresDosMeios>
  children: ReactNode
}) {
  return (
    <section className="border-border grid gap-4 rounded-2xl border p-4">
      <FormField
        control={controle}
        name={nome}
        render={({ field }) => (
          <FormItem>
            <label className="text-foreground flex w-fit cursor-pointer items-center gap-3 font-medium">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(evento) => field.onChange(evento.target.checked)}
                className="accent-primary size-4 shrink-0"
              />
              {MEIOS[meio].rotulo}
            </label>
            {/* Fora do rótulo: dentro dele, a frase inteira vira o nome da caixa para o leitor de tela. */}
            <p className="text-muted-foreground pl-7 text-sm">{MEIOS[meio].descricao}</p>
          </FormItem>
        )}
      />

      {ligado ? <div className="motion-safe:animate-entrar grid gap-3">{children}</div> : null}
    </section>
  )
}

/** Um campo de texto do formulário — o par rótulo/`Input` que se repete em todos os meios. */
function Campo({
  controle,
  nome,
  rotulo,
  className,
  ...resto
}: {
  controle: Control<ValoresDosMeios>
  nome: CampoDeTexto
  rotulo: string
  className?: string
} & Omit<ComponentProps<typeof Input>, 'name'>) {
  return (
    <FormField
      control={controle}
      name={nome}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl>
            <Input {...field} autoComplete="off" {...resto} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
