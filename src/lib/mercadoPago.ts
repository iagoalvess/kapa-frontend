import type { CartaoTokenizado } from '@/types/pagamento'

/**
 * O SDK do Mercado Pago, carregado do servidor deles — é exigência do Mercado Pago (PCI): o número do cartão é
 * digitado em campos servidos por eles, e o Kapa só recebe o token. Por isso não é dependência do npm, e a
 * CSP de produção libera os domínios do Mercado Pago (`borda/_headers`).
 */
const SDK = 'https://sdk.mercadopago.com/js/v2'

/** O formulário montado: desmontar libera os campos seguros. */
export interface FormularioMontado {
  unmount: () => void
}

/** O que o Card Payment Brick entrega no envio — só o que o Kapa lê. */
interface DadosDoBrick {
  token: string
  payment_method_id: string
  installments: number
}

interface SdkDoMercadoPago {
  bricks: () => {
    create: (tipo: 'cardPayment', container: string, configuracao: unknown) => Promise<FormularioMontado>
  }
}

declare global {
  interface Window {
    MercadoPago?: new (chavePublica: string, opcoes: { locale: string }) => SdkDoMercadoPago
  }
}

let carregando: Promise<void> | undefined

/** Carrega o SDK uma vez por página; a segunda tela de cartão reaproveita. */
function carregarSdk() {
  if (globalThis.window.MercadoPago) return Promise.resolve()

  carregando ??= new Promise<void>((resolver, rejeitar) => {
    const script = document.createElement('script')
    script.src = SDK
    script.async = true
    script.addEventListener('load', () => resolver(), { once: true })
    script.addEventListener(
      'error',
      () => {
        carregando = undefined
        script.remove()
        rejeitar(new Error('Não deu para carregar o formulário do Mercado Pago.'))
      },
      { once: true },
    )
    document.head.append(script)
  })

  return carregando
}

/**
 * Monta o formulário de cartão do Mercado Pago (Card Payment Brick) no elemento de id `container`.
 *
 * O valor vai em reais, que é o que o formulário mostra e usa para calcular as parcelas com os juros de quem paga
 * (P3). O envio devolve a promessa de quem chamou: enquanto ela não resolve, o botão do formulário fica ocupado;
 * rejeitada, ele volta a aceitar — outro cartão, por exemplo.
 *
 * @param opcoes Onde montar, com que chave, quanto e o que fazer no envio.
 * @returns O formulário, para desmontar ao sair da tela.
 */
export async function montarFormularioDeCartao({
  container,
  chavePublica,
  valorEmCentavos,
  maximoDeParcelas,
  aoEnviar,
  aoFicarPronto,
}: {
  container: string
  chavePublica: string
  valorEmCentavos: number
  maximoDeParcelas: number
  aoEnviar: (cartao: CartaoTokenizado) => Promise<unknown>
  aoFicarPronto: () => void
}) {
  await carregarSdk()

  const MercadoPago = globalThis.window.MercadoPago
  if (!MercadoPago) throw new Error('O formulário do Mercado Pago não carregou.')

  return new MercadoPago(chavePublica, { locale: 'pt-BR' }).bricks().create('cardPayment', container, {
    initialization: { amount: valorEmCentavos / 100 },
    customization: {
      paymentMethods: {
        maxInstallments: maximoDeParcelas,
        // Só crédito: o Kapa cobra como `credit_card`, e débito aqui seria recusado depois de digitado.
        types: { excluded: ['debit_card'] },
      },
      visual: { style: { theme: 'default' }, texts: { formTitle: 'Cartão de crédito' } },
    },
    callbacks: {
      onReady: aoFicarPronto,
      onSubmit: (dados: DadosDoBrick) =>
        aoEnviar({ token: dados.token, bandeira: dados.payment_method_id, parcelas: dados.installments }),
      // O formulário mostra os próprios erros de preenchimento; o que chega aqui é dele, não do Kapa.
      onError: () => undefined,
    },
  })
}
