import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeComprovante } from '@/components/CampoDeComprovante'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { diaDeHoje, formatarCentavos, formatarData } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { usePagarDespesa } from '../hooks/useDespesas'
import { esquemaDePagamento, type FormularioDePagamento } from '../schemas/financeiro.schema'
import { type Despesa, rotuloDaDespesa } from '../types/financeiro.types'

/**
 * Registra a saída do dinheiro de uma despesa prevista.
 *
 * O comprovante é **obrigatório** (decisão 3): sem anexo, a prestação de contas em assembleia não
 * se sustenta — e a API recusa com `financeiro.comprovante_obrigatorio`. O botão fica desabilitado
 * até o arquivo ser escolhido, para o erro não precisar de uma ida ao servidor.
 *
 * Valor diferente do combinado se corrige antes, em "Editar": a despesa paga continua editável
 * pela Tesouraria (decisão 5).
 */
export function DialogoDePagamento({
  despesa,
  desabilitado = false,
}: {
  despesa: Despesa
  desabilitado?: boolean
}) {
  const [aberto, definirAberto] = useState(false)
  const [comprovante, definirComprovante] = useState<File | undefined>(undefined)
  const pagar = usePagarDespesa()

  const formulario = useForm<FormularioDePagamento>({
    resolver: zodResolver(esquemaDePagamento),
    defaultValues: { pago_em: diaDeHoje() },
  })

  const enviar = formulario.handleSubmit((valores) => {
    if (!comprovante) return

    pagar.mutate(
      { id: despesa.id, pago_em: valores.pago_em, comprovante },
      {
        onSuccess: () => {
          toast.success('Despesa paga.')
          definirAberto(false)
        },
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    )
  })

  /** Cada abertura recomeça: o dia de hoje e nenhum anexo. */
  const abrir = () => {
    formulario.reset({ pago_em: diaDeHoje() })
    definirComprovante(undefined)
    definirAberto(true)
  }

  return (
    <>
      <Button variant="outline" size="sm" disabled={desabilitado} onClick={abrir}>
        Pagar
      </Button>
      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Registrar pagamento"
        descricao={
          <>
            {rotuloDaDespesa(despesa)} · {formatarCentavos(despesa.valor_em_centavos)}, vencimento em{' '}
            {formatarData(despesa.vencimento)}.
          </>
        }
      >
        <Form {...formulario}>
          <form id={`pagar-${despesa.id}`} onSubmit={enviar} noValidate className="grid gap-4">
            <FormField
              control={formulario.control}
              name="pago_em"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia em que o dinheiro saiu</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" max={diaDeHoje()} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <CampoDeComprovante
                valor={comprovante}
                aoEscolher={definirComprovante}
                desabilitado={pagar.isPending}
                obrigatorio
              />
            </FormItem>

            <ErroDoFormulario />

            <p className="text-muted-foreground text-sm">
              O comprovante é o que sustenta a prestação de contas da turma.
            </p>
          </form>
        </Form>

        <AcoesDoFormulario
          aoCancelar={() => definirAberto(false)}
          ocupado={pagar.isPending}
          desabilitado={comprovante === undefined}
          form={`pagar-${despesa.id}`}
        />
      </DialogoDeFormulario>
    </>
  )
}
