import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck } from 'lucide-react'
import { type ComponentProps, useState } from 'react'
import { useForm, useFormState } from 'react-hook-form'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useInscreverNaListaDeEspera } from '../hooks/useInscreverNaListaDeEspera'
import {
  type FormularioDaInscricao,
  PAPEIS_NA_TURMA,
  TAMANHOS_DA_TURMA,
  esquemaDaInscricao,
  inscricaoEmBranco,
  semestresDeFormatura,
} from '../schemas/listaDeEspera.schema'
import { SecaoDaLanding } from './SecaoDaLanding'
import { Turnstile } from './Turnstile'

/** A âncora da seção: é para onde todo "Criar minha turma" da landing leva enquanto a lista está ligada. */
export const ANCORA_DA_LISTA_DE_ESPERA = 'lista-de-espera'

/** Os `utm_*` da URL, como vieram — a origem da inscrição. Nulo sem nenhum. */
function origemDaVisita() {
  const utm = [...new URLSearchParams(globalThis.location.search)].filter(([chave]) =>
    chave.startsWith('utm_'),
  )
  return utm.length > 0 ? new URLSearchParams(utm).toString() : null
}

/**
 * A lista de espera (Sprint 36): o formulário da P1 no lugar da tabela de preços, com o modo ligado.
 *
 * O convite é neutro (P2): não promete acesso antecipado nem piloto grátis — isso se combina na
 * conversa. A confirmação é a mesma para inscrição nova e repetida, e nenhum e-mail sai (P5 e P6).
 */
export function ListaDeEspera() {
  const [enviada, definirEnviada] = useState(false)

  return (
    <SecaoDaLanding
      id={ANCORA_DA_LISTA_DE_ESPERA}
      etiqueta="Lista de espera"
      titulo="Quer o Kapa na sua turma?"
      descricao="Deixe seu contato. A gente conversa com você sobre o Kapa e sobre o acesso da sua turma."
      className="gap-8"
    >
      {/* `px-3` no celular: o widget do Turnstile tem 300 px fixos, e com `p-5` ele empurrava o cartão para
          fora da tela em 360 px — sobrava margem à esquerda e quase nada à direita. */}
      <div className="bg-card shadow-painel mx-auto w-full max-w-2xl min-w-0 rounded-2xl border px-3 py-5 min-[400px]:px-5 sm:p-8">
        {enviada ? (
          <output className="grid justify-items-center gap-3 py-6 text-center">
            <CircleCheck className="text-brand-text size-10" aria-hidden />
            <span className="text-foreground text-lg font-semibold">Recebemos sua inscrição.</span>
            <span className="text-muted-foreground max-w-md text-sm text-pretty">
              Vamos falar com você pelo e-mail que você deixou. Para sair da lista, é só escrever para
              contato@kapaformaturas.com.br.
            </span>
          </output>
        ) : (
          <FormularioDaListaDeEspera aoEnviar={() => definirEnviada(true)} />
        )}
      </div>
    </SecaoDaLanding>
  )
}

function FormularioDaListaDeEspera({ aoEnviar }: { aoEnviar: () => void }) {
  const inscrever = useInscreverNaListaDeEspera()
  const [token, definirToken] = useState('')
  // O token do Turnstile vale uma vez: toda tentativa que volta com erro remonta o widget.
  const [tentativa, definirTentativa] = useState(0)

  const formulario = useForm<FormularioDaInscricao>({
    resolver: zodResolver(esquemaDaInscricao),
    defaultValues: inscricaoEmBranco,
  })
  const { isSubmitting } = useFormState({ control: formulario.control })
  const enviando = inscrever.isPending || isSubmitting

  const enviar = formulario.handleSubmit((valores) => {
    if (!token) {
      formulario.setError('root', { message: 'Aguarde a verificação de segurança terminar.' })
      return
    }
    inscrever.mutate(
      { ...valores, token_do_turnstile: token, origem: origemDaVisita() },
      {
        onSuccess: aoEnviar,
        onError: (erro) => {
          exibirErroNoFormulario(erro, formulario.setError)
          definirToken('')
          definirTentativa((anterior) => anterior + 1)
        },
      },
    )
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <CampoDeTexto nome="nome" rotulo="Seu nome" autoComplete="name" className="sm:col-span-2" />
        <CampoDeTexto nome="email" rotulo="E-mail" type="email" autoComplete="email" />
        <CampoDeTexto nome="instituicao" rotulo="Instituição" placeholder="UFPR" />
        <CampoDeTexto nome="curso" rotulo="Curso" placeholder="Odontologia" />

        <CampoDeEscolha
          nome="semestre_de_formatura"
          rotulo="A turma se forma em"
          opcoes={semestresDeFormatura().map((semestre) => [semestre.valor, semestre.rotulo])}
        />
        <CampoDeEscolha nome="papel" rotulo="Você é da turma como" opcoes={Object.entries(PAPEIS_NA_TURMA)} />
        <CampoDeEscolha
          nome="tamanho_da_turma"
          rotulo="Tamanho da turma"
          opcoes={Object.entries(TAMANHOS_DA_TURMA)}
        />

        <CampoDeMarcar
          control={formulario.control}
          name="aceite"
          className="sm:col-span-2"
          rotulo={
            <span>
              Li o{' '}
              <a
                href={ROTAS.avisoDaListaDeEspera}
                target="_blank"
                rel="noreferrer"
                className="text-brand-text underline underline-offset-2"
              >
                aviso de privacidade
              </a>{' '}
              da lista de espera
            </span>
          }
        />

        <div className="sm:col-span-2">
          <Turnstile key={tentativa} aoVerificar={definirToken} />
        </div>

        <ErroDoFormulario className="sm:col-span-2" />

        <Button type="submit" size="lg" disabled={enviando} className="sm:col-span-2">
          {enviando ? 'Enviando…' : 'Criar minha turma'}
        </Button>
      </form>
    </Form>
  )
}

type CampoTextual = Exclude<keyof FormularioDaInscricao, 'aceite'>

/** Um campo de texto do formulário: rótulo, entrada e a mensagem do erro. */
function CampoDeTexto({
  nome,
  rotulo,
  className,
  ...props
}: { nome: CampoTextual; rotulo: string } & Omit<ComponentProps<'input'>, 'name'>) {
  return (
    <FormField
      name={nome}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl>
            <Input {...props} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/** Uma escolha fechada, com a opção vazia pedindo para escolher. */
function CampoDeEscolha({
  nome,
  rotulo,
  opcoes,
}: {
  nome: CampoTextual
  rotulo: string
  opcoes: [valor: string, rotulo: string][]
}) {
  return (
    <FormField
      name={nome}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl>
            <Select {...field}>
              <option value="">Escolha…</option>
              {opcoes.map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
