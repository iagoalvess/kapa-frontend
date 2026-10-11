/** Contrato mínimo do Google Identity Services, sem One Tap nem permissões adicionais. */
export interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (opcoes: {
        client_id: string
        nonce: string
        callback: (resposta: { credential: string }) => void
        auto_select: false
      }) => void
      renderButton: (
        elemento: HTMLElement,
        opcoes: {
          type: 'standard'
          theme: 'outline'
          size: 'large'
          text: 'continue_with'
          shape: 'rectangular'
          logo_alignment: 'center'
          locale: 'pt-BR'
          width: string
        },
      ) => void
    }
  }
}
declare global {
  interface Window {
    google?: GoogleIdentity
  }
}
let carregamento: Promise<GoogleIdentity> | undefined

/** Carrega o SDK oficial sob demanda e permite repetir depois de falha de rede. */
export function carregarGoogle(): Promise<GoogleIdentity> {
  if (window.google) return Promise.resolve(window.google)
  if (carregamento) return carregamento
  carregamento = new Promise((resolver, rejeitar) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    const prazo = setTimeout(() => falhar(), 15000)
    const falhar = () => {
      clearTimeout(prazo)
      script.remove()
      carregamento = undefined
      rejeitar(new Error('Não foi possível carregar o Google. Tente novamente ou continue com e-mail.'))
    }
    script.addEventListener('error', falhar, { once: true })
    script.addEventListener(
      'load',
      () => {
        clearTimeout(prazo)
        if (window.google) resolver(window.google)
        else falhar()
      },
      { once: true },
    )
    document.head.append(script)
  })
  return carregamento
}
