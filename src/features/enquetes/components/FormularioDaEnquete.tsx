import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { EditorDeMarkdown } from '@/components/EditorDeMarkdown'
import { Button } from '@/components/ui/button'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import type { EnqueteDetalhe } from '@/types/enquete'
import { useAtualizarEnquete, useCriarEnquete } from '../hooks/useEscritaDasEnquetes'
import {
  esquemaDeEnquete,
  paraDadosDaEnquete,
  paraFormularioDaEnquete,
  type ValoresDaEnquete,
} from '../schemas/enquete.schema'

/** Um cadastro para publicar ou editar, com alternativas reaproveitadas e regras travadas após o voto. */
export function FormularioDaEnquete({
  detalhe,
  aoFechar,
  aoSalvar,
}: {
  detalhe?: EnqueteDetalhe
  aoFechar: () => void
  aoSalvar: (id: string) => void
}) {
  const criar = useCriarEnquete()
  const atualizar = useAtualizarEnquete()
  const formulario = useForm<ValoresDaEnquete>({
    resolver: zodResolver(esquemaDeEnquete),
    defaultValues: paraFormularioDaEnquete(detalhe),
  })
  const opcoes = useFieldArray({ control: formulario.control, name: 'opcoes' })
  const tipo = useWatch({ control: formulario.control, name: 'tipo' })
  const travado = detalhe?.enquete.opcoes_travadas ?? false
  const salvando = criar.isPending || atualizar.isPending
  const enviar = formulario.handleSubmit((valores) => {
    const retorno = {
      onSuccess: (salva: EnqueteDetalhe) => {
        toast.success(detalhe ? 'Enquete salva.' : 'Enquete publicada.')
        aoSalvar(salva.enquete.id)
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }
    const dados = paraDadosDaEnquete(valores)
    if (detalhe) atualizar.mutate({ id: detalhe.enquete.id, dados }, retorno)
    else criar.mutate(dados, retorno)
  })
  return (
    <DialogoDeFormulario
      aberto
      aoFechar={aoFechar}
      titulo={detalhe ? 'Editar enquete' : 'Nova enquete'}
      descricao="Voto secreto e resultado ao vivo."
      largura="largo"
    >
      <Form {...formulario}>
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <FormField
            control={formulario.control}
            name="pergunta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pergunta</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={200} disabled={travado || salvando} />
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
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <EditorDeMarkdown
                    {...field}
                    rotuloDaPrevia="Como a turma vai ler"
                    folha="min-h-28"
                    maxLength={2000}
                    disabled={salvando}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={formulario.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de resposta</FormLabel>
                  <FormControl>
                    <Select {...field} disabled={travado || salvando}>
                      <option value="UnicaEscolha">Escolha única</option>
                      <option value="MultiplaEscolha">Múltipla escolha</option>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {tipo === 'MultiplaEscolha' ? (
              <FormField
                control={formulario.control}
                name="maximo_de_escolhas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de escolhas</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        max={opcoes.fields.length}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled={travado || salvando}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
          <fieldset disabled={travado || salvando} className="grid gap-3">
            <legend className="mb-2 text-sm font-medium">Opções (de 2 a 10)</legend>
            {opcoes.fields.map((opcao, indice) => (
              <div key={opcao.id} className="flex items-start gap-2">
                <FormField
                  control={formulario.control}
                  name={`opcoes.${indice}.texto`}
                  render={({ field }) => (
                    <FormItem className="min-w-0 flex-1">
                      <FormLabel>Opção {indice + 1}</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={120} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-1 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    aria-label={`Mover opção ${indice + 1} para cima`}
                    disabled={travado || salvando || indice === 0}
                    onClick={() => opcoes.move(indice, indice - 1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    aria-label={`Mover opção ${indice + 1} para baixo`}
                    disabled={travado || salvando || indice === opcoes.fields.length - 1}
                    onClick={() => opcoes.move(indice, indice + 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    aria-label={`Excluir opção ${indice + 1}`}
                    disabled={travado || salvando || opcoes.fields.length <= 2}
                    onClick={() => opcoes.remove(indice)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              disabled={travado || salvando || opcoes.fields.length >= 10}
              onClick={() => opcoes.append({ texto: '' })}
            >
              Adicionar opção
            </Button>
            {formulario.formState.errors.opcoes?.message ? (
              <p role="alert" className="text-destructive text-sm">
                {formulario.formState.errors.opcoes.message}
              </p>
            ) : null}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={formulario.control}
              name="encerra_em"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Encerra em</FormLabel>
                  <FormControl>
                    <Input {...field} type="datetime-local" disabled={salvando} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulario.control}
              name="quorum_minimo_percentual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quórum mínimo (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={100}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      disabled={travado || salvando}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Prazo entre 1 hora e 60 dias da publicação.{' '}
            {travado
              ? 'As regras estão travadas; você pode editar a descrição e adiar o prazo.'
              : 'As regras ficam travadas após a primeira resposta.'}
          </p>
          <ErroDoFormulario />
          <AcoesDoFormulario aoCancelar={aoFechar} ocupado={salvando} />
        </form>
      </Form>
    </DialogoDeFormulario>
  )
}
