import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAbrirArquivoDoAcervo } from '@/hooks/useAcervoDaTurma'
import { diaDeHoje, formatarCentavos, formatarData } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useCancelarOutraReceita, useReceberOutraReceita } from '../hooks/useOutrasReceitas'
import { esquemaDeRecebimento, type FormularioDeRecebimento } from '../schemas/financeiro.schema'
import { ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA, type OutraReceita } from '../types/financeiro.types'

/** A situação da receita: a receber cinza, recebida verde, atrasada vermelha. */
export function SituacaoDaOutraReceita({ outraReceita }: { outraReceita: OutraReceita }) {
  if (outraReceita.status === 'Recebida') return <Selo tom="sucesso">Recebida</Selo>
  if (outraReceita.status === 'Cancelada') return <Selo tom="neutro">Cancelada</Selo>

  return outraReceita.atrasada ? <Selo tom="perigo">Atrasada</Selo> : <Selo tom="cinza">A receber</Selo>
}

interface Props {
  outraReceita: OutraReceita
  /** Tesouraria: só ela lança, recebe, cancela e corrige. */
  tesouraria: boolean
  /** Falso trava as ações de escrita — formatura fora de `Ativa`. */
  editavel: boolean
  /** Abre o diálogo de correção desta receita. */
  aoEditar: () => void
}

/**
 * Uma linha da lista de receitas: o que é, de quem, quando, quanto e em que situação.
 *
 * O valor vem no verde de entrada — é o que separa esta tela da de despesas de relance. Receber e
 * cancelar só aparecem na prevista; a recebida se corrige em "Editar", como a despesa paga.
 */
export function LinhaDeOutraReceita({ outraReceita, tesouraria, editavel, aoEditar }: Props) {
  const cancelar = useCancelarOutraReceita()
  const documento = useAbrirArquivoDoAcervo()
  const prevista = outraReceita.status === 'Prevista'

  return (
    <tr className="border-b last:border-0">
      <th scope="row" className="grid min-w-52 py-3 pr-4 text-left font-normal">
        <span className="text-foreground truncate font-medium">{outraReceita.descricao}</span>
        <span className="text-muted-foreground truncate text-xs font-normal">
          {outraReceita.origem ?? 'Sem origem'} ·{' '}
          {ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA[outraReceita.categoria]}
        </span>
      </th>
      <td className="py-3 pr-4 whitespace-nowrap">{formatarData(outraReceita.data)}</td>
      <td className="text-success-text py-3 pr-4 text-right whitespace-nowrap tabular-nums">
        {formatarCentavos(outraReceita.valor_em_centavos)}
      </td>
      <td className="py-3 pr-4">
        <SituacaoDaOutraReceita outraReceita={outraReceita} />
      </td>
      <td className="py-3 text-right">
        <div className="flex justify-end gap-2">
          {/* O comprovante está no acervo, visível para a turma: abre para qualquer membro. */}
          {outraReceita.documento ? (
            <Button
              variant="outline"
              size="sm"
              disabled={documento.abrindo}
              onClick={() => outraReceita.documento && documento.abrir(outraReceita.documento)}
              aria-label={`Abrir comprovante de ${outraReceita.descricao}`}
            >
              Comprovante
            </Button>
          ) : null}

          {tesouraria && prevista ? (
            <DialogoDeRecebimento outraReceita={outraReceita} desabilitado={!editavel} />
          ) : null}

          {tesouraria && outraReceita.status !== 'Cancelada' ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!editavel}
              onClick={aoEditar}
              aria-label={`Editar ${outraReceita.descricao}`}
            >
              Editar
            </Button>
          ) : null}

          {tesouraria && prevista ? (
            <DialogoDeConfirmacao
              gatilho={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!editavel || cancelar.isPending}
                  aria-label={`Cancelar ${outraReceita.descricao}`}
                >
                  Cancelar
                </Button>
              }
              titulo={`Cancelar “${outraReceita.descricao}”?`}
              descricao="A receita sai da projeção do caixa. Cancelada é situação final: se o dinheiro vier, é lançar de novo."
              rotuloDeCancelar="Voltar"
              rotulo="Cancelar receita"
              destrutivo
              aoConfirmar={() =>
                cancelar.mutate(outraReceita.id, {
                  onSuccess: () => toast.info('Receita cancelada.'),
                  onError: avisarErro,
                })
              }
            />
          ) : null}
        </div>
      </td>
    </tr>
  )
}

/**
 * Marca a prevista como recebida, no dia em que o dinheiro caiu na conta.
 *
 * Só aqui ela passa a contar no arrecadado e na meta da festa (P2 da Sprint 28). Sem anexo
 * obrigatório, ao contrário do pagamento de despesa: rendimento de aplicação não tem recibo, e o
 * comprovante, quando há, já está no acervo.
 */
function DialogoDeRecebimento({
  outraReceita,
  desabilitado,
}: {
  outraReceita: OutraReceita
  desabilitado: boolean
}) {
  const [aberto, definirAberto] = useState(false)
  const receber = useReceberOutraReceita()

  const formulario = useForm<FormularioDeRecebimento>({
    resolver: zodResolver(esquemaDeRecebimento),
    defaultValues: { recebida_em: diaDeHoje() },
  })

  const enviar = formulario.handleSubmit((valores) =>
    receber.mutate(
      { id: outraReceita.id, recebida_em: valores.recebida_em },
      {
        onSuccess: () => {
          toast.success('Receita recebida.')
          definirAberto(false)
        },
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    ),
  )

  /** Cada abertura recomeça no dia de hoje. */
  const abrir = () => {
    formulario.reset({ recebida_em: diaDeHoje() })
    definirAberto(true)
  }

  return (
    <>
      <Button variant="outline" size="sm" disabled={desabilitado} onClick={abrir}>
        Receber
      </Button>
      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Registrar recebimento"
        descricao={
          <>
            {outraReceita.descricao} · {formatarCentavos(outraReceita.valor_em_centavos)}, previsto para{' '}
            {formatarData(outraReceita.data)}.
          </>
        }
      >
        <Form {...formulario}>
          <form id={`receber-${outraReceita.id}`} onSubmit={enviar} noValidate className="grid gap-4">
            <FormField
              control={formulario.control}
              name="recebida_em"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia em que o dinheiro entrou</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" max={diaDeHoje()} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErroDoFormulario />
          </form>
        </Form>

        <AcoesDoFormulario
          aoCancelar={() => definirAberto(false)}
          ocupado={receber.isPending}
          form={`receber-${outraReceita.id}`}
          rotulo="Registrar"
          rotuloOcupado="Registrando…"
        />
      </DialogoDeFormulario>
    </>
  )
}
