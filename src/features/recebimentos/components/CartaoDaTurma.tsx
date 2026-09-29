import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { Chip } from '@/components/Chip'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Interruptor } from '@/components/Interruptor'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatarData, formatarPercentual } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useConfigurarCartao } from '../hooks/useMercadoPago'
import {
  esquemaDoCartao,
  type FormularioDoCartao,
  paraConfiguracao,
  TAXA_SUGERIDA,
} from '../schemas/cartao.schema'
import type { CartaoDaTurma as Cartao } from '../types/recebimentos.types'

/**
 * O cartão de crédito da turma (Sprint 39), dentro do cartão do Mercado Pago: o interruptor, quem paga a taxa e
 * quem ligou.
 *
 * Desligado por padrão (P7), e só a Tesouraria e o Presidente mexem. Desligar grava na hora — não apaga nada, e o
 * que já foi cobrado segue conciliado. Ligar abre o diálogo: ligar é aceitar a taxa (P2) e o risco de contestação
 * (P4), e a turma lê os dois antes, com a escolha do recebimento na hora ou em 30 dias, que é do Mercado Pago (P8).
 *
 * @param cartao Como está agora.
 * @param escreve Se quem vê pode ligar e desligar.
 */
export function CartaoDaTurma({ cartao, escreve }: { cartao: Cartao; escreve: boolean }) {
  const configurar = useConfigurarCartao()
  const [ligando, definirLigando] = useState(false)
  const ligado = cartao.ligado_em !== null

  const alternar = (ligar: boolean) => {
    if (ligar) return definirLigando(true)

    configurar.mutate(
      { ligado: false, taxa_repassada: null },
      {
        onSuccess: () => toast.info('Cartão desligado. A opção saiu da tela de pagamento.'),
        onError: avisarErro,
      },
    )
  }

  return (
    <section aria-label="Cartão de crédito" className="bg-muted grid gap-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-foreground flex items-center gap-2 font-medium">
          <CreditCard className="size-4" aria-hidden />
          Cartão de crédito
          {ligado ? <Selo tom="sucesso">Ligado</Selo> : <Selo tom="neutro">Desligado</Selo>}
        </p>
        {escreve && cartao.disponivel ? (
          <div className="flex items-center gap-2">
            {ligado ? (
              <Button variant="outline" size="sm" onClick={() => definirLigando(true)}>
                Editar
              </Button>
            ) : null}
            <Interruptor
              ligado={ligado}
              rotulo="Cartão de crédito para os formandos e a loja"
              aoAlternar={alternar}
              desabilitado={configurar.isPending}
            />
          </div>
        ) : null}
      </div>

      <p className="text-muted-foreground text-sm">
        {ligado
          ? `${
              cartao.taxa_repassada === null
                ? 'A turma absorve a taxa do cartão.'
                : `Quem paga no cartão paga ${formatarPercentual(cartao.taxa_repassada)} a mais — a taxa do cartão.`
            } Ligado${cartao.ligado_por ? ` por ${cartao.ligado_por}` : ''} em ${formatarData(cartao.ligado_em)}.`
          : 'Ao ligar esta opção, os formandos poderão pagar uma ou várias parcelas em até 12 vezes. Quem compra na loja também poderá pagar os convites no cartão. A confirmação será automática.'}
      </p>

      {!cartao.disponivel && escreve ? (
        <p className="text-muted-foreground text-sm">
          Para ligar o cartão, o Presidente conecta a conta de novo em <strong>Trocar de conta</strong> — a
          conexão atual é de antes do cartão.
        </p>
      ) : null}

      <DialogoDeFormulario
        aberto={ligando}
        aoFechar={() => definirLigando(false)}
        titulo={ligado ? 'Editar o cartão' : 'Ligar o cartão?'}
        descricao="O dinheiro cai na conta Mercado Pago da turma, com a taxa do cartão descontada."
      >
        <FormularioDeLigar cartao={cartao} aoConcluir={() => definirLigando(false)} />
      </DialogoDeFormulario>
    </section>
  )
}

/** O que a turma aceita ao ligar, e quem paga a taxa. */
function FormularioDeLigar({ cartao, aoConcluir }: { cartao: Cartao; aoConcluir: () => void }) {
  const configurar = useConfigurarCartao()
  const formulario = useForm<FormularioDoCartao>({
    resolver: zodResolver(esquemaDoCartao),
    defaultValues: {
      quemPaga: cartao.taxa_repassada === null ? 'turma' : 'pagador',
      taxa:
        cartao.taxa_repassada === null
          ? TAXA_SUGERIDA
          : formatarPercentual(cartao.taxa_repassada).replace('%', ''),
    },
  })
  const quemPaga = useWatch({ control: formulario.control, name: 'quemPaga' })

  const enviar = formulario.handleSubmit((valores) =>
    configurar.mutate(paraConfiguracao(valores), {
      onSuccess: () => {
        toast.success(cartao.ligado_em ? 'Cartão salvo.' : 'Cartão ligado. A opção já aparece para a turma.')
        aoConcluir()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="bg-warning-bg text-foreground flex gap-3 rounded-2xl p-4 text-sm">
          <TriangleAlert className="text-warning-text mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="grid gap-1">
            <p className="font-medium">Contestação no cartão</p>
            <p>
              Quem pagou pode contestar a compra no banco meses depois. O Mercado Pago tira o dinheiro da
              conta da turma, e o Kapa desfaz o pagamento sozinho: a parcela volta a ficar em aberto — ou o
              convite da loja é cancelado — e a comissão recebe um e-mail.
            </p>
          </div>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-foreground mb-2 text-sm font-medium">Quem paga a taxa do cartão?</legend>
          <div className="flex flex-wrap gap-2">
            <Chip ativo={quemPaga === 'turma'} onClick={() => formulario.setValue('quemPaga', 'turma')}>
              A turma
            </Chip>
            <Chip ativo={quemPaga === 'pagador'} onClick={() => formulario.setValue('quemPaga', 'pagador')}>
              Quem paga no cartão
            </Chip>
          </div>
          <p className="text-muted-foreground text-sm">
            {quemPaga === 'turma'
              ? 'O cartão cobra o mesmo valor do PIX, e a taxa sai do que a turma recebe.'
              : 'O cartão cobra a mais para a turma receber o valor inteiro. A tela mostra os dois valores antes de pagar.'}
          </p>
        </fieldset>

        {quemPaga === 'pagador' ? (
          <FormField
            control={formulario.control}
            name="taxa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taxa do cartão (%)</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="decimal" className="max-w-40" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <p className="text-muted-foreground text-sm">
          A taxa é a do Mercado Pago: cerca de 4,98% com o dinheiro na hora, ou 3,98% em 30 dias. Quem escolhe
          o prazo é a turma, nas configurações da própria conta do Mercado Pago. As parcelas do cartão têm
          juros do Mercado Pago, pagos por quem parcela: a turma recebe o valor cheio.
        </p>

        <ErroDoFormulario />
        <AcoesDoFormulario
          aoCancelar={aoConcluir}
          ocupado={configurar.isPending}
          rotulo={cartao.ligado_em ? 'Salvar' : 'Ligar cartão'}
          rotuloOcupado={cartao.ligado_em ? 'Salvando…' : 'Ligando…'}
        />
      </form>
    </Form>
  )
}
