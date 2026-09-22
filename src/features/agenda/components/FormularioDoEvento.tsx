import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { type EventoDaTurma, ROTULOS_DE_SITUACAO, ROTULOS_DE_TIPO } from '@/types/agenda'
import { useAtualizarEvento, useCriarEvento } from '../hooks/useEscritaDaAgenda'
import {
  esquemaDeEvento,
  eventoEmBranco,
  type FormularioDoEvento as ValoresDoEvento,
  paraDadosDoEvento,
  paraFormularioDoEvento,
} from '../schemas/agenda.schema'

interface Props {
  /** Evento em edição; ausente, o formulário marca uma data nova. */
  editando?: EventoDaTurma
  /** Falso trava os campos — formatura fora de `Ativa`. */
  editavel: boolean
  /** Depois de salvar ou cancelar. */
  aoConcluir: () => void
}

/**
 * Marca ou corrige uma data, na ordem em que a comissão pensa: o que é, quando, onde.
 *
 * A data é um `<input type="date">` e a hora um `<input type="time">` — o seletor nativo, que já
 * fala o idioma do sistema e funciona no celular sem biblioteca nenhuma. A hora é opcional: a
 * maioria dos eventos de uma turma nasce só com o dia.
 *
 * "Esta turma já tem uma colação" não é validação de forma: volta da API como `agenda.tipo_unico`,
 * e `exibirErroNoFormulario` a mostra no lugar certo.
 */
export function FormularioDoEvento({ editando, editavel, aoConcluir }: Props) {
  const criar = useCriarEvento()
  const atualizar = useAtualizarEvento()
  const salvando = criar.isPending || atualizar.isPending

  const formulario = useForm<ValoresDoEvento>({
    resolver: zodResolver(esquemaDeEvento),
    defaultValues: editando ? paraFormularioDoEvento(editando) : eventoEmBranco(),
  })

  const enviar = formulario.handleSubmit((valores) => {
    const aoTerminar = {
      onSuccess: () => {
        toast.success(editando ? 'Evento salvo.' : 'Evento marcado na agenda.')
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (editando) atualizar.mutate({ id: editando.id, dados: paraDadosDoEvento(valores) }, aoTerminar)
    else criar.mutate(paraDadosDoEvento(valores), aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <FormField
          control={formulario.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que é</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Prova da beca" disabled={!editavel} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel}>
                    {Object.entries(ROTULOS_DE_TIPO).map(([valorDaOpcao, rotulo]) => (
                      <option key={valorDaOpcao} value={valorDaOpcao}>
                        {rotulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">Uma colação e uma festa por turma.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="situacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Situação</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel}>
                    {Object.entries(ROTULOS_DE_SITUACAO).map(([valorDaOpcao, rotulo]) => (
                      <option key={valorDaOpcao} value={valorDaOpcao}>
                        {rotulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">Eventos cancelados continuam na agenda.</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="hora"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora (opcional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} disabled={!editavel} />
                </FormControl>
                <p className="text-texto-muted text-xs">Sem hora, é o dia inteiro.</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={formulario.control}
          name="local"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Onde (opcional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ateliê da Rua das Flores, 120" disabled={!editavel} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={formulario.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={2}
                  placeholder="Levar documento com foto."
                  disabled={!editavel}
                  className="border-input placeholder:text-texto-muted focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ErroDoFormulario />

        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} desabilitado={!editavel} />
      </form>
    </Form>
  )
}
