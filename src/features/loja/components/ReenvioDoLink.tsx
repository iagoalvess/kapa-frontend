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
 * "Perdi o link da minha compra": o Kapa reenvia para o mesmo e-mail (decisão 10).
 *
 * A resposta é a mesma exista compra ou não — a tela não diz se alguém comprou com aquele e-mail, como
 * o "esqueci a senha".
 *
 * @param formaturaId A turma da loja.
 */
export function ReenvioDoLink({ formaturaId }: { formaturaId: string }) {
  const reenviar = useReenviarLink()
  const [enviado, definirEnviado] = useState(false)
  const formulario = useForm<z.infer<typeof esquema>>({
    resolver: zodResolver(esquema),
    defaultValues: { email: '' },
  })

  if (enviado)
    return (
      <output className="text-muted-foreground text-sm">
        Se houver compra com este e-mail, enviamos o link para ele agora. O link anterior deixou de funcionar.
      </output>
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
    <details className="text-sm">
      <summary className="text-brand-text cursor-pointer">Perdi o link da minha compra</summary>
      <Form {...formulario}>
        <form onSubmit={enviar} noValidate className="mt-3 grid gap-3">
          <FormField
            control={formulario.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail da compra</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ErroDoFormulario />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="justify-self-start"
            disabled={reenviar.isPending}
          >
            {reenviar.isPending ? 'Enviando…' : 'Reenviar o link'}
          </Button>
        </form>
      </Form>
    </details>
  )
}
