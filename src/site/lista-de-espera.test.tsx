import { describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { redirecionamentos } from './redirecionamentos'
import { PAGINAS } from './paginas'
import { renderizar } from './servidor'

// A build do site com a lista de espera ligada (Sprint 36). O `env` é lido na carga dos módulos, por
// isso o mock no arquivo inteiro — o `site.test.tsx` cobre o modo desligado.
vi.mock('@/config/env', async (original) => {
  const { env: real } = await original<{ env: object }>()
  return { env: { ...real, VITE_LISTA_DE_ESPERA: true, VITE_TURNSTILE_SITE_KEY: '1x00000000000000000000AA' } }
})

describe('site com a lista de espera ligada', () => {
  it('leva "Criar minha turma" ao formulário e troca "Entrar" pelo e-mail, sem link para o app nem preços', async () => {
    const html = await renderizar('/')

    expect(html).toContain('href="#lista-de-espera"')
    expect(html).toContain('href="mailto:contato@kapaformaturas.com.br"')
    expect(html).not.toContain('>Entrar<')
    expect(html).not.toContain('/criar-conta')
    expect(html).not.toContain(env.VITE_APP_URL)
    expect(html).not.toContain('#planos')
  })

  it('tira Termos e Operadores e serve a Política resumida em /privacidade', async () => {
    expect(PAGINAS.map((pagina) => pagina.caminho)).toEqual(['/', '/privacidade'])
    expect(await renderizar('/termos-de-uso')).toContain('Página não encontrada')
    expect(await renderizar('/privacidade')).toContain('Versão 2')
    expect(await renderizar('/')).toContain('href="/privacidade"')
    expect(await renderizar('/')).not.toContain('href="/termos-de-uso"')
  })

  it('não redireciona para o app, que não está no ar', () => {
    expect(redirecionamentos()).toBe('')
  })
})
