import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { ErroDoFormulario } from '../components/ErroDoFormulario'
import { Aviso, estilos, LayoutDeAutenticacao } from '../components/LayoutDeAutenticacao'
import { useSolicitarRedefinicao } from '../hooks/useConta'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { esquemaDePedidoPorEmail, type FormularioDePedidoPorEmail } from '../schemas/auth.schema'

export default function EsqueciSenhaPage() {
  const solicitar = useSolicitarRedefinicao()

  const formulario = useForm<FormularioDePedidoPorEmail>({
    resolver: zodResolver(esquemaDePedidoPorEmail),
    // Quem chega pelo "Esqueci minha senha" do login já digitou o e-mail lá.
    defaultValues: { email: useEstadoDeNavegacao('email') ?? '' },
  })

  const enviar = formulario.handleSubmit(({ email }) => {
    solicitar.mutate(email, {
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    })
  })

  return (
    <LayoutDeAutenticacao>
      <h1 className={estilos.titulo}>Esqueceu a senha?</h1>
      <p className={estilos.subtitulo}>Informe seu e-mail e enviamos um link para você criar uma nova.</p>

      {solicitar.isSuccess ? (
        // A API responde igual exista a conta ou não, e a tela precisa fazer o mesmo — dizer
        // "e-mail não encontrado" entregaria quem tem cadastro.
        <Aviso>
          Se houver uma conta com <strong>{solicitar.variables}</strong>, você vai receber o link em
          instantes. Confira também a caixa de spam.
        </Aviso>
      ) : (
        <Form {...formulario}>
          <form onSubmit={enviar} className="grid gap-5" noValidate>
            <FormField
              control={formulario.control}
              name="email"
              render={({ field }) => (
                <FormItem className={estilos.item}>
                  <FormLabel className={estilos.pergunta}>Qual seu e-mail?</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" className={estilos.campo} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErroDoFormulario />

            <Button type="submit" disabled={solicitar.isPending} className={estilos.cta}>
              {solicitar.isPending ? 'Enviando…' : 'Enviar link'}
            </Button>
          </form>
        </Form>
      )}

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Lembrou?{' '}
        <Link to={ROTAS.login} className={estilos.link}>
          Voltar para o login
        </Link>
      </p>
    </LayoutDeAutenticacao>
  )
}
