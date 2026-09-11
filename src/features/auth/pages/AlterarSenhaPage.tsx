import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { ErroDoFormulario } from '../components/ErroDoFormulario'
import { useAlterarSenha } from '../hooks/useConta'
import { esquemaDeTrocaDeSenha, type FormularioDeTrocaDeSenha } from '../schemas/auth.schema'

/** Troca de senha de quem está logado. Ao concluir, todas as sessões caem e a pessoa entra de novo. */
export default function AlterarSenhaPage() {
  const alterar = useAlterarSenha()

  const formulario = useForm<FormularioDeTrocaDeSenha>({
    resolver: zodResolver(esquemaDeTrocaDeSenha),
    defaultValues: { senhaAtual: '', novaSenha: '', confirmacao: '' },
  })

  const enviar = formulario.handleSubmit(({ senhaAtual, novaSenha }) => {
    alterar.mutate(
      { senhaAtual, novaSenha },
      { onError: (erro) => exibirErroNoFormulario(erro, formulario.setError) },
    )
  })

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
        <CardDescription>
          Ao salvar, você sai de todos os aparelhos — inclusive deste — e entra de novo com a senha nova.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...formulario}>
          <form onSubmit={enviar} className="grid gap-4" noValidate>
            <FormField
              control={formulario.control}
              name="senhaAtual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="novaSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="confirmacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repita a nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErroDoFormulario />

            <Button type="submit" disabled={alterar.isPending}>
              {alterar.isPending ? 'Salvando…' : 'Salvar nova senha'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
