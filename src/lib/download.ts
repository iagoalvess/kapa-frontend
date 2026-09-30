import { avisarErro } from '@/lib/http/erros'

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

/** Tipos que o navegador abre sozinho: vão para uma aba. O resto (Word, Excel) baixa com o nome original. */
const ABRE_NO_NAVEGADOR = /^(application\/pdf|image\/)/

/**
 * Diz se o navegador mostra o arquivo sozinho (PDF, imagem) — e aí ele vai para uma aba, em vez de
 * baixar.
 *
 * @param contentType O tipo do arquivo, como a API o gravou.
 */
export function abreNoNavegador(contentType: string) {
  return ABRE_NO_NAVEGADOR.test(contentType)
}

/**
 * Mostra o arquivo numa aba já aberta. Sem aba (o navegador bloqueou), não faz nada.
 *
 * A aba precisa nascer **antes** da ida ao servidor (`window.open('', '_blank')`): aberta depois,
 * o navegador a trata como pop-up e bloqueia. O endereço é revogado depois de a aba ter tido tempo
 * de ler o blob — sem isso, cada comprovante aberto ficava na memória da página até ela fechar.
 *
 * @param arquivo Os bytes, como vieram da API.
 * @param aba Aba aberta antes da requisição.
 */
export function abrirNaAba(arquivo: Blob, aba: Window | null) {
  if (!aba) return

  const endereco = URL.createObjectURL(arquivo)
  aba.location.href = endereco
  setTimeout(() => URL.revokeObjectURL(endereco), 60_000)
}

/**
 * Abre o arquivo numa aba já aberta, ou o baixa com o nome original.
 *
 * @param arquivo Os bytes.
 * @param nome Nome sugerido quando não há aba.
 * @param aba Aba aberta antes da requisição (ver {@link abrirNaAba}); nula para sempre baixar.
 */
export function abrirOuBaixar(arquivo: Blob, nome: string, aba: Window | null) {
  if (aba) abrirNaAba(arquivo, aba)
  else baixarArquivo(arquivo, nome)
}

/** A mutação que traz os bytes do arquivo — o `mutate` de um `useMutation` que devolve `Blob`. */
interface BuscaDeArquivo<V> {
  mutate: (
    variavel: V,
    retorno: { onSuccess: (arquivo: Blob) => void; onError: (erro: Error) => void },
  ) => void
}

/**
 * Abre a aba, busca o arquivo e o mostra nela; na falha, fecha a aba e avisa o erro.
 *
 * Com `baixarComo`, só PDF e imagem vão para a aba — o resto baixa com o nome original.
 *
 * @param busca A mutação que traz os bytes.
 * @param variavel O que a mutação recebe (em geral, o id).
 * @param baixarComo Nome e tipo do arquivo, quando ele pode não abrir no navegador.
 */
export function abrirEmNovaAba<V>(
  busca: BuscaDeArquivo<V>,
  variavel: V,
  baixarComo?: { nome: string; contentType: string },
) {
  const aba = !baixarComo || abreNoNavegador(baixarComo.contentType) ? window.open('', '_blank') : null
  busca.mutate(variavel, {
    onSuccess: (arquivo) =>
      baixarComo ? abrirOuBaixar(arquivo, baixarComo.nome, aba) : abrirNaAba(arquivo, aba),
    onError: (erro) => {
      aba?.close()
      avisarErro(erro)
    },
  })
}
