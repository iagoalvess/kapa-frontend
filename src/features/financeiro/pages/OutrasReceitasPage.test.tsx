import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, reais, renderizar } from '@/test/utils'
import type { OutraReceita, ResumoDeOutrasReceitas } from '../types/financeiro.types'
import OutrasReceitasPage from './OutrasReceitasPage'

const OUTRAS_RECEITAS = `${env.VITE_API_URL}/api/v1/financeiro/outras-receitas`
const DOCUMENTOS = `${env.VITE_API_URL}/api/v1/comunicacao/documentos`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/** Como a API devolve: o que é nulo vem `null`. */
const prevista: OutraReceita = {
  id: 're-1',
  descricao: 'Patrocínio da colação',
  origem: 'Clínica Sorriso',
  categoria: 'Patrocinio',
  valor_em_centavos: 500_000,
  data: '2026-08-10',
  status: 'Prevista',
  atrasada: true,
  documento: null,
}

const recebida: OutraReceita = {
  id: 're-2',
  descricao: 'Rendimento de agosto',
  origem: null,
  categoria: 'Rendimento',
  valor_em_centavos: 12_345,
  data: '2026-09-01',
  status: 'Recebida',
  atrasada: false,
  documento: {
    id: 'doc-1',
    titulo: 'Extrato de agosto',
    nome_do_arquivo: 'extrato.pdf',
    content_type: 'application/pdf',
  },
}

const soma = (quantidade: number, valor_em_centavos: number) => ({ quantidade, valor_em_centavos })

const RESUMO: ResumoDeOutrasReceitas = {
  todas: soma(2, 512_345),
  prevista: soma(1, 500_000),
  atrasada: soma(1, 500_000),
  recebida: soma(1, 12_345),
  cancelada: soma(0, 0),
}

function comApi(outrasReceitas: OutraReceita[] = [prevista, recebida]) {
  servidor.use(
    http.get(OUTRAS_RECEITAS, () => HttpResponse.json(pagina(outrasReceitas))),
    http.get(`${OUTRAS_RECEITAS}/resumo`, () => HttpResponse.json(RESUMO)),
    http.get(DOCUMENTOS, () => HttpResponse.json(pagina([]))),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

describe('ReceitasPage', () => {
  afterEach(() => sessao.encerrar())

  it('mostra o que entrou e o que está previsto, com a origem e a situação de cada linha', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<OutrasReceitasPage />)

    const lista = await screen.findByRole('region', { name: 'Lista de outras receitas' })
    expect(await within(lista).findByText('Patrocínio da colação')).toBeInTheDocument()
    expect(within(lista).getByText('Clínica Sorriso · Patrocínio')).toBeInTheDocument()
    expect(within(lista).getByText('Sem origem · Rendimento')).toBeInTheDocument()
    expect(within(lista).getByText('Atrasada')).toBeInTheDocument()
    expect(within(lista).getByText('Recebida')).toBeInTheDocument()

    const faixa = screen.getByRole('region', { name: 'Resumo das outras receitas' })
    expect(within(faixa).getByText(reais(12_345))).toBeInTheDocument()
  })

  it('só a prevista oferece receber e cancelar; a recebida só se edita', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<OutrasReceitasPage />)

    const linhaPrevista = (await screen.findByText('Patrocínio da colação')).closest('tr')!
    expect(within(linhaPrevista).getByRole('button', { name: 'Receber' })).toBeInTheDocument()
    expect(within(linhaPrevista).getByRole('button', { name: /Cancelar/ })).toBeInTheDocument()

    const linhaRecebida = screen.getByText('Rendimento de agosto').closest('tr')!
    expect(within(linhaRecebida).queryByRole('button', { name: 'Receber' })).toBeNull()
    expect(within(linhaRecebida).queryByRole('button', { name: /Cancelar/ })).toBeNull()
    expect(within(linhaRecebida).getByRole('button', { name: /Editar/ })).toBeInTheDocument()
    expect(within(linhaRecebida).getByRole('button', { name: /Abrir comprovante/ })).toBeInTheDocument()
  })

  it('lança uma receita já recebida com o que o formulário pediu', async () => {
    entrarComo('Tesoureiro')
    comApi([])
    let corpo: Record<string, string> | undefined
    servidor.use(
      http.post(OUTRAS_RECEITAS, async ({ request }) => {
        const formulario = await request.formData()
        corpo = Object.fromEntries(formulario) as Record<string, string>
        return HttpResponse.json(recebida, { status: 201 })
      }),
    )

    renderizar(<OutrasReceitasPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Nova receita/ }))

    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.type(within(dialogo).getByLabelText('O que foi'), 'Festa junina')
    await userEvent.type(within(dialogo).getByLabelText('Valor'), '250000')
    await userEvent.selectOptions(within(dialogo).getByLabelText('Categoria'), 'Evento')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(corpo).toMatchObject({
        descricao: 'Festa junina',
        categoria: 'Evento',
        valor_em_centavos: '250000',
        recebida: 'true',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('o 409 da API aparece no formulário, que continua aberto', async () => {
    entrarComo('Tesoureiro')
    comApi([])
    servidor.use(
      http.post(OUTRAS_RECEITAS, () =>
        HttpResponse.json(
          { codigo: 'financeiro.outra_receita_duplicada', detail: 'Esta receita já foi lançada.' },
          { status: 409 },
        ),
      ),
    )

    renderizar(<OutrasReceitasPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Nova receita/ }))

    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.type(within(dialogo).getByLabelText('O que foi'), 'Festa junina')
    await userEvent.type(within(dialogo).getByLabelText('Valor'), '250000')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialogo).findByText('Esta receita já foi lançada.')).toBeInTheDocument()
  })

  it('receber manda o dia em que o dinheiro entrou', async () => {
    entrarComo('Tesoureiro')
    comApi([prevista])
    let corpo: unknown
    servidor.use(
      http.post(`${OUTRAS_RECEITAS}/re-1/receber`, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json({ ...prevista, status: 'Recebida', atrasada: false })
      }),
    )

    renderizar(<OutrasReceitasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Receber' }))

    const dialogo = await screen.findByRole('alertdialog')
    const dia = within(dialogo).getByLabelText('Dia em que o dinheiro entrou')
    await userEvent.clear(dia)
    await userEvent.type(dia, '2026-09-02')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Registrar' }))

    await waitFor(() => expect(corpo).toEqual({ recebida_em: '2026-09-02' }))
  })

  it('cancelar pede confirmação antes de chamar a API', async () => {
    entrarComo('Tesoureiro')
    comApi([prevista])
    let cancelou = false
    servidor.use(
      http.post(`${OUTRAS_RECEITAS}/re-1/cancelar`, () => {
        cancelou = true
        return HttpResponse.json({ ...prevista, status: 'Cancelada' })
      }),
    )

    renderizar(<OutrasReceitasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar Patrocínio da colação' }))
    expect(cancelou).toBe(false)

    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar receita' }),
    )

    await waitFor(() => expect(cancelou).toBe(true))
  })

  it('o formando lê a lista, sem nenhuma ação da tesouraria', async () => {
    entrarComo('Formando')
    comApi()

    renderizar(<OutrasReceitasPage />)

    expect(await screen.findByText('Patrocínio da colação')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nova receita/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Receber' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Editar/ })).toBeNull()
    // O comprovante está no acervo, visível para a turma: esse abre para todo mundo.
    expect(screen.getByRole('button', { name: /Abrir comprovante/ })).toBeInTheDocument()
  })
})
