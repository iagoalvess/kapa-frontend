import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { env } from '@/config/env'
import { mensagemDoErro } from '@/lib/http/erros'
import { aplicarErrosDaApi } from '@/lib/http/formulario'
import { useEntrar } from '../hooks/useAutenticacao'
import { esquemaDeLogin, type FormularioDeLogin } from '../schemas/auth.schema'

export default function LoginPage() {
  const entrar = useEntrar()

  const formulario = useForm<FormularioDeLogin>({
    resolver: zodResolver(esquemaDeLogin),
    defaultValues: { email: '', senha: '' },
  })

  const enviar = formulario.handleSubmit((valores) => {
    entrar.mutate(valores, {
      onError: (erro) => {
        if (!aplicarErrosDaApi(erro, formulario.setError)) {
          formulario.setError('root', { message: mensagemDoErro(erro) })
        }
      },
    })
  })

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{env.VITE_APP_NOME}</CardTitle>
          <CardDescription>Entre com suas credenciais para continuar.</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...formulario}>
            <form onSubmit={enviar} className="grid gap-4" noValidate>
              <FormField
                control={formulario.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formulario.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formulario.formState.errors.root ? (
                <p role="alert" className="text-destructive text-sm">
                  {formulario.formState.errors.root.message}
                </p>
              ) : null}

              <Button type="submit" disabled={entrar.isPending}>
                {entrar.isPending ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
