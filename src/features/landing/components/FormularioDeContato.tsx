import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import mascoteFoguete from '@/assets/mascote/foguete.webp'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useEnviarLead } from '../hooks/useLanding'
import { esquemaDeContato, type FormularioDeContato as ValoresDoContato } from '../schemas/lead.schema'
import { SecaoDaLanding } from './SecaoDaLanding'

const EM_BRANCO: ValoresDoContato = {
  nome: '',
  email: '',
  telefone: '',
  instituicao: '',
  curso: '',
  tamanho_da_turma: 60,
  previsao_de_colacao: '',
  mensagem: '',
  aceita_privacidade: true,
  sobrenome: '',
}

/**
 * O formulário de contato: o CTA final da página.
 *
 * Três defesas contra robô, e nenhuma delas atrapalha quem é pessoa: o honeypot (o campo
 * `sobrenome`, escondido por CSS), o limite de taxa por IP no backend e a janela de repetição por
 * e-mail. Captcha só entra quando as três deixarem passar spam de verdade — ele é uma dependência
 * de terceiro, uma chave a rotacionar e um obstáculo para quem usa leitor de tela.
 *
 * Os `utm_*` saem da query string da própria visita e viajam no corpo: é a API que grava de onde
 * veio o contato, e ela não enxerga a URL que o navegador abriu.
 *
 * A caixa da Política começa **marcada**, e é a única do formulário: quem chegou até aqui está
 * pedindo contato, e desmarcar é o gesto de quem não quer. O backend recusa o envio sem ela.
 */
export function FormularioDeContato() {
  const [parametros] = useSearchParams()
  const [enviado, definirEnviado] = useState(false)
  const enviar = useEnviarLead()

  const formulario = useForm<ValoresDoContato>({
    resolver: zodResolver(esquemaDeContato),
    defaultValues: EM_BRANCO,
  })

  // `mutate`, e não `mutateAsync`: os dois desfechos já têm callback, e a promessa rejeitada do
  // `mutateAsync` sairia de dentro do `handleSubmit` sem ninguém para pegá-la.
  const aoEnviar = formulario.handleSubmit((valores) =>
    enviar.mutate(
      {
        ...valores,
        origem: parametros.get('utm_source') ?? '',
        meio: parametros.get('utm_medium') ?? '',
        campanha: parametros.get('utm_campaign') ?? '',
      },
      {
        onSuccess: () => definirEnviado(true),
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    ),
  )

  if (enviado) {
    return (
      <SecaoDaLanding id="contato" creme>
        <output className="motion-safe:animate-entrar bg-card shadow-cartao mx-auto grid max-w-xl justify-items-center gap-4 rounded-3xl p-10 text-center">
          <img src={mascoteFoguete} alt="" className="motion-safe:animate-flutuar w-40 drop-shadow-xl" />
          <h2 className="text-foreground text-2xl font-semibold">Recebemos seu contato</h2>
          <p className="text-muted-foreground text-pretty">
            A gente responde no mesmo dia útil, no e-mail que você deixou. Se preferir adiantar, dá para criar
            a turma agora e conversar depois.
          </p>
          <Button asChild variant="outline">
            <Link to={ROTAS.criarConta}>Criar minha conta</Link>
          </Button>
        </output>
      </SecaoDaLanding>
    )
  }

  return (
    <SecaoDaLanding
      id="contato"
      creme
      etiqueta="Falar com a gente"
      titulo="Conte da sua turma"
      descricao="A gente responde com o plano que cabe, e sem discurso de vendas."
      className="lg:grid-cols-[0.75fr_1.25fr] lg:items-start"
      aEsquerda
    >
      <img
        src={mascoteFeliz}
        alt=""
        className="motion-safe:animate-flutuar-devagar mx-auto hidden w-64 self-center drop-shadow-xl lg:block"
      />

      <Form {...formulario}>
        <form
          onSubmit={aoEnviar}
          noValidate
          className="revelar bg-card shadow-cartao grid gap-4 rounded-3xl p-6 sm:grid-cols-2 sm:p-8"
        >
          {/* Honeypot: fora do fluxo, fora da ordem de tabulação e invisível para leitor de tela.
              Robô de formulário preenche todo campo que encontra no HTML; pessoa nenhuma o vê. */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="sobrenome">Não preencha este campo</label>
            <input id="sobrenome" tabIndex={-1} autoComplete="off" {...formulario.register('sobrenome')} />
          </div>

          <FormField
            control={formulario.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seu nome</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ana Souza" autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="ana@exemplo.com" autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(41) 99876-5432" autoComplete="tel" inputMode="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="instituicao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instituição</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="UFPR" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="curso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Curso</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Medicina" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="tamanho_da_turma"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formandos na turma</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={1} max={2000} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* `type="month"` nativo: mês e ano bastam, e ninguém que ainda está escolhendo
              assessoria sabe o dia da colação. */}
          <FormField
            control={formulario.control}
            name="previsao_de_colacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colação prevista</FormLabel>
                <FormControl>
                  <Input {...field} type="month" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="mensagem"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Quer contar mais alguma coisa?</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Onde vocês estão hoje: planilha, grupo do WhatsApp, outra assessoria…"
                    className="border-input bg-background placeholder:text-texto-muted focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-[15px] focus-visible:ring-[3px] focus-visible:outline-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="aceita_privacidade"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <label className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(evento) => field.onChange(evento.target.checked)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                      className="accent-brand mt-0.5 size-4 shrink-0 cursor-pointer"
                    />
                  </FormControl>
                  <span className="text-pretty">
                    Li a{' '}
                    <Link
                      to={ROTAS.privacidade}
                      target="_blank"
                      className="text-brand-text underline-offset-4 hover:underline"
                    >
                      Política de Privacidade
                    </Link>{' '}
                    e autorizo o contato da equipe do Kapa.
                  </span>
                </label>
                <FormMessage />
              </FormItem>
            )}
          />

          <ErroDoFormulario className="sm:col-span-2" />

          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={enviar.isPending}>
              {enviar.isPending ? 'Enviando…' : 'Enviar contato'}
              {enviar.isPending ? null : <Send aria-hidden />}
            </Button>
          </div>
        </form>
      </Form>
    </SecaoDaLanding>
  )
}
