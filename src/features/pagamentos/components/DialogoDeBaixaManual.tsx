import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeComprovante } from '@/components/CampoDeComprovante'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { diaDeHoje, formatarData } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { rotuloDoItem } from '@/types/cobranca'
import { useBaixaManual } from '../hooks/useBaixa'
import { esquemaDaBaixa, type FormularioDaBaixa, ROTULOS_DE_FORMA } from '../schemas/pagamento.schema'
import type { FormaDePagamento, Parcela } from '../types/pagamentos.types'

/**
 * A baixa sem aviso do formando: dinheiro em mãos, TED, quem pagou e não avisou. Abre da linha da
 * parcela, na tela Parcelas — não de uma tela nova (Sprint 9).
 *
 * O valor vem com o de hoje (multa e juros incluídos, ou o desconto); o comprovante é opcional (P1).
 * A frase "fica registrada em seu nome" é literal: a baixa grava autor, IP e hora, e só o Presidente
 * a desfaz.
 */
export function DialogoDeBaixaManual({
  parcela,
  desabilitado = false,
}: {
  parcela: Parcela
  desabilitado?: boolean
}) {
  const [aberto, definirAberto] = useState(false)
  const baixar = useBaixaManual()
  const formulario = useForm<FormularioDaBaixa>({
    resolver: zodResolver(esquemaDaBaixa),
    defaultValues: {
      forma: 'Pix',
      pago_em: diaDeHoje(),
      valor_em_centavos: parcela.valor_do_dia?.total_em_centavos ?? parcela.valor_original_em_centavos,
      comprovante: undefined,
    },
  })

  const enviar = formulario.handleSubmit((valores) =>
    baixar.mutate(
      { parcelaId: parcela.id, ...valores },
      {
        onSuccess: () => {
          toast.success('Parcela baixada.')
          definirAberto(false)
        },
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    ),
  )

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={desabilitado}
        onClick={() => {
          formulario.reset()
          definirAberto(true)
        }}
      >
        Baixar
      </Button>
      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Baixar parcela"
        descricao={
          <>
            {parcela.nome} · {rotuloDoItem(parcela)} {parcela.numero}/{parcela.de}, vencimento em{' '}
            {formatarData(parcela.vencimento)}.
          </>
        }
      >
        <Form {...formulario}>
          <form id={`baixa-${parcela.id}`} onSubmit={enviar} noValidate className="grid gap-4">
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FormField
                control={formulario.control}
                name="forma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Como o dinheiro chegou</FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        onChange={(evento) => field.onChange(evento.target.value as FormaDePagamento)}
                      >
                        {Object.entries(ROTULOS_DE_FORMA).map(([valor, rotulo]) => (
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
                name="pago_em"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia em que entrou</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" max={diaDeHoje()} />
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
                    <FormLabel>Valor recebido</FormLabel>
                    <FormControl>
                      <CampoDeMoeda {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formulario.control}
                name="comprovante"
                render={({ field }) => (
                  <FormItem className="self-end">
                    <CampoDeComprovante
                      valor={field.value}
                      aoEscolher={field.onChange}
                      desabilitado={baixar.isPending}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ErroDoFormulario />

            <p className="text-muted-foreground text-sm">Esta ação fica registrada em seu nome.</p>
          </form>
        </Form>

        <AcoesDoFormulario
          aoCancelar={() => definirAberto(false)}
          ocupado={baixar.isPending}
          form={`baixa-${parcela.id}`}
        />
      </DialogoDeFormulario>
    </>
  )
}
