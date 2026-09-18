import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CampoDeComprovante } from '@/components/CampoDeComprovante'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { diaDeHoje } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useInformarPagamento } from '../hooks/usePix'
import { esquemaDoPagamento, type FormularioDoPagamento } from '../schemas/pagamento.schema'

interface Props {
  parcelaId: string
  /** O valor do QR — é o que o formando pagou, quase sempre. */
  valor_em_centavos: number
  /** Depois de avisar: a parcela volta do servidor "em conferência". */
  aoConcluir: () => void
  aoCancelar: () => void
}

/**
 * O "Já paguei": dia (hoje), valor (o do QR) e o comprovante, se a pessoa quiser.
 *
 * Os dois primeiros vêm preenchidos — no ônibus, confirmar é um toque. O aviso não baixa nada: quem
 * confirma é a tesouraria, olhando o extrato do banco.
 */
export function FormularioDeInforme({ parcelaId, valor_em_centavos, aoConcluir, aoCancelar }: Props) {
  const informar = useInformarPagamento()
  const liberado = useEscritaLiberada()
  const formulario = useForm<FormularioDoPagamento>({
    resolver: zodResolver(esquemaDoPagamento),
    defaultValues: { pago_em: diaDeHoje(), valor_em_centavos, comprovante: undefined },
  })

  const enviar = formulario.handleSubmit((valores) =>
    informar.mutate(
      { parcelaId, ...valores },
      { onSuccess: aoConcluir, onError: (erro) => exibirErroNoFormulario(erro, formulario.setError) },
    ),
  )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="pago_em"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia do pagamento</FormLabel>
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
                <FormLabel>Valor pago</FormLabel>
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
          name="comprovante"
          render={({ field }) => (
            <FormItem>
              <CampoDeComprovante
                valor={field.value}
                aoEscolher={field.onChange}
                desabilitado={informar.isPending}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <ErroDoFormulario />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!liberado || informar.isPending}>
            {informar.isPending ? 'Avisando…' : 'Avisar a tesouraria'}
          </Button>
          <Button type="button" variant="outline" onClick={aoCancelar} disabled={informar.isPending}>
            Voltar
          </Button>
        </div>
      </form>
    </Form>
  )
}
