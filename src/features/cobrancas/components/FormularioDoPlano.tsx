import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAtualizarPlano, useCriarPlano } from '../hooks/usePlano'
import {
  esquemaDoPlano,
  type FormularioDoPlano as ValoresDoPlano,
  LIMITES_DE_MERCADO,
  lerPercentual,
  paraDadosDoPlano,
  paraFormularioDoPlano,
  planoEmBranco,
} from '../schemas/cobranca.schema'
import type { PlanoDeCobranca } from '../types/cobrancas.types'

interface Props {
  /** Plano em edição; ausente, o formulário cria o primeiro. */
  plano?: PlanoDeCobranca
  /** Falso trava os campos — formatura fora de `Ativa`. */
  editavel: boolean
  /** Depois de salvar ou cancelar a edição. Ausente, não há o que cancelar: é a criação do primeiro plano. */
  aoConcluir?: () => void
}

const CAMPOS_PERCENTUAIS = [
  { nome: 'multa', rotulo: 'Multa por atraso (%)' },
  { nome: 'jurosAoMes', rotulo: 'Juros ao mês (%)' },
  { nome: 'descontoPorAntecipacao', rotulo: 'Desconto por antecipação (%)' },
] as const

/**
 * Nome do plano e as regras de atraso — uma para a turma toda.
 *
 * As regras ficam guardadas desde já e passam a valer quando a baixa e a régua existirem. Acima de
 * 2% de multa ou 1% de juros ao mês a tela avisa, sem travar: a decisão é da comissão.
 *
 * Monte com `key` pelo plano: os valores iniciais só são lidos na montagem.
 */
export function FormularioDoPlano({ plano, editavel, aoConcluir }: Props) {
  const criar = useCriarPlano()
  const atualizar = useAtualizarPlano()
  const salvando = criar.isPending || atualizar.isPending
  const formulario = useForm<ValoresDoPlano>({
    resolver: zodResolver(esquemaDoPlano),
    defaultValues: plano ? paraFormularioDoPlano(plano) : planoEmBranco(),
  })
  const [multa, juros] = useWatch({ control: formulario.control, name: ['multa', 'jurosAoMes'] })
  const acimaDoMercado =
    (lerPercentual(multa) ?? 0) > LIMITES_DE_MERCADO.multa ||
    (lerPercentual(juros) ?? 0) > LIMITES_DE_MERCADO.jurosAoMes

  const enviar = formulario.handleSubmit((valores) => {
    const dados = paraDadosDoPlano(valores)
    const aoTerminar = {
      onSuccess: (salvo: PlanoDeCobranca) => {
        formulario.reset(paraFormularioDoPlano(salvo))
        toast.success(plano ? 'Regras salvas.' : 'Plano criado. Agora inclua os itens.')
        aoConcluir?.()
      },
      onError: (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError),
    }

    if (plano) atualizar.mutate({ planoId: plano.id, dados }, aoTerminar)
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Nome do plano</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {CAMPOS_PERCENTUAIS.map(({ nome, rotulo }) => (
            <FormField
              key={nome}
              control={formulario.control}
              name={nome}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{rotulo}</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="decimal" disabled={!editavel} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={formulario.control}
            name="carencia_em_dias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carência (dias)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" inputMode="numeric" min={0} max={60} disabled={!editavel} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sem antecedência, o desconto pensado para a quitação à vista sai para quem paga um dia
              antes — a turma inteira, todo mês. */}
          <FormField
            control={formulario.control}
            name="dias_minimos_para_desconto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antecedência do desconto (dias)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={365}
                    disabled={!editavel}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {acimaDoMercado ? (
          <p className="bg-warning-bg text-warning-text rounded-lg px-3 py-2 text-sm">
            Acima de 2% de multa ou 1% de juros ao mês, o formando tende a contestar a cobrança. A comissão
            pode manter, mas é bom ter o motivo no termo de adesão.
          </p>
        ) : null}

        <ErroDoFormulario />

        {/* Editando as regras (no diálogo), o rodapé padrão; criando o primeiro plano, não há o que cancelar. */}
        {editavel && plano && aoConcluir ? (
          <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvando} />
        ) : null}
        {editavel && !plano ? (
          <Button type="submit" className="justify-self-end" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Criar plano'}
          </Button>
        ) : null}
      </form>
    </Form>
  )
}
