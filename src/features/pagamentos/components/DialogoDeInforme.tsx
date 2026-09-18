import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeComprovante } from '@/components/CampoDeComprovante'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { diaDeHoje } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useInformarPagamento, useInformarVariasParcelas } from '../hooks/usePix'
import { esquemaDoPagamento, type FormularioDoPagamento } from '../schemas/pagamento.schema'

interface Props {
  /** A parcela, ou as várias que este mesmo PIX cobriu. */
  parcelaIds: string[]
  /** O valor do QR — é o que o formando pagou, quase sempre. */
  valor_em_centavos: number
  /** Sem conta de recebimento não há o que avisar. */
  desabilitado?: boolean
}

/**
 * O "Já paguei": dia (hoje), valor (o do QR) e o comprovante, se a pessoa quiser.
 *
 * Os dois primeiros vêm preenchidos — no ônibus, confirmar é um toque. O aviso não baixa nada: quem
 * confirma é a tesouraria, olhando o extrato do banco.
 *
 * Diálogo, como todo formulário do app: o passo 2 continua na tela atrás, com o resumo do valor que
 * a pessoa acabou de conferir, em vez de sumir para dar lugar aos campos.
 *
 * Serve às duas telas de pagamento, e o caminho da parcela avulsa não passa pelo do lote: é o
 * `POST /parcelas/{id}/informes` que grava o id da parcela na auditoria.
 */
export function DialogoDeInforme({ parcelaIds, valor_em_centavos, desabilitado = false }: Props) {
  const [aberto, definirAberto] = useState(false)
  const avulso = useInformarPagamento()
  const varias = useInformarVariasParcelas()
  const enviando = avulso.isPending || varias.isPending
  const liberado = useEscritaLiberada()
  const formulario = useForm<FormularioDoPagamento>({
    resolver: zodResolver(esquemaDoPagamento),
    defaultValues: { pago_em: diaDeHoje(), valor_em_centavos, comprovante: undefined },
  })

  const enviar = formulario.handleSubmit((valores) => {
    // A parcela volta "em conferência" e a tela troca sozinha; fechar é só não deixar o diálogo
    // aberto por cima.
    const opcoes = {
      onSuccess: () => definirAberto(false),
      onError: (erro: Error) => exibirErroNoFormulario(erro, formulario.setError),
    }
    const [unica, ...demais] = parcelaIds

    if (unica !== undefined && demais.length === 0) avulso.mutate({ parcelaId: unica, ...valores }, opcoes)
    else varias.mutate({ parcela_ids: parcelaIds, ...valores }, opcoes)
  })

  /** Cada abertura recomeça: hoje, o valor do PIX de agora e nenhum anexo. */
  const abrir = () => {
    formulario.reset({ pago_em: diaDeHoje(), valor_em_centavos, comprovante: undefined })
    definirAberto(true)
  }

  return (
    <>
      <Button size="lg" className="w-full" disabled={desabilitado} onClick={abrir}>
        <Send aria-hidden />
        Já paguei
      </Button>

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Avisar o pagamento"
        descricao="A tesouraria confere no extrato do banco e confirma. O comprovante ajuda, mas não é obrigatório."
      >
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
                    desabilitado={enviando}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErroDoFormulario />

            <AcoesDoFormulario
              aoCancelar={() => definirAberto(false)}
              ocupado={enviando}
              desabilitado={!liberado}
              rotulo="Confirmar"
              rotuloOcupado="Confirmando…"
            />
          </form>
        </Form>
      </DialogoDeFormulario>
    </>
  )
}
