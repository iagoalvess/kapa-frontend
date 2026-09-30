import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { PainelDaCota as Painel } from '@/types/festa'
import { PainelDaCota } from './PainelDaCota'

const COTA = `${env.VITE_API_URL}/api/v1/festa/colacao/cota`

const painel = (partes: Partial<Painel> = {}): Painel => ({
  evento: {
    id: 'ev-colacao',
    tipo: 'Colacao',
    titulo: 'Colação de grau',
    data: '2027-12-10',
    hora: '19:00:00',
    local: 'Teatro Guaíra',
    completo: true,
    fechamento_da_lista: '2027-12-09T22:00:00Z',
    janela_abre_em: '2027-12-10T16:00:00Z',
  },
  cota_por_formando: 2,
  capacidade: 100,
  aberta_em: null,
  formandos_ativos: 60,
  cortesias: 3,
  lugares: 123,
  excedente: 23,
  emitidos: 0,
  nomeados: 0,
  sem_nome: 0,
  ...partes,
})

describe('PainelDaCota', () => {
  beforeEach(() => entrarComo('Comissao'))
  afterEach(() => sessao.encerrar())

  it('mostra a conta, avisa que passa da capacidade e deixa abrir mesmo assim (decisão 3)', async () => {
    let atual = painel()
    servidor.use(
      http.get(COTA, () => HttpResponse.json(atual)),
      http.post(`${COTA}/abrir`, () => {
        atual = painel({ aberta_em: '2027-09-23T12:00:00Z', emitidos: 120, nomeados: 0, sem_nome: 120 })
        return HttpResponse.json(atual)
      }),
    )
    renderizar(<PainelDaCota editavel />)

    expect(await screen.findByText(/60 formandos × 2 \+ 3 cortesias = 123/)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Passa da capacidade em 23 lugares')

    await userEvent.click(screen.getByRole('button', { name: 'Abrir cota' }))

    expect(await screen.findByText('120 emitidos · 0 nomeados · 120 sem nome')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reabrir cota' })).toBeInTheDocument()
  })

  it('sem hora ou local na colação, não deixa abrir', async () => {
    servidor.use(
      http.get(COTA, () => HttpResponse.json(painel({ evento: { ...painel().evento, completo: false } }))),
    )
    renderizar(<PainelDaCota editavel />)

    expect(await screen.findByRole('button', { name: 'Abrir cota' })).toBeDisabled()
    expect(screen.getByText(/precisa de hora e local/)).toBeInTheDocument()
  })

  it('diminuir a cota depois de aberta volta com o erro da API no formulário', async () => {
    servidor.use(
      http.get(COTA, () => HttpResponse.json(painel({ aberta_em: '2027-09-23T12:00:00Z' }))),
      http.put(COTA, () =>
        HttpResponse.json(
          { codigo: 'festa.cota_ja_aberta', detail: 'Depois de aberta, a cota só aumenta.' },
          { status: 409 },
        ),
      ),
    )
    renderizar(<PainelDaCota editavel />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const campo = screen.getByRole('textbox', { name: 'Convites por formando' })
    await userEvent.clear(campo)
    await userEvent.type(campo, '1')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Depois de aberta, a cota só aumenta.')).toBeInTheDocument()
  })

  it('para quem só lê, mostra a conta sem editar nem abrir', async () => {
    servidor.use(http.get(COTA, () => HttpResponse.json(painel({ excedente: 0, capacidade: null }))))
    renderizar(<PainelDaCota editavel={false} />)

    expect(await screen.findByText('Não informado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Abrir cota' })).not.toBeInTheDocument()
  })
})
