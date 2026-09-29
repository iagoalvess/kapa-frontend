import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import { BarraInferior } from './BarraInferior'

const API = `${env.VITE_API_URL}/api/v1`

function comApi({ vencidas = 0, aConferir = 0 } = {}) {
  servidor.use(
    http.get(`${API}/extrato/eu/pendencias`, () => HttpResponse.json({ vencidas_sem_aviso: vencidas })),
    http.get(`${API}/informes`, () => HttpResponse.json({ itens: [], total: aConferir })),
  )
}

/** Os destinos da barra, na ordem, com o caminho de cada um — e o "Mais" no fim. */
function destinos() {
  const barra = within(screen.getByRole('navigation', { name: 'Atalhos' }))
  return [
    ...barra.getAllByRole('link').map((link) => `${link.textContent} ${link.getAttribute('href')}`),
    ...barra.getAllByRole('button').map((botao) => botao.textContent),
  ]
}

describe('BarraInferior', () => {
  afterEach(() => sessao.encerrar())

  it('leva o formando a Início, Parcelas, Mural e Agenda', () => {
    entrarComo('Formando')
    comApi()

    renderizar(<BarraInferior aoAbrirMais={() => {}} />)

    expect(destinos()).toEqual([
      'Início /inicio',
      'Parcelas /minhas-parcelas',
      'Mural /mural',
      'Agenda /agenda',
      'Mais',
    ])
  })

  it('leva a tesouraria a Início, Conferir, Caixa e Mural', () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<BarraInferior aoAbrirMais={() => {}} />)

    expect(destinos()).toEqual([
      'Início /inicio',
      'Conferir /financeiro/conferencia',
      'Caixa /financeiro/caixa',
      'Mural /mural',
      'Mais',
    ])
  })

  it('dá à comissão, que não confere, a lista de parcelas da turma no lugar de Conferir', () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<BarraInferior aoAbrirMais={() => {}} />)

    expect(destinos()).toEqual([
      'Início /inicio',
      'Parcelas /cobrancas/parcelas',
      'Caixa /financeiro/caixa',
      'Mural /mural',
      'Mais',
    ])
  })

  it('deixa a quem foi desligado só o que é dele', () => {
    const corpo = {
      sub: 'u-9',
      name: 'Pedro',
      email: 'pedro@kapa.dev',
      role: [PERFIS.usuario],
      formatura_id: 'f-1',
      papel: 'Tesoureiro',
      desligado_em: '2026-09-16T12:00:00Z',
    }
    sessao.autenticar({
      access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
      expira_em: new Date(Date.now() + 900_000).toISOString(),
    })
    comApi()

    renderizar(<BarraInferior aoAbrirMais={() => {}} />)

    expect(destinos()).toEqual(['Início /inicio', 'Parcelas /minhas-parcelas', 'Mais'])
  })

  it('marca a parcela vencida no destino e acende o Mais fora dos quatro', async () => {
    entrarComo('Formando')
    comApi({ vencidas: 2 })

    renderizar(<BarraInferior aoAbrirMais={() => {}} />, '/documentos')

    expect(await screen.findByRole('link', { name: /^Parcelas\s*vencidas$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mais' })).toHaveClass('text-brand-text')
  })

  it('abre a folha pelo Mais', async () => {
    entrarComo('Formando')
    comApi()
    const aoAbrirMais = vi.fn<() => void>()

    renderizar(<BarraInferior aoAbrirMais={aoAbrirMais} />, '/inicio')

    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Mais' })).not.toHaveClass('text-brand-text')
    await userEvent.click(screen.getByRole('button', { name: 'Mais' }))
    expect(aoAbrirMais).toHaveBeenCalledOnce()
  })
})
