import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useRef } from 'react'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { cn } from '@/lib/utils'
import { useSalvarRegua, useTestarRegra } from '../hooks/useRegras'
import {
  esquemaDoDegrau,
  type FormularioDoDegrau,
  paraDadosDaRegua,
  paraFormularioDoDegrau,
} from '../schemas/notificacoes.schema'
import { CANAIS_DISPONIVEIS, type Regra, type Regua, ROTULOS_DE_CANAL } from '../types/notificacoes.types'
import { PreviaDaMensagem } from './PreviaDaMensagem'

/**
 * O editor de um degrau: assunto, mensagem, as variáveis clicáveis e a prévia ao lado.
 *
 * A gravação é da régua inteira — a API casa cada degrau pelo par gatilho + deslocamento —, então o
 * editor manda os irmãos como estão e troca só este. Variável escrita errada é recusada aqui e na
 * API, antes de virar oitenta e-mails com `{vencimeto}` no meio.
 *
 * @param regua A régua vigente, com as variáveis aceitas e os tetos de caracteres.
 * @param regra O degrau em edição.
 * @param aoFechar Fecha o editor, sem gravar.
 */
export function EditorDeTemplate({
  regua,
  regra,
  aoFechar,
}: {
  regua: Regua
  regra: Regra
  aoFechar: () => void
}) {
  const salvar = useSalvarRegua()
  const testar = useTestarRegra()
  const editavel = useEscritaLiberada()
  const corpo = useRef<HTMLTextAreaElement | null>(null)

  const formulario = useForm<FormularioDoDegrau>({
    resolver: zodResolver(esquemaDoDegrau(regua)),
    defaultValues: paraFormularioDoDegrau(regra),
  })

  // `formState` é proxy: lido solto no render, o Compiler pode não repetir a leitura e o botão
  // nasceria travado para sempre. `useFormState` assina a mudança de propósito.
  const { isDirty } = useFormState({ control: formulario.control })

  // `useWatch`, e não `formulario.watch`: o `watch` devolve uma função que o React Compiler não
  // consegue memoizar, e a prévia pararia de acompanhar o que está sendo digitado.
  const template = useWatch({ control: formulario.control, name: 'template' })
  const assunto = useWatch({ control: formulario.control, name: 'assunto' })

  const enviar = formulario.handleSubmit((valores) =>
    salvar.mutate(paraDadosDaRegua(regua, regra.id, valores), {
      onSuccess: () => {
        toast.success('Régua salva.')
        aoFechar()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  /** Põe a variável onde o cursor está — ou no fim, se o campo nunca foi focado. */
  const inserir = (variavel: string) => {
    const alvo = corpo.current
    const marcador = `{${variavel}}`

    if (!alvo) {
      formulario.setValue('template', template + marcador, { shouldDirty: true })
      return
    }

    const inicio = alvo.selectionStart
    const fim = alvo.selectionEnd
    formulario.setValue('template', template.slice(0, inicio) + marcador + template.slice(fim), {
      shouldDirty: true,
    })

    requestAnimationFrame(() => {
      alvo.focus()
      alvo.setSelectionRange(inicio + marcador.length, inicio + marcador.length)
    })
  }

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-5">
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="grid min-w-0 content-start gap-4">
            <FormField
              control={formulario.control}
              name="assunto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!editavel}
                      placeholder="Sua parcela de {formatura} vence hoje"
                    />
                  </FormControl>
                  <Contador texto={field.value} maximo={regua.tamanho_maximo_do_assunto} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="template"
              render={({ field: { ref, ...field } }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      ref={(no) => {
                        corpo.current = no
                        ref(no)
                      }}
                      disabled={!editavel}
                      spellCheck
                      placeholder="Oi, {nome}! Sua parcela de {valor} vence em {vencimento}."
                      className="border-input placeholder:text-texto-muted focus-visible:border-ring focus-visible:ring-ring/50 min-h-40 w-full resize-y rounded-xl border bg-transparent px-3 py-2 text-sm leading-relaxed shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <Contador texto={field.value} maximo={regua.tamanho_maximo} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Variáveis</legend>
              <p className="text-texto-muted text-xs">
                Clique para inserir na mensagem. Cada pessoa recebe o valor dela.
              </p>
              <div className="flex flex-wrap gap-2">
                {regua.variaveis.map((variavel) => (
                  <button
                    key={variavel}
                    type="button"
                    disabled={!editavel}
                    onClick={() => inserir(variavel)}
                    className="border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex h-7 cursor-pointer items-center rounded-full border px-3 font-mono text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                  >
                    {`{${variavel}}`}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <PreviaDaMensagem assunto={assunto} template={template} />
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="canal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel} className="w-full">
                    {CANAIS_DISPONIVEIS.map((canal) => (
                      <option key={canal} value={canal}>
                        {ROTULOS_DE_CANAL[canal]}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">
                  O WhatsApp entra na próxima etapa: ele exige número verificado e template aprovado pela Meta
                  antes do primeiro disparo.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <fieldset className="grid gap-3 sm:pt-7">
            <legend className="sr-only">Quando e para quem este degrau dispara</legend>
            <Caixa
              formulario={formulario}
              nome="ativa"
              rotulo="Degrau ativo"
              dica="Desligado, a régua pula este ponto sem mandar nada."
              desabilitado={!editavel}
            />
            <Caixa
              formulario={formulario}
              nome="avisar_tesouraria"
              rotulo="Avisar a tesouraria no mesmo dia"
              dica="Um resumo com quantas parcelas chegaram a este ponto."
              desabilitado={!editavel || regra.gatilho === 'InformePendente'}
            />
          </fieldset>
        </div>

        <ErroDoFormulario />

        {/* O teste à esquerda, longe do "Salvar": são ações de peso diferente, e no mesmo canto
              quem quer salvar acerta o que manda e-mail. */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!editavel || testar.isPending || isDirty}
            title={isDirty ? 'Salve as mudanças antes de enviar o teste.' : 'Só você recebe.'}
            onClick={() =>
              testar.mutate(regra.id, {
                onSuccess: () => toast.success('Teste enviado para o seu e-mail.'),
                onError: () => toast.error('Não foi possível enviar o teste.'),
              })
            }
          >
            <Send aria-hidden />
            Enviar teste para mim
          </Button>

          <AcoesDoFormulario
            aoCancelar={aoFechar}
            ocupado={salvar.isPending}
            desabilitado={!editavel}
            rotulo="Salvar"
          />
        </div>
      </form>
    </Form>
  )
}

/** Quantos caracteres já foram usados, e o teto — em vermelho quando passa. */
function Contador({ texto, maximo }: { texto: string; maximo: number }) {
  return (
    <p
      className={cn(
        'text-texto-muted text-right text-xs tabular-nums',
        texto.length > maximo && 'text-destructive',
      )}
    >
      {texto.length} / {maximo}
    </p>
  )
}

/** Uma caixa de marcar com a dica embaixo. */
function Caixa({
  formulario,
  nome,
  rotulo,
  dica,
  desabilitado,
}: {
  formulario: ReturnType<typeof useForm<FormularioDoDegrau>>
  nome: 'ativa' | 'avisar_tesouraria'
  rotulo: string
  dica: string
  desabilitado: boolean
}) {
  return (
    <FormField
      control={formulario.control}
      name={nome}
      render={({ field }) => (
        <FormItem className="gap-1">
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.value}
              disabled={desabilitado}
              onChange={(evento) => field.onChange(evento.target.checked)}
              className="accent-primary size-4"
            />
            {rotulo}
          </label>
          <p className="text-texto-muted pl-6 text-xs">{dica}</p>
        </FormItem>
      )}
    />
  )
}
