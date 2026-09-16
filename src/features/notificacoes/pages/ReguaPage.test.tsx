import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { Regra, Regua } from '../types/notificacoes.types'
import ReguaPage from './ReguaPage'

const REGRAS = `${env.VITE_API_URL}/api/v1/notificacoes/regras`
const HISTORICO = `${env.VITE_API_URL}/api/v1/notificacoes/historico`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/** A faixa lê só o total: a tela pede uma linha e mostra quantos avisos já saíram. */
const historico = () =>
  http.get(HISTORICO, () =>
    HttpResponse.json({ itens: [], pagina: 1, tamanho: 1, total: 12, total_paginas: 12, tem_proxima: true }),
  )

const degrau = (id: string, dias: number, extras: Partial<Regra> = {}): Regra => ({
  id,
  gatilho: 'Vencimento',
  dias_de_deslocamento: dias,
  canal: 'Email',
  assunto: `Assunto ${id}`,
  template: 'Oi, {nome}. São {valor}.',
  ativa: true,
  avisar_tesouraria: false,
  ...extras,
})

const REGUA: Regua = {
  regras: [
    degrau('r-1', -5),
    degrau('r-2', 0),
    degrau('r-3', 3),
    degrau('r-4', 30, { avisar_tesouraria: true }),
    degrau('r-5', 3, { gatilho: 'InformePendente', assunto: '{quantidade} na fila' }),
  ],
  variaveis: ['nome', 'valor', 'vencimento', 'link', 'formatura', 'quantidade'],
  tamanho_maximo: 2000,
  tamanho_maximo_do_assunto: 150,
}

function comApi(aoSalvar?: (corpo: { regras: unknown[] }) => void) {
  servidor.use(
    http.get(REGRAS, () => HttpResponse.json(REGUA)),
    historico(),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
    http.put(REGRAS, async ({ request }) => {
      aoSalvar?.((await request.json()) as { regras: unknown[] })
      return HttpResponse.json(REGUA)
    }),
  )
}

describe('ReguaPage', () => {
  afterEach(() => sessao.encerrar())

  it('lista os degraus na ordem do vencimento, com o assunto e a situação de cada um', async () => {
    entrarComo('Tesoureiro')
    servidor.use(
      http.get(REGRAS, () =>
        HttpResponse.json({ ...REGUA, regras: [degrau('r-2', 0), degrau('r-1', -5, { ativa: false })] }),
      ),
      historico(),
      http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
    )

    renderizar(<ReguaPage />)

    // O lembrete vem antes do vencimento, mesmo tendo chegado depois da API.
    const linhas = await screen.findAllByRole('row')
    expect(linhas[1]).toHaveTextContent('D-5')
    expect(linhas[1]).toHaveTextContent('5 dias antes')
    expect(linhas[1]).toHaveTextContent('Desligado')
    expect(linhas[2]).toHaveTextContent('D0')
    expect(linhas[2]).toHaveTextContent('No dia do vencimento')
    expect(linhas[2]).toHaveTextContent('Ativo')

    // O assunto some da tela quando o editor é a única forma de lê-lo.
    expect(screen.getByText('Assunto r-1')).toBeInTheDocument()
  })

  it('traz a fila da tesouraria na mesma tabela, depois dos degraus de vencimento', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<ReguaPage />)

    expect(await screen.findByText('Fila da tesouraria')).toBeInTheDocument()
    expect(screen.getByText('Parado há 3 dias')).toBeInTheDocument()
    // Vem por último, depois dos quatro degraus de vencimento.
    expect(screen.getAllByRole('row').at(-1)).toHaveTextContent('Fila')
  })

  it('abre o editor do degrau clicado, com a prévia já preenchida pelo exemplo', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<ReguaPage />)

    await userEvent.click(await screen.findByRole('button', { name: /^Editar D\+3 — Em atraso/ }))

    expect(await screen.findByRole('heading', { name: /D\+3 — Em atraso/ })).toBeInTheDocument()
    const previa = screen.getByRole('region', { name: 'Prévia da mensagem' })
    expect(previa).toHaveTextContent('Oi, Ana Souza. São R$ 350,00.')
  })

  it('manda a régua inteira com só o degrau editado trocado', async () => {
    entrarComo('Tesoureiro')
    let enviado: { regras: unknown[] } | undefined
    comApi((corpo) => {
      enviado = corpo
    })

    renderizar(<ReguaPage />)

    await userEvent.click(await screen.findByRole('button', { name: /^Editar D\+3 — Em atraso/ }))

    const mensagem = await screen.findByLabelText('Mensagem')
    await userEvent.clear(mensagem)
    await userEvent.type(mensagem, 'Oi, {{nome}. Regularize.')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(enviado).toBeDefined())
    expect(enviado!.regras).toHaveLength(REGUA.regras.length)
    expect(enviado!.regras).toContainEqual(
      expect.objectContaining({
        dias_de_deslocamento: 3,
        gatilho: 'Vencimento',
        template: 'Oi, {nome}. Regularize.',
      }),
    )
    // O irmão vai como estava: a gravação é da régua toda, e não se pode perder o que não foi tocado.
    expect(enviado!.regras).toContainEqual(
      expect.objectContaining({ dias_de_deslocamento: 0, template: 'Oi, {nome}. São {valor}.' }),
    )
  })

  it('recusa a variável errada sem chamar a API', async () => {
    entrarComo('Tesoureiro')
    let chamou = false
    comApi(() => {
      chamou = true
    })

    renderizar(<ReguaPage />)

    await userEvent.click(await screen.findByRole('button', { name: /^Editar D\+3 — Em atraso/ }))

    const mensagem = await screen.findByLabelText('Mensagem')
    await userEvent.clear(mensagem)
    await userEvent.type(mensagem, 'Vence em {{vencimeto}.')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/Variável desconhecida: \{vencimeto\}/)).toBeInTheDocument()
    expect(chamou).toBe(false)
  })

  it('insere a variável clicada na mensagem', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<ReguaPage />)

    await userEvent.click(await screen.findByRole('button', { name: /^Editar D\+3 — Em atraso/ }))

    const mensagem = (await screen.findByLabelText('Mensagem')) as HTMLTextAreaElement
    await userEvent.clear(mensagem)
    await userEvent.click(screen.getByRole('button', { name: '{vencimento}' }))

    expect(mensagem.value).toBe('{vencimento}')
  })
})
