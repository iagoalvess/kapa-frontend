import { zodResolver } from '@hookform/resolvers/zod'
import { type ReactNode, useState } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { exibirErroNoFormulario } from '@/lib/http/formulario'

type Esquema<Campo extends string> = z.ZodObject<Record<Campo, z.ZodString>>

interface Props<Campo extends string> {
  /** O botão que abre — "Recusar", "Estornar". */
  gatilho: string
  titulo: string
  descricao: ReactNode
  /** O campo do texto, como o esquema o chama: `motivo`, `justificativa`. */
  campo: Campo
  rotulo: string
  esquema: Esquema<Campo>
  /** O botão de confirmar. */
  confirmar: string
  ocupado: boolean
  desabilitado?: boolean
  /** Envia o texto; chama `concluir` no sucesso e `falhar` no erro, que volta para o campo. */
  aoEnviar: (texto: string, concluir: () => void, falhar: (erro: unknown) => void) => void
}

/**
 * Um diálogo com um texto obrigatório e um botão de confirmar — a recusa (motivo, que vai ao formando)
 * e o estorno (justificativa, que fica na auditoria). Os dois pedem o mesmo: explicar antes de agir.
 */
export function DialogoDeTexto<Campo extends string>({
  gatilho,
  titulo,
  descricao,
  campo,
  rotulo,
  esquema,
  confirmar,
  ocupado,
  desabilitado = false,
  aoEnviar,
}: Props<Campo>) {
  const [aberto, definirAberto] = useState(false)
  const formulario = useForm<Record<string, string>>({
    // O esquema tem um campo só, o `campo`: o formulário é esse registro de um texto.
    resolver: zodResolver(esquema) as unknown as Resolver<Record<string, string>>,
    defaultValues: { [campo]: '' },
  })
  const id = `texto-${campo}-${gatilho}`

  const enviar = formulario.handleSubmit((valores) =>
    aoEnviar(
      valores[campo] ?? '',
      () => definirAberto(false),
      (erro) => exibirErroNoFormulario(erro, formulario.setError),
    ),
  )

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={desabilitado}
        onClick={() => {
          formulario.reset()
          definirAberto(true)
        }}
      >
        {gatilho}
      </Button>
      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo={titulo}
        descricao={descricao}
      >
        <Form {...formulario}>
          <form id={id} onSubmit={enviar} noValidate className="grid gap-3">
            <FormField
              control={formulario.control}
              name={campo}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{rotulo}</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      className="border-input placeholder:text-texto-muted focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-xl border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ErroDoFormulario />
          </form>
        </Form>

        {/* O verbo fica ("Recusar", "Estornar"): aqui ele diz o que acontece com o dinheiro do formando. */}
        <AcoesDoFormulario
          aoCancelar={() => definirAberto(false)}
          ocupado={ocupado}
          rotulo={confirmar}
          rotuloOcupado={confirmar}
          form={id}
        />
      </DialogoDeFormulario>
    </>
  )
}
