import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { PainelDeConvites as Painel } from '@/types/festa'
import { PainelDeConvites } from './PainelDeConvites'

const PAINEL = `${env.VITE_API_URL}/api/v1/festa/painel-de-convites`

const painel = (partes: Partial<Painel> = {}): Painel => ({
  evento: {
    id: 'ev-festa',
    tipo: 'Festa',
    titulo: 'Festa de formatura',
    data: '2027-12-10',
    hora: '22:00:00',
    local: 'Salão Nobre',
    completo: true,
    fechamento_da_lista: '2027-12-09T22:00:00Z',
    janela_abre_em: '2027-12-10T19:00:00Z',
  },
  capacidade: 100,
  formandos_ativos: 8,
  beneficios: 110,
  extras: 4,
  cortesias: 3,
  lugares: 117,
  excedente: 17,
  emitidos: 110,
  nomeados: 30,
  sem_nome: 80,
  presos: [],
  ...partes,
})

describe('PainelDeConvites', () => {
  beforeEach(() => entrarComo('Comissao'))
  afterEach(() => sessao.encerrar())

  it('soma os convites dos pacotes, os extras e as cortesias, e avisa que passa da capacidade', async () => {
    servidor.use(http.get(PAINEL, () => HttpResponse.json(painel())))
    renderizar(<PainelDeConvites tipo="Festa" editavel />)

    expect(await screen.findByText('110 + 4 extras + 3 cortesias = 117')).toBeInTheDocument()
    expect(screen.getByText('110 convites para 8 formandos')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Passa da capacidade em 17 lugares')
    expect(screen.queryByRole('button', { name: /Abrir/ })).not.toBeInTheDocument()
  })

  it('lista quem está preso por atraso e libera os convites dele (D24)', async () => {
    let liberado: string | undefined
    servidor.use(
      http.get(PAINEL, () =>
        HttpResponse.json(
          painel({ presos: liberado ? [] : [{ vinculo_id: 'v-1', nome: 'Ana Souza', convites: 15 }] }),
        ),
      ),
      http.post(`${PAINEL}/presos/:vinculo/liberacao`, ({ params }) => {
        liberado = String(params.vinculo)
        return HttpResponse.json({ liberados: 15 })
      }),
    )
    renderizar(<PainelDeConvites tipo="Festa" editavel />)

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Liberar' }))

    expect(liberado).toBe('v-1')
    expect(await screen.findByText('110 convites para 8 formandos')).toBeInTheDocument()
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
  })

  it('grava a capacidade pelo diálogo', async () => {
    let enviado: unknown
    servidor.use(
      http.get(PAINEL, () => HttpResponse.json(painel())),
      http.put(`${PAINEL}/capacidade`, async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json(painel({ capacidade: 150, excedente: 0 }))
      }),
    )
    renderizar(<PainelDeConvites tipo="Festa" editavel />)

    await userEvent.click(await screen.findByRole('button', { name: 'Capacidade' }))
    const campo = screen.getByRole('textbox', { name: 'Lugares no local' })
    await userEvent.clear(campo)
    await userEvent.type(campo, '150')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('150 lugares')).toBeInTheDocument()
    expect(enviado).toEqual({ capacidade: 150 })
  })

  it('para quem só lê, mostra a conta sem editar nem liberar', async () => {
    servidor.use(
      http.get(PAINEL, () =>
        HttpResponse.json(
          painel({
            excedente: 0,
            capacidade: null,
            presos: [{ vinculo_id: 'v-1', nome: 'Ana Souza', convites: 15 }],
          }),
        ),
      ),
    )
    renderizar(<PainelDeConvites tipo="Colacao" editavel={false} />)

    expect(await screen.findByText('Não informado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Convites da colação' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Capacidade' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Liberar' })).not.toBeInTheDocument()
  })
})
