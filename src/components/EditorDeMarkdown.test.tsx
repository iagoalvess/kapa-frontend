import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { aplicarFormato, EditorDeMarkdown } from './EditorDeMarkdown'

function Editor({ inicial = '' }: { inicial?: string }) {
  const [texto, definirTexto] = useState(inicial)
  return (
    <EditorDeMarkdown
      aria-label="Texto"
      value={texto}
      onChange={definirTexto}
      rotuloDaPrevia="Prévia do aviso"
    />
  )
}

describe('aplicarFormato', () => {
  it('negrito envolve a seleção e a mantém selecionada', () => {
    expect(aplicarFormato('reunião na quinta', 11, 17, 'negrito')).toEqual({
      texto: 'reunião na **quinta**',
      inicio: 13,
      fim: 19,
    })
  })

  it('sem seleção, negrito entra com um exemplo pronto para digitar por cima', () => {
    const resultado = aplicarFormato('', 0, 0, 'negrito')

    expect(resultado.texto).toBe('**texto em negrito**')
    expect(resultado.texto.slice(resultado.inicio, resultado.fim)).toBe('texto em negrito')
  })

  it('link deixa o endereço selecionado', () => {
    const resultado = aplicarFormato('veja o contrato', 7, 15, 'link')

    expect(resultado.texto).toBe('veja o [contrato](https://)')
    expect(resultado.texto.slice(resultado.inicio, resultado.fim)).toBe('https://')
  })

  it('lista e título valem por linha, uma vez só', () => {
    const texto = 'buffet\n- banda\nfoto'

    expect(aplicarFormato(texto, 0, texto.length, 'lista').texto).toBe('- buffet\n- banda\n- foto')
    expect(aplicarFormato('pauta\nitem', 8, 8, 'titulo').texto).toBe('pauta\n## item')
  })
})

describe('EditorDeMarkdown', () => {
  it('o botão de negrito formata o texto selecionado', async () => {
    render(<Editor inicial="quinta" />)
    const campo = screen.getByRole('textbox', { name: 'Texto' })

    ;(campo as HTMLTextAreaElement).setSelectionRange(0, 6)
    await userEvent.click(screen.getByRole('button', { name: 'Negrito' }))

    expect(campo).toHaveValue('**quinta**')
  })

  /** Critério de aceite: markdown com `<script>` sai sanitizado na prévia. */
  it('a prévia neutraliza script e HTML colados no texto', async () => {
    render(<Editor />)

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Texto' }),
      'Oi **turma** <script>window.__xss = 1</script><img src=x onerror="window.__xss = 1">',
    )

    const previa = screen.getByRole('region', { name: 'Prévia do aviso' })
    expect(within(previa).getByText('turma').tagName).toBe('STRONG')
    expect(previa.querySelector('script, img')).toBeNull()
    expect(window).not.toHaveProperty('__xss')
  })

  it('no celular, as abas alternam entre escrever e ver a prévia', async () => {
    render(<Editor inicial="# Festa" />)

    await userEvent.click(screen.getByRole('tab', { name: 'Prévia' }))

    expect(screen.getByRole('tab', { name: 'Prévia' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: 'Festa' })).toBeInTheDocument()
  })
})
