import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { EditorDeMarkdown } from '@/components/EditorDeMarkdown'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useDocumentosDaTurma } from '@/hooks/useAcervoDaTurma'
import { formatarCentavos } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import type { ItemDaFesta } from '@/types/festa'
import { ROTULOS_DE_CATEGORIA } from '@/types/financeiro'
import { useAtualizarItem, useCriarItem } from '../hooks/useEscritaDaFesta'
import {
  esquemaDeItemDaFesta,
  type FormularioDoItem as ValoresDoItem,
  itemEmBranco,
  paraDadosDoItem,
  paraFormularioDoItem,
} from '../schemas/festa.schema'

interface Props {
  /** Item em edição; ausente, o formulário cria um novo. */
  editando?: ItemDaFesta
  /** Falso trava os campos — formatura fora de `Ativa`. */
  editavel: boolean
  /** Depois de salvar ou cancelar. */
  aoConcluir: () => void
}

/**
 * Cria ou corrige um item da festa, na ordem em que a comissão pensa: o que é, o que vai ter,
 * quem paga e quanto custa.
 *
 * Não há campo de fornecedor: quem foi contratado sai das despesas do item, e é escolhido uma vez
 * só, no lançamento da despesa. Um seletor aqui seria o mesmo dado digitado duas vezes, com as duas
 * cópias livres para divergir.
 */
export function FormularioDoItem({ editando, editavel, aoConcluir }: Props) {
  const documentos = useDocumentosDaTurma()
  const criar = useCriarItem()
  const atualizar = useAtualizarItem()
  const salvando = criar.isPending || atualizar.isPending

  const formulario = useForm<ValoresDoItem>({
    resolver: zodResolver(esquemaDeItemDaFesta),
    defaultValues: editando ? paraFormularioDoItem(editando) : itemEmBranco(),
  })

  const [rateio, valor, quantidade] = useWatch({
    control: formulario.control,
    name: ['rateio', 'valor_previsto_em_centavos', 'quantidade_estimada'],
  })

  const porFormando = rateio === 'PorFormando'
  const total = porFormando ? valor * (Number(quantidade) || 0) : valor

  const enviar = formulario.handleSubmit((valores) => {
    const aoTerminar = {
      onSuccess: () => {
        toast.success(editando ? 'Item salvo.' : 'Item criado.')
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (editando) atualizar.mutate({ id: editando.id, dados: paraDadosDoItem(valores) }, aoTerminar)
    else criar.mutate(paraDadosDoItem(valores), aoTerminar)
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
                <FormLabel>O que é</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Buffet" disabled={!editavel} />
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
                  <Select {...field} disabled={!editavel}>
                    {Object.entries(ROTULOS_DE_CATEGORIA).map(([valorDaOpcao, rotulo]) => (
                      <option key={valorDaOpcao} value={valorDaOpcao}>
                        {rotulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">A mesma das despesas.</p>
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
              <FormLabel>O que vai ter</FormLabel>
              <FormControl>
                <EditorDeMarkdown
                  {...field}
                  rotuloDaPrevia="Como a turma vai ler"
                  folha="min-h-28"
                  placeholder="4 horas de open bar, três tipos de canapé, bolo de três andares…"
                  disabled={!editavel}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Em pares, e não um campo por linha: os quatro que sobram são curtos — dois seletores e
            dois números —, e empilhados faziam o diálogo passar da altura da tela e rolar. */}
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="rateio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quem paga</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel}>
                    <option value="Turma">A turma inteira, pelo plano de cobrança</option>
                    <option value="PorFormando">Só quem quiser, por formando</option>
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">
                  {porFormando
                    ? 'O custo soma o preço vezes quantos devem comprar.'
                    : 'O custo soma o valor total do contrato.'}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="documento_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contrato</FormLabel>
                <FormControl>
                  <Select {...field} disabled={!editavel}>
                    <option value="">Nenhum — sem contrato no acervo</option>
                    {documentos.map((documento) => (
                      <option key={documento.id} value={documento.id}>
                        {documento.titulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <p className="text-texto-muted text-xs">Só o que está no acervo e visível para a turma.</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="valor_previsto_em_centavos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{porFormando ? 'Preço por formando' : 'Valor orçado'}</FormLabel>
                <FormControl>
                  <CampoDeMoeda {...field} disabled={!editavel} />
                </FormControl>
                <p className="text-texto-muted text-xs">
                  Vale até a primeira despesa; depois, o custo é o contratado.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {porFormando ? (
            <FormField
              control={formulario.control}
              name="quantidade_estimada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantos devem comprar</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="numeric" disabled={!editavel} />
                  </FormControl>
                  <output className="text-muted-foreground text-xs">
                    Custo estimado: <strong className="text-foreground">{formatarCentavos(total)}</strong>
                  </output>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <ErroDoFormulario />

        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} desabilitado={!editavel} />
      </form>
    </Form>
  )
}
