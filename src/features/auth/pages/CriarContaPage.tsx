import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { ehErroDaApi } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { ErroDoFormulario } from '../components/ErroDoFormulario'
import { AvisoDeTermos, estilos, LayoutDeAutenticacao } from '../components/LayoutDeAutenticacao'
import { useRegistrar } from '../hooks/useAutenticacao'
import { esquemaDeNovaConta, type FormularioDeNovaConta } from '../schemas/auth.schema'

export default function CriarContaPage() {
  const registrar = useRegistrar()

  const formulario = useForm<FormularioDeNovaConta>({
    resolver: zodResolver(esquemaDeNovaConta),
    defaultValues: { nome: '', email: '', senha: '' },
  })

  const enviar = formulario.handleSubmit((valores) => {
    registrar.mutate(valores, {
      onError: (erro) => {
        // O 409 não é erro de validação e chega sem campo; o lugar dele é embaixo do e-mail.
        if (ehErroDaApi(erro) && erro.codigo === 'usuario.email_em_uso') {
          formulario.setError('email', { message: erro.message })
          return
        }
        exibirErroNoFormulario(erro, formulario.setError)
      },
    })
  })

  return (
    <LayoutDeAutenticacao>
      <h1 className={estilos.titulo}>Crie sua conta</h1>
      <p className={estilos.subtitulo}>A formatura da sua turma, organizada num lugar só.</p>

      <Form {...formulario}>
        <form onSubmit={enviar} className="grid gap-5" noValidate>
          <FormField
            control={formulario.control}
            name="nome"
            render={({ field }) => (
              <FormItem className={estilos.item}>
                <FormLabel className={estilos.rotulo}>Nome</FormLabel>
                <FormControl>
                  <Input autoComplete="name" className={estilos.campo} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="email"
            render={({ field }) => (
              <FormItem className={estilos.item}>
                <FormLabel className={estilos.rotulo}>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" className={estilos.campo} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="senha"
            render={({ field }) => (
              <FormItem className={estilos.item}>
                <FormLabel className={estilos.rotulo}>Senha</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" className={estilos.campo} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ErroDoFormulario />

          <Button type="submit" disabled={registrar.isPending} className={estilos.cta}>
            {registrar.isPending ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Já tem conta?{' '}
        <Link to={ROTAS.login} className={estilos.link}>
          Entrar
        </Link>
      </p>

      <AvisoDeTermos />
    </LayoutDeAutenticacao>
  )
}
