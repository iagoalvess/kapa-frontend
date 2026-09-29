interface ConfiguracaoDoBrick {
  initialization: { amount: number }
  callbacks: {
    onReady: () => void
    onSubmit: (dados: { token: string; payment_method_id: string; installments: number }) => Promise<unknown>
  }
}

/**
 * O SDK do Mercado Pago de mentira: o jsdom não carrega o script de fora, e o formulário de cartão de verdade é
 * deles. Monta na hora e deixa o teste enviar o que o formulário enviaria. Fica na janela até o próximo teste
 * trocar — o jsdom é de cada arquivo.
 *
 * @returns O envio do formulário, a chave pública e o valor com que ele foi montado.
 */
export function simularMercadoPago() {
  const montado: { configuracao?: ConfiguracaoDoBrick; chavePublica?: string } = {}

  globalThis.window.MercadoPago = class {
    constructor(chavePublica: string) {
      montado.chavePublica = chavePublica
    }

    bricks() {
      return {
        create: async (_tipo: 'cardPayment', _container: string, configuracao: unknown) => {
          montado.configuracao = configuracao as ConfiguracaoDoBrick
          montado.configuracao.callbacks.onReady()
          return { unmount: () => undefined }
        },
      }
    }
  }

  return {
    /** O que o comprador faria clicando em "Pagar" no formulário. */
    enviar: (token: string, bandeira = 'visa', parcelas = 1) =>
      montado.configuracao!.callbacks.onSubmit({
        token,
        payment_method_id: bandeira,
        installments: parcelas,
      }),
    chavePublica: () => montado.chavePublica,
    valorEmReais: () => montado.configuracao?.initialization.amount,
  }
}
