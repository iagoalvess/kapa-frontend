import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/Select'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAtualizarMesa, useCriarMesa } from '../hooks/useMesas'
import {
  esquemaDeMesa,
  type FormularioDaMesa,
  mesaEmBranco,
  paraDadosDaMesa,
  paraFormularioDaMesa,
} from '../schemas/mesa.schema'
import type { Mesa } from '../types/mesas.types'

interface Props {
  /** Aberto com uma mesa, edita; aberto sem, cria; fechado, é `false`. */
  aberto: false | { mesa?: Mesa }
  aoFechar: () => void
  /** A mesa acabou de nascer — o mapa a põe no meio do salão. */
  aoCriar?: (mesa: Mesa) => void
}

/**
 * O cadastro da mesa: nome, lugares, formato, observação e a marca de reservada (P3).
 *
 * O formulário remonta a cada abertura (a chave), então editar uma mesa e depois criar outra não
 * deixa valor da vez anterior no campo.
 */
export function DialogoDeMesa({ aberto, aoFechar, aoCriar }: Props) {
  const mesa = aberto ? aberto.mesa : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={mesa ? `Editar ${mesa.identificacao}` : 'Nova mesa'}
      descricao="Como a mesa se chama e quantos lugares tem. Quem compra a mesa leva ela inteira."
    >
      <FormularioDaMesa key={mesa?.id ?? 'nova'} mesa={mesa} aoConcluir={aoFechar} aoCriar={aoCriar} />
    </DialogoDeFormulario>
  )
}

function FormularioDaMesa({
  mesa,
  aoConcluir,
  aoCriar,
}: {
  mesa?: Mesa
  aoConcluir: () => void
  aoCriar?: (mesa: Mesa) => void
}) {
  const criar = useCriarMesa()
  const atualizar = useAtualizarMesa()

  const formulario = useForm<FormularioDaMesa>({
    resolver: zodResolver(esquemaDeMesa),
    defaultValues: mesa ? paraFormularioDaMesa(mesa) : mesaEmBranco(),
  })

  const enviar = formulario.handleSubmit((valores) => {
    const aoTerminar = {
      onSuccess: (gravada: Mesa) => {
        toast.success(mesa ? 'Mesa salva.' : 'Mesa criada.')
        if (!mesa) aoCriar?.(gravada)
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (mesa) atualizar.mutate({ id: mesa.id, dados: paraDadosDaMesa(valores) }, aoTerminar)
    else criar.mutate(paraDadosDaMesa(valores), aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-[1fr_6rem_9rem]">
          <FormField
            control={formulario.control}
            name="identificacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da mesa</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mesa 12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formulario.control}
            name="lugares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lugares</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formulario.control}
            name="formato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formato</FormLabel>
                <FormControl>
                  <Select {...field}>
                    <option value="Redonda">Redonda</option>
                    <option value="Retangular">Retangular</option>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={formulario.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observação</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Perto da pista" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <CampoDeMarcar
          control={formulario.control}
          name="reservada"
          rotulo="Mesa reservada"
          dica="Fora da venda, como a mesa dos pais ou da diretoria. Mesa reservada não tem dono."
        />

        <ErroDoFormulario />
        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={criar.isPending || atualizar.isPending} />
      </form>
    </Form>
  )
}
