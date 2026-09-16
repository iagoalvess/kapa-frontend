import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
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
              {/* O ícone é parte do placeholder: mesmo cinza, e some do caminho do cursor. */}
              <div className="relative">
                <Mail className="text-texto-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="off"
                    placeholder="email@exemplo.com"
                    className="pl-9"
                    {...field}
                  />
                </FormControl>
              </div>
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
                  <Select {...field}>
                    {papeis.map((papel) => (
                      <option key={papel} value={papel}>
                        {ROTULOS_DE_PAPEL[papel]}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        ) : null}

        <Button type="submit" disabled={criar.isPending || desabilitado || papeis.length === 0}>
          <Send aria-hidden />
          {criar.isPending ? 'Enviando…' : 'Enviar convite'}
        </Button>

        <ErroDoFormulario className="sm:col-span-3" />
      </form>
    </Form>
  )
}
