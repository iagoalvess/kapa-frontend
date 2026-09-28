import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useDocumentosDaTurma } from '@/hooks/useAcervoDaTurma'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { diaDeHoje } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAtualizarOutraReceita, useLancarOutraReceita } from '../hooks/useOutrasReceitas'
import {
  esquemaDeOutraReceita,
  type FormularioDeOutraReceita as ValoresDaOutraReceita,
  paraDadosDaOutraReceita,
  paraFormularioDeOutraReceita,
  paraNovaOutraReceita,
  outraReceitaEmBranco,
} from '../schemas/financeiro.schema'
import {
  type CategoriaDeOutraReceita,
  ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA,
  type OutraReceita,
} from '../types/financeiro.types'

interface Props {
  /** Aberto com uma receita, corrige; aberto sem, lança; fechado, é `false`. */
  aberto: false | { outraReceita?: OutraReceita }
  /** Depois de salvar, cancelar ou apertar Esc. */
  aoFechar: () => void
}

/**
 * O lançamento da receita num diálogo, como o da despesa.
 *
 * O formulário remonta a cada abertura (a chave), então corrigir uma receita e depois lançar outra
 * não deixa valor da vez anterior no campo.
 */
export function DialogoDeOutraReceita({ aberto, aoFechar }: Props) {
  const editavel = useEscritaLiberada()
  const outraReceita = aberto ? aberto.outraReceita : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={outraReceita ? 'Editar receita' : 'Nova receita'}
      descricao={
        outraReceita
          ? 'A correção vale para esta receita. Receber e cancelar ficam na lista.'
          : 'O que entrou na conta da turma sem ser parcela de formando: patrocínio, evento, doação, rendimento.'
      }
      largura="largo"
    >
      <FormularioDeOutraReceita
        key={outraReceita?.id ?? 'nova'}
        editando={outraReceita}
        editavel={editavel}
        aoConcluir={aoFechar}
      />
    </DialogoDeFormulario>
  )
}

/**
 * Lança ou corrige uma receita: o que foi, de quem, quanto, quando — e se já caiu na conta.
 *
 * Prevista entra só na projeção do caixa; é a recebida que conta no arrecadado e na meta da festa
 * (P2 da Sprint 28). Por isso a caixa "já recebida" vem marcada: o lançamento comum é o do dinheiro
 * que o extrato já mostra. Na correção a caixa some — a situação muda em Receber e Cancelar.
 */
function FormularioDeOutraReceita({
  editando,
  editavel,
  aoConcluir,
}: {
  editando?: OutraReceita
  editavel: boolean
  aoConcluir: () => void
}) {
  const lancar = useLancarOutraReceita()
  const atualizar = useAtualizarOutraReceita()
  const salvando = lancar.isPending || atualizar.isPending
  const documentos = useDocumentosDaTurma()

  const formulario = useForm<ValoresDaOutraReceita>({
    resolver: zodResolver(esquemaDeOutraReceita),
    defaultValues: editando ? paraFormularioDeOutraReceita(editando) : outraReceitaEmBranco(),
  })

  const recebida = useWatch({ control: formulario.control, name: 'recebida' })

  const enviar = formulario.handleSubmit((valores) => {
    const aoTerminar = {
      onSuccess: () => {
        toast.success(editando ? 'Receita salva.' : 'Receita lançada.')
        aoConcluir()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (editando) atualizar.mutate({ id: editando.id, dados: paraDadosDaOutraReceita(valores) }, aoTerminar)
    else lancar.mutate(paraNovaOutraReceita(valores), aoTerminar)
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <FormField
          control={formulario.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que foi</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Patrocínio da colação" disabled={!editavel} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="valor_em_centavos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <CampoDeMoeda {...field} disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="origem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>De quem</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Clínica Sorriso" disabled={!editavel} />
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
                    onChange={(evento) => field.onChange(evento.target.value as CategoriaDeOutraReceita)}
                  >
                    {Object.entries(ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>
                        {rotulo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{recebida ? 'Dia em que entrou' : 'Dia previsto'}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    max={recebida ? diaDeHoje() : undefined}
                    disabled={!editavel}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={formulario.control}
          name="documento_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comprovante</FormLabel>
              <FormControl>
                <Select {...field} disabled={!editavel}>
                  <option value="">Nenhum — sem comprovante no acervo</option>
                  {documentos.map((documento) => (
                    <option key={documento.id} value={documento.id}>
                      {documento.titulo}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <p className="text-texto-muted text-xs">
                Contrato, recibo ou extrato já enviado ao acervo e visível para a turma.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {editando ? null : (
          <div className="border-border grid gap-1 rounded-xl border p-4">
            <CampoDeMarcar
              control={formulario.control}
              name="recebida"
              desabilitado={!editavel}
              rotulo="Este dinheiro já caiu na conta"
            />
            <p className="text-muted-foreground text-sm">
              {recebida
                ? 'Entra no arrecadado, no caixa e na meta da festa.'
                : 'Fica como prevista: aparece só na projeção do caixa até ser recebida.'}
            </p>
          </div>
        )}

        <ErroDoFormulario />

        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} desabilitado={!editavel} />
      </form>
    </Form>
  )
}
