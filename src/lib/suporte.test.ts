import { afterEach, describe, expect, it } from 'vitest'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { entrarComo } from '@/test/utils'
import { linkDeSuporte } from './suporte'

/** O corpo do e-mail (o `searchParams` já decodifica). */
const corpo = (link: string) => new URL(link).searchParams.get('body') ?? ''

describe('linkDeSuporte', () => {
  afterEach(() => sessao.encerrar())

  /** O suporte não deveria ter de perguntar onde a pessoa estava: turma, papel e página vão no rodapé. */
  it('escreve no corpo a página, a turma e o papel de quem pede', () => {
    entrarComo(PAPEIS.tesoureiro)
    globalThis.history.pushState({}, '', '/cobrancas')

    const link = linkDeSuporte({ codigo: '0HN7:00000001' })

    expect(link).toMatch(/^mailto:suporte@kapaformaturas\.com\.br\?/)
    expect(new URL(link).searchParams.get('subject')).toBe('[Problema] Erro 0HN7:00000001')
    expect(corpo(link)).toContain('Página: /cobrancas')
    expect(corpo(link)).toContain(`Papel: ${PAPEIS.tesoureiro}`)
    expect(corpo(link)).toContain('Código do erro: 0HN7:00000001')
  })

  /** A marca no assunto é o que a caixa do suporte filtra. */
  it.each([
    ['duvida', '[Dúvida] Kapa'],
    ['problema', '[Problema] Kapa'],
    ['sugestao', '[Sugestão] Kapa'],
  ] as const)('marca o assunto do pedido do tipo %s', (tipo, assunto) => {
    const link = linkDeSuporte({ tipo })

    expect(new URL(link).searchParams.get('subject')).toBe(assunto)
    expect(corpo(link)).not.toContain('Código do erro')
  })
})
