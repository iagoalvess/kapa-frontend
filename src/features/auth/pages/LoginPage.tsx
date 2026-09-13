import { zodResolver } from '@hookform/resolvers/zod'
import { type FormEvent, useState } from 'react'
import { flushSync } from 'react-dom'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { ehErroDaApi } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { Aviso, AvisoDeTermos, estilos, LayoutDeAutenticacao } from '../components/LayoutDeAutenticacao'
import { useEntrar } from '../hooks/useAutenticacao'
import { useReenviarConfirmacao } from '../hooks/useConta'
import { esquemaDeLogin, type FormularioDeLogin } from '../schemas/auth.schema'

export default function LoginPage() {
  const entrar = useEntrar()
  const reenviar = useReenviarConfirmacao()
  const aviso = useEstadoDeNavegacao('aviso')

  // Login em duas etapas: com e-mail confirmado, a tela passa a pedir a senha.
  const [emailConfirmado, setEmailConfirmado] = useState<string | null>(null)

  const formulario = useForm<FormularioDeLogin>({
    resolver: zodResolver(esquemaDeLogin),
    defaultValues: { email: '', senha: '' },
  })

  // Com `Conta:ExigirEmailConfirmado` ligado, a senha certa ainda é recusada até o e-mail ser
  // confirmado. A mensagem sozinha deixaria a pessoa sem saída se o e-mail original se perdeu.
  const precisaConfirmarEmail =
    ehErroDaApi(entrar.error) && entrar.error.codigo === 'auth.email_nao_confirmado'

  // O campo da etapa anterior some junto com o foco; flushSync monta o próximo antes de focá-lo.
  const irParaEtapa = (email: string | null) => {
    flushSync(() => setEmailConfirmado(email))
    formulario.setFocus(email ? 'senha' : 'email')
  }

  const continuar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (await formulario.trigger('email')) irParaEtapa(formulario.getValues('email'))
  }

  const trocarEmail = () => {
    formulario.clearErrors('root')
    entrar.reset()
    reenviar.reset()
    irParaEtapa(null)
  }

  const entrarComSenha = formulario.handleSubmit((valores) => {
    entrar.mutate(valores, {
      onError: (erro) => {
        exibirErroNoFormulario(erro, formulario.setError)
        // Erro que a API aponta no e-mail só é visível na primeira etapa.
        if (formulario.getFieldState('email').invalid) irParaEtapa(null)
      },
    })
  })

  return (
    <LayoutDeAutenticacao etapa={emailConfirmado ? 'senha' : 'email'}>
      <h1 className={estilos.titulo}>{emailConfirmado ? 'Agora, sua senha' : 'Bem-vindo de volta'}</h1>
      {emailConfirmado ? (
        <p className={estilos.subtitulo}>
          Entrando como <span className="text-foreground font-semibold">{emailConfirmado}</span>
          {' · '}
          <button type="button" onClick={trocarEmail} className={estilos.link}>
            Trocar
          </button>
        </p>
      ) : (
        <p className={estilos.subtitulo}>A formatura da sua turma, organizada num lugar só.</p>
      )}

      {aviso ? <Aviso>{aviso}</Aviso> : null}

      <Form {...formulario}>
        <form onSubmit={emailConfirmado ? entrarComSenha : continuar} className="grid gap-5" noValidate>
          {emailConfirmado ? (
            <>
              {/* Sem o usuário no formulário, o gerenciador de senhas salva a senha sem dono. */}
              <input type="email" autoComplete="username" value={emailConfirmado} readOnly hidden />

              <FormField
                control={formulario.control}
                name="senha"
                render={({ field }) => (
                  <FormItem className={estilos.item}>
                    <div className="flex items-baseline justify-between">
                      <FormLabel className={estilos.pergunta}>Sua senha</FormLabel>
                      <Link
                        to={ROTAS.esqueciSenha}
                        state={{ email: emailConfirmado }}
                        className={`${estilos.link} text-sm`}
                      >
                        Esqueci minha senha
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        className={estilos.campo}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <FormField
              control={formulario.control}
              name="email"
              render={({ field }) => (
                <FormItem className={estilos.item}>
                  <FormLabel className={estilos.pergunta}>Qual seu e-mail?</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="username" className={estilos.campo} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {formulario.formState.errors.root ? (
            <div role="alert" className="text-destructive text-sm">
              {formulario.formState.errors.root.message}
              {precisaConfirmarEmail && emailConfirmado ? (
                <div className="mt-2">
                  {reenviar.isSuccess ? (
                    <span className="text-muted-foreground">
                      Enviamos um novo link para {emailConfirmado}.
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={reenviar.isPending}
                      onClick={() => reenviar.mutate(emailConfirmado)}
                      className={estilos.link}
                    >
                      {reenviar.isPending ? 'Enviando…' : 'Reenviar e-mail de confirmação'}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" disabled={entrar.isPending} className={estilos.cta}>
            {emailConfirmado ? (entrar.isPending ? 'Entrando…' : 'Entrar') : 'Continuar'}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Ainda não tem conta?{' '}
        <Link to={ROTAS.criarConta} className={estilos.link}>
          Criar conta
        </Link>
      </p>

      <AvisoDeTermos />
    </LayoutDeAutenticacao>
  )
}
