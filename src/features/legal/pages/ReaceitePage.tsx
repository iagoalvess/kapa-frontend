import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router'
import { AceiteObrigatorio } from '@/components/legal/AceiteObrigatorio'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { ROTAS } from '@/config/rotas'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { mensagemDoErro } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useMeusAceites, useRegistrarAceites } from '../hooks/useLegal'
import { esquemaDeReaceite, type FormularioDeReaceite } from '../schemas/legal.schema'
import type { AceitePendente } from '../types/legal.types'

/**
 * Re-aceite dos documentos que ganharam versão nova desde o último aceite.
 *
 * A guarda `ExigeAceites` traz o usuário para cá guardando o destino. Sem pendência, a tela
 * devolve ao destino sozinha — é assim que o aceite termina: a mutação relê as pendências, a
 * lista esvazia e o `<Navigate>` leva adiante.
 */
export default function ReaceitePage() {
  const aceites = useMeusAceites()
  const destino = useEstadoDeNavegacao('de') ?? ROTAS.inicio

  if (aceites.isPending) return <p className="text-muted-foreground text-sm">Carregando…</p>

  if (aceites.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {mensagemDoErro(aceites.error)}
      </p>
    )
  }

  if (aceites.data.pendencias.length === 0) return <Navigate to={destino} replace />

  // Chave pelas versões: se sair outra publicação no meio, o formulário remonta com o esquema novo.
  const chave = aceites.data.pendencias.map((p) => `${p.tipo}:${p.versao}`).join('|')

  return <FormularioDeReaceite key={chave} pendencias={aceites.data.pendencias} />
}

function FormularioDeReaceite({ pendencias }: { pendencias: AceitePendente[] }) {
  const registrar = useRegistrarAceites()

  const formulario = useForm<FormularioDeReaceite>({
    resolver: zodResolver(esquemaDeReaceite(pendencias.map((p) => p.tipo))),
  })

  // Se sair outra versão com a tela aberta, a mutação relê as pendências e a chave remonta o
  // formulário com o que precisa ser aceito agora.
  const enviar = formulario.handleSubmit(() =>
    registrar.mutate(pendencias, { onError: (erro) => exibirErroNoFormulario(erro, formulario.setError) }),
  )

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Atualizamos nossos documentos</CardTitle>
        <CardDescription>
          Para continuar usando a Kapa, leia e aceite a versão nova. Seus dados e sua formatura continuam como
          estão.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...formulario}>
          <form onSubmit={enviar} className="grid gap-4" noValidate>
            {pendencias.map(({ tipo }) => (
              <FormField
                key={tipo}
                control={formulario.control}
                name={`aceites.${tipo}`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AceiteObrigatorio
                        tipos={[tipo]}
                        checked={field.value === true}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {formulario.formState.errors.root?.message ? (
              <p role="alert" className="text-destructive text-sm">
                {formulario.formState.errors.root.message}
              </p>
            ) : null}

            <Button type="submit" disabled={registrar.isPending}>
              {registrar.isPending ? 'Registrando…' : 'Aceitar e continuar'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
