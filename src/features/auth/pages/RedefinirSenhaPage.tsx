import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { ehErroDaApi } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { ErroDoFormulario } from '../components/ErroDoFormulario'
import { estilos, LayoutDeAutenticacao } from '../components/LayoutDeAutenticacao'
import { useRedefinirSenha } from '../hooks/useConta'
import { esquemaDeRedefinicao, type FormularioDeRedefinicao } from '../schemas/auth.schema'

/**
 * Link expirado, já usado, adulterado ou truncado pelo cliente de e-mail: não há o que corrigir
 * no formulário, só pedir outro. O erro de validação em `email`/`token` entra aqui porque esses
 * campos não existem na tela — aplicado ao formulário, ele sumiria sem aparecer.
 */
function ehFalhaDoLink(erro: unknown) {
  if (!ehErroDaApi(erro)) return false
  if (erro.codigo === 'conta.link_invalido') return true

  return Object.keys(erro.erros).some((campo) => /^(email|token)$/i.test(campo))
}

/** Chega pelo link do e-mail: `/redefinir-senha?email=…&token=…`, montado pelo backend. */
export default function RedefinirSenhaPage() {
  const [parametros] = useSearchParams()
  const email = parametros.get('email')
  const token = parametros.get('token')

  const redefinir = useRedefinirSenha()

  const formulario = useForm<FormularioDeRedefinicao>({
    resolver: zodResolver(esquemaDeRedefinicao),
    defaultValues: { novaSenha: '', confirmacao: '' },
  })

  const linkInvalido = !email || !token || ehFalhaDoLink(redefinir.error)

  const enviar = formulario.handleSubmit(({ novaSenha }) => {
    if (!email || !token) return

    redefinir.mutate(
      { email, token, novaSenha },
      {
        onError: (erro) => {
          if (!ehFalhaDoLink(erro)) exibirErroNoFormulario(erro, formulario.setError)
        },
      },
    )
  })

  if (linkInvalido) {
    return (
      <LayoutDeAutenticacao>
        <h1 className={estilos.titulo}>Link inválido</h1>
        <p className={estilos.subtitulo}>
          Este link de redefinição expirou, já foi usado ou está incompleto. Peça um novo — ele chega em
          instantes.
        </p>
        <Button asChild className={estilos.cta}>
          <Link to={ROTAS.esqueciSenha} state={{ email }}>
            Pedir um novo link
          </Link>
        </Button>
      </LayoutDeAutenticacao>
    )
  }

  return (
    <LayoutDeAutenticacao>
      <h1 className={estilos.titulo}>Crie uma nova senha</h1>
      <p className={estilos.subtitulo}>
        Para <span className="text-foreground font-semibold">{email}</span>. Depois disso, as sessões abertas
        em outros aparelhos são encerradas.
      </p>

      <Form {...formulario}>
        <form onSubmit={enviar} className="grid gap-5" noValidate>
          {/* Sem o usuário no formulário, o gerenciador de senhas salva a senha sem dono. */}
          <input type="email" autoComplete="username" value={email} readOnly hidden />

          <FormField
            control={formulario.control}
            name="novaSenha"
            render={({ field }) => (
              <FormItem className={estilos.item}>
                <FormLabel className={estilos.rotulo}>Nova senha</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" className={estilos.campo} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="confirmacao"
            render={({ field }) => (
              <FormItem className={estilos.item}>
                <FormLabel className={estilos.rotulo}>Repita a nova senha</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" className={estilos.campo} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ErroDoFormulario />

          <Button type="submit" disabled={redefinir.isPending} className={estilos.cta}>
            {redefinir.isPending ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      </Form>
    </LayoutDeAutenticacao>
  )
}
