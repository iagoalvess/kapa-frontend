import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextoEmMarkdown } from './TextoEmMarkdown'

/** Payloads conhecidos de XSS por markdown — o risco da Sprint 11. */
const PAYLOADS = [
  '<script>window.__xss = true</script>',
  '<img src=x onerror="window.__xss = true">',
  '<a href="javascript:window.__xss=true">clique</a>',
  '<iframe src="https://exemplo.com"></iframe>',
  '[clique](javascript:window.__xss=true)',
  '[imagem](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
]

describe('TextoEmMarkdown', () => {
  it('renderiza títulos, listas e tabelas do markdown', () => {
    render(
      <TextoEmMarkdown
        conteudo={
          '# Termos\n\n## 1. Seção\n\n- um\n- dois\n\n| Finalidade | Base legal |\n| --- | --- |\n| Conta | Contrato |'
        }
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Termos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '1. Seção' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('cell', { name: 'Contrato' })).toBeInTheDocument()
  })

  /** O texto vem do banco: marcação tem de virar texto, nunca HTML executável. */
  it('não interpreta HTML embutido', () => {
    render(<TextoEmMarkdown conteudo={'Operada por **Kapa** <img src=x onerror=alert(1)>'} />)

    expect(screen.getByText('Kapa').tagName).toBe('STRONG')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it.each(PAYLOADS)('neutraliza o payload %s', (payload) => {
    const { container } = render(<TextoEmMarkdown conteudo={`Aviso\n\n${payload}\n\nFim`} />)

    expect(container.querySelector('script, iframe, img, [onerror]')).toBeNull()
    for (const link of container.querySelectorAll('a')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/^(javascript|data):/i)
    }
    expect(window).not.toHaveProperty('__xss')
    expect(screen.getByText('Fim')).toBeInTheDocument()
  })

  it('abre links em nova aba', () => {
    render(<TextoEmMarkdown conteudo="Veja [a ANPD](https://www.gov.br/anpd)." />)

    expect(screen.getByRole('link', { name: 'a ANPD' })).toHaveAttribute('target', '_blank')
  })

  it('no resumo, título vira frase e link vira texto', () => {
    render(<TextoEmMarkdown variante="resumo" conteudo={'# Festa\n\nVeja [o contrato](https://kapa.dev).'} />)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Festa')).toBeInTheDocument()
  })
})
