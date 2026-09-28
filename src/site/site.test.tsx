import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { redirecionamentos } from './redirecionamentos'
import { renderizar } from './servidor'

describe('redirecionamentos do site', () => {
  const regras = redirecionamentos().trim().split('\n')

  it('manda caminho do app para o app., no mesmo caminho, com 301', () => {
    expect(regras).toContain(`/inicio ${env.VITE_APP_URL}/inicio 301`)
    expect(regras).toContain(`/login ${env.VITE_APP_URL}/login 301`)
    expect(regras).toContain(`/loja/* ${env.VITE_APP_URL}/loja/:splat 301`)
  })

  it('cobre a rota aninhada pela raiz, sem uma regra por rota', () => {
    expect(regras).toContain(`/cobrancas/* ${env.VITE_APP_URL}/cobrancas/:splat 301`)
    expect(regras.some((regra) => regra.startsWith('/cobrancas/parcelas'))).toBe(false)
  })

  it('não tira do site a institucional nem os documentos legais', () => {
    const origens = regras.filter((regra) => regra.endsWith('301')).map((regra) => regra.split(' ')[0])

    for (const doSite of ['/', '/termos-de-uso', '/privacidade', '/operadores']) {
      expect(origens).not.toContain(doSite)
    }
    expect(regras).toContain('/termos-de-uso/* /termos-de-uso 200')
  })

  it('cabe no limite de 100 regras dinâmicas do Pages', () => {
    expect(regras.filter((regra) => regra.includes('*')).length).toBeLessThanOrEqual(100)
  })
})

describe('pré-renderização do site', () => {
  it('entrega o texto da landing no HTML, com o CTA apontando para o app', async () => {
    const html = await renderizar('/')

    expect(html).toContain('Criar minha turma')
    expect(html).toContain(`href="${env.VITE_APP_URL}/criar-conta"`)
    expect(html).toContain(`href="${env.VITE_APP_URL}/login"`)
  })

  it('entrega a casca do documento, que carrega o texto da API no navegador', async () => {
    const html = await renderizar('/termos-de-uso/2')

    expect(html).toContain('aria-label="Kapa — página inicial"')
    expect(html).not.toContain('Página não encontrada')
  })

  it('entrega o 404 para caminho que não é do site', async () => {
    expect(await renderizar('/nao-existe')).toContain('Página não encontrada')
  })
})
