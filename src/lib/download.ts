/**
 * Entrega um arquivo ao navegador, com o nome certo na pasta de Downloads.
 *
 * Link direto para a API não serviria: o token vive em memória, e um `href` não o manda. Os bytes
 * vêm pelo cliente HTTP e saem por um `<a download>` temporário.
 *
 * O link **entra no documento** antes do clique e o endereço só é revogado depois: clicar num
 * elemento solto não baixa nada no Firefox, e revogar na linha seguinte ao clique cancela o
 * download no Chrome — o navegador ainda não leu o blob quando o endereço deixa de existir. Era o
 * relatório que ficava "gerando" para sempre: o PDF ficava pronto, o toast virava, e o arquivo
 * nunca aparecia.
 *
 * @param arquivo Os bytes, como vieram da API.
 * @param nome Nome sugerido, com extensão.
 */
export function baixarArquivo(arquivo: Blob, nome: string) {
  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = endereco
  link.download = nome
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  // O clique já entregou o arquivo ao navegador; o endereço só ocupa memória daqui em diante.
  setTimeout(() => URL.revokeObjectURL(endereco), 60_000)
}

/**
 * Abre o arquivo numa aba já aberta, ou o baixa com o nome original.
 *
 * A aba precisa nascer **antes** da ida ao servidor (`window.open('', '_blank')`): aberta depois,
 * o navegador a trata como pop-up e bloqueia.
 *
 * @param arquivo Os bytes.
 * @param nome Nome sugerido quando não há aba.
 * @param aba Aba aberta antes da requisição; nula para sempre baixar.
 */
export function abrirOuBaixar(arquivo: Blob, nome: string, aba: Window | null) {
  const endereco = URL.createObjectURL(arquivo)

  if (aba) {
    aba.location.href = endereco

    return
  }

  const link = document.createElement('a')
  link.href = endereco
  link.download = nome
  link.click()
  // O clique já entregou o arquivo ao navegador; o endereço só ocupa memória daqui em diante.
  setTimeout(() => URL.revokeObjectURL(endereco), 60_000)
}
