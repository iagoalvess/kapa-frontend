import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { EditorDeMarkdown } from '@/components/EditorDeMarkdown'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import type { Proposta } from '@/types/festa'
import { useAtualizarProposta, useCriarProposta } from '../hooks/useEscritaDaFesta'
import {
  esquemaDeProposta,
  type FormularioDaProposta,
  paraDadosDaProposta,
  paraFormularioDaProposta,
  propostaEmBranco,
} from '../schemas/festa.schema'

interface Props {
  /** Item que a proposta disputa. */
  itemId: string
  /** Aberto com uma proposta, corrige; aberto sem, cria; fechado, é `false`. */
  aberto: false | { proposta?: Proposta }
  /** Depois de salvar, cancelar ou apertar Esc. */
  aoFechar: () => void
}

/** O cadastro de uma proposta num diálogo — o painel de detalhe não tem espaço para um formulário inteiro. */
export function DialogoDeProposta({ itemId, aberto, aoFechar }: Props) {
  const proposta = aberto ? aberto.proposta : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={proposta ? 'Editar proposta' : 'Nova proposta'}
      descricao="Quem a comissão levantou para este item. A turma vê o preço e vota — quem for contratado vira o fornecedor da despesa."
    >
      <Formulario key={proposta?.id ?? 'nova'} itemId={itemId} editando={proposta} aoConcluir={aoFechar} />
    </DialogoDeFormulario>
  )
}

/**
 * Nome, preço e o que ela entrega — três campos, e nada mais.
 *
 * Sem contato, sem documento, sem prazo de validade: proposta é o que a comissão levantou no grupo,
 * escrito onde a turma possa ler. Cotação formal continua fora de escopo.
 */
function Formulario({
  itemId,
  editando,
  aoConcluir,
}: {
  itemId: string
  editando?: Proposta
  aoConcluir: () => void
}) {
  const criar = useCriarProposta()
  const atualizar = useAtualizarProposta()
  const salvando = criar.isPending || atualizar.isPending

  const formulario = useForm<FormularioDaProposta>({
    resolver: zodResolver(esquemaDeProposta),
    defaultValues: editando ? paraFormularioDaProposta(editando) : propostaEmBranco(),
  })

  const enviar = formulario.handleSubmit((valores) => {
    const aoTerminar = {
      onSuccess: () => {
        toast.success(editando ? 'Proposta salva.' : 'Proposta adicionada.')
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (editando) atualizar.mutate({ id: editando.id, dados: paraDadosDaProposta(valores) }, aoTerminar)
    else criar.mutate({ itemId, dados: paraDadosDaProposta(valores) }, aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quem está propondo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Banda X" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="valor_em_centavos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quanto custa</FormLabel>
                <FormControl>
                  <CampoDeMoeda {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={formulario.control}
          name="o_que_inclui"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que ela entrega</FormLabel>
              <FormControl>
                <EditorDeMarkdown
                  {...field}
                  rotuloDaPrevia="Como a turma vai ler"
                  folha="min-h-24"
                  placeholder="Quatro horas de show, som e iluminação inclusos."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ErroDoFormulario />

        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} />
      </form>
    </Form>
  )
}
