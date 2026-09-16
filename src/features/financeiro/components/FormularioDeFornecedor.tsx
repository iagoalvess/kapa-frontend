import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAtualizarFornecedor, useCriarFornecedor } from '../hooks/useFornecedores'
import {
  esquemaDeFornecedor,
  fornecedorEmBranco,
  type FormularioDeFornecedor as ValoresDoFornecedor,
  paraDadosDoFornecedor,
  paraFormularioDeFornecedor,
} from '../schemas/financeiro.schema'
import { type CategoriaDeDespesa, type Fornecedor, ROTULOS_DE_CATEGORIA } from '../types/financeiro.types'

interface Props {
  /** Fornecedor em edição; ausente, o formulário cadastra um novo. */
  editando?: Fornecedor
  /** Falso trava os campos — formatura fora de `Ativa`. */
  editavel: boolean
  /** Depois de salvar ou cancelar. */
  aoConcluir: () => void
}

/**
 * O cadastro leve de um fornecedor (decisão 4): nome, documento, categoria, contato e observações.
 *
 * A categoria daqui vira o valor padrão do formulário de despesa — é o que faz lançar "Buffet" sem
 * escolher categoria oitenta vezes.
 *
 * Desativar é um campo deste formulário, e não um endpoint à parte: fornecedor com despesa lançada
 * não pode ser excluído, e desativar é o caminho para ele sumir do seletor sem apagar o histórico.
 */
export function FormularioDeFornecedor({ editando, editavel, aoConcluir }: Props) {
  const criar = useCriarFornecedor()
  const atualizar = useAtualizarFornecedor()
  const salvando = criar.isPending || atualizar.isPending

  const formulario = useForm<ValoresDoFornecedor>({
    resolver: zodResolver(esquemaDeFornecedor),
    defaultValues: editando ? paraFormularioDeFornecedor(editando) : fornecedorEmBranco(),
  })

  const enviar = formulario.handleSubmit((valores) => {
    const dados = paraDadosDoFornecedor(valores)
    const aoTerminar = {
      onSuccess: () => {
        toast.success(editando ? 'Fornecedor salvo.' : 'Fornecedor cadastrado.')
        formulario.reset(fornecedorEmBranco())
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (editando) atualizar.mutate({ id: editando.id, dados }, aoTerminar)
    else criar.mutate(dados, aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Buffet Sabor & Arte" disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    disabled={!editavel}
                    onChange={(evento) => field.onChange(evento.target.value as CategoriaDeDespesa)}
                  >
                    {Object.entries(ROTULOS_DE_CATEGORIA).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>
                        {rotulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">Já vem escolhida ao lançar uma despesa dele.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="documento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ ou CPF</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="00.000.000/0000-00" disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(41) 99999-0000" disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* E-mail e observações ocupam a linha inteira: em meia coluna sobrava buraco ao lado. */}
          <FormField
            control={formulario.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>E-mail</FormLabel>
                {/* O ícone é parte do placeholder: mesmo cinza, e some do caminho do cursor. */}
                <div className="relative">
                  <Mail className="text-texto-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="contato@fornecedor.com.br"
                      className="pl-9"
                      disabled={!editavel}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={2}
                    placeholder="O que ficou combinado"
                    disabled={!editavel}
                    className="border-input placeholder:text-texto-muted focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {editando ? (
          <FormField
            control={formulario.control}
            name="ativo"
            render={({ field }) => (
              <FormItem>
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    disabled={!editavel}
                    onChange={(evento) => field.onChange(evento.target.checked)}
                    className="accent-primary size-4"
                  />
                  Ativo
                </label>
                <p className="text-texto-muted text-xs">
                  Desmarque para aposentar o fornecedor sem apagar os lançamentos dele.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <ErroDoFormulario />

        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} desabilitado={!editavel} />
      </form>
    </Form>
  )
}
