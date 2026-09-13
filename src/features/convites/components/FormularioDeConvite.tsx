import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useCriarConvite } from '../hooks/useConvites'
import { esquemaDeConviteNominal, type FormularioDeConviteNominal } from '../schemas/convite.schema'

/**
 * Convite nominal: o link vai para o e-mail da pessoa e só vale para uma conta com esse e-mail.
 *
 * @param papeis Papéis que quem está logado pode oferecer agora. Com mais de um aparece a escolha;
 *   com um só, o convite é dele; sem nenhum, o formulário fica desabilitado.
 * @param desabilitado Formatura em modo leitura: a API recusaria de qualquer forma.
 */
export function FormularioDeConvite({
  papeis,
  desabilitado,
}: {
  papeis: readonly Papel[]
  desabilitado: boolean
}) {
  const criar = useCriarConvite()

  const formulario = useForm<FormularioDeConviteNominal>({
    resolver: zodResolver(esquemaDeConviteNominal),
    defaultValues: { email: '', papel: papeis[0] ?? PAPEIS.formando },
  })

  const enviar = formulario.handleSubmit(({ email, papel }) =>
    criar.mutate(
      { email, papel },
      {
        onSuccess: () => {
          toast.success(`Convite enviado para ${email}.`)
          formulario.reset({ email: '', papel })
        },
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    ),
  )

  return (
    <Form {...formulario}>
      <form noValidate onSubmit={enviar} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-start">
        <FormField
          control={formulario.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">E-mail do convidado</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="off" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {papeis.length > 1 ? (
          <FormField
            control={formulario.control}
            name="papel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Papel do convidado</FormLabel>
                <FormControl>
                  <select
                    className="border-border bg-card focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    {...field}
                  >
                    {papeis.map((papel) => (
                      <option key={papel} value={papel}>
                        {ROTULOS_DE_PAPEL[papel]}
                      </option>
                    ))}
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
        ) : null}

        <Button type="submit" disabled={criar.isPending || desabilitado || papeis.length === 0}>
          {criar.isPending ? 'Enviando…' : 'Enviar convite'}
        </Button>

        {formulario.formState.errors.root?.message ? (
          <p role="alert" className="text-destructive text-sm sm:col-span-3">
            {formulario.formState.errors.root.message}
          </p>
        ) : null}
      </form>
    </Form>
  )
}
