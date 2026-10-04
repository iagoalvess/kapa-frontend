import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useReenviarLink } from '../hooks/useLoja'

const esquema = z.object({ email: z.string().trim().email('Informe o e-mail que você usou na compra.') })

/**
 * O reenvio do link da compra: o Kapa manda de novo para o mesmo e-mail (decisão 10).
 *
 * A resposta é a mesma exista compra ou não — a tela não diz se alguém comprou com aquele e-mail, como
 * o "esqueci a senha". O "Voltar" é o mesmo botão das etapas da compra.
 *
 * @param formaturaId A turma da loja.
 * @param aoVoltar O que o "Voltar" faz — a tela devolve à loja da turma.
 */
export function FormularioDeReenvio({
  formaturaId,
  aoVoltar,
}: {
  formaturaId: string
  aoVoltar: () => void
}) {
  const reenviar = useReenviarLink()
  const [enviado, definirEnviado] = useState(false)
  const formulario = useForm<z.infer<typeof esquema>>({
    resolver: zodResolver(esquema),
    defaultValues: { email: '' },
  })

  if (enviado)
    return (
      <div className="grid gap-4">
        <output className="text-muted-foreground text-sm">
          Pronto! Se você comprou com este e-mail, acabamos de mandar para ele um novo acesso aos seus
          convites. O e-mail antigo não vale mais.
        </output>
        <Button type="button" variant="outline" size="lg" onClick={aoVoltar}>
          Voltar
        </Button>
      </div>
    )

  const enviar = formulario.handleSubmit(({ email }) =>
    reenviar.mutate(
      { formaturaId, email },
      {
        onSuccess: () => definirEnviado(true),
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    ),
  )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-3">
        <FormField
          control={formulario.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail que você usou na compra</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ErroDoFormulario />

        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
          <Button type="button" variant="outline" size="lg" onClick={aoVoltar}>
            Voltar
          </Button>
          <Button type="submit" size="lg" disabled={reenviar.isPending}>
            {reenviar.isPending ? 'Enviando…' : 'Receber de novo'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
