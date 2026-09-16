import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { baixarArquivo } from './download'

/**
 * O que o navegador precisa para de fato baixar: o link no documento na hora do clique e o endereço
 * ainda válido depois dele.
 *
 * Revogar na linha seguinte ao clique cancelava o download no Chrome — o relatório ficava pronto, o
 * aviso virava e o arquivo nunca aparecia na pasta de Downloads.
 */
describe('baixarArquivo', () => {
  const criados: string[] = []
  const revogados: string[] = []
  let noDocumentoAoClicar: boolean | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    criados.length = 0
    revogados.length = 0
    noDocumentoAoClicar = undefined

    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      const endereco = `blob:prova/${criados.length}`
      criados.push(endereco)

      return endereco
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((endereco) => void revogados.push(endereco))
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      noDocumentoAoClicar = document.body.contains(this)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('clica com o link dentro do documento', () => {
    baixarArquivo(new Blob(['x']), 'balancete.pdf')

    expect(noDocumentoAoClicar).toBe(true)
  })

  it('não deixa o link para trás no documento', () => {
    baixarArquivo(new Blob(['x']), 'balancete.pdf')

    expect(document.querySelector('a[download]')).toBeNull()
  })

  it('só revoga o endereço depois de o navegador ter tido tempo de ler o blob', () => {
    baixarArquivo(new Blob(['x']), 'balancete.pdf')

    expect(revogados).toEqual([])

    vi.runAllTimers()

    expect(revogados).toEqual(criados)
  })
})
