import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, renderizar } from '@/test/utils'
import type { Documento } from '../types/comunicacao.types'
import DocumentosPage from './DocumentosPage'

const DOCUMENTOS = `${env.VITE_API_URL}/api/v1/comunicacao/documentos`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

const contrato: Documento = {
  id: 'do-1',
  titulo: 'Contrato do buffet',
  categoria: 'Contrato',
  visibilidade: 'Turma',
  versao: 2,
  nome_do_arquivo: 'contrato-buffet.pdf',
  content_type: 'application/pdf',
  tamanho: 1_300_000,
  enviado_em: '2026-09-12T10:00:00Z',
  enviado_por: 'Ana Presidente',
}

const ata: Documento = {
  ...contrato,
  id: 'do-2',
  titulo: 'Ata da reunião de agosto',
  categoria: 'Ata',
  visibilidade: 'SomenteComissao',
  versao: 1,
  nome_do_arquivo: 'ata-agosto.docx',
  content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  tamanho: 40_000,
}

function comApi(documentos: Documento[] = [contrato, ata]) {
  servidor.use(
    http.get(DOCUMENTOS, () => HttpResponse.json(pagina(documentos, 100))),
    http.get(`${DOCUMENTOS}/resumo`, () =>
      HttpResponse.json({
        quantidade: documentos.length,
        bytes: 1_340_000,
        ultimo_envio: '2026-09-12T10:00:00Z',
        por_categoria: [
          { categoria: 'Ata', quantidade: 1 },
          { categoria: 'Contrato', quantidade: 1 },
        ],
      }),
    ),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

describe('DocumentosPage', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn<(objeto: Blob) => string>(() => 'blob:documento')
    URL.revokeObjectURL = vi.fn<(endereco: string) => void>()
  })
  afterEach(() => {
    sessao.encerrar()
    vi.restoreAllMocks()
  })

  it('mostra as cinco categorias como colunas, com contagem, tipo, versão e o selo do interno', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<DocumentosPage />)

    // Primeiro teste do arquivo: o quadro carrega a frio, e com a suíte inteira rodando passa de 1 s.
    const atas = await screen.findByRole('region', { name: 'Atas' }, { timeout: 5000 })
    expect(within(atas).getByRole('article', { name: 'Ata da reunião de agosto' })).toHaveTextContent(
      'Só comissão',
    )
    expect(within(atas).getByRole('heading', { name: 'Atas' }).nextSibling).toHaveTextContent('1')
    expect(within(atas).getByTitle(/Último adicionado em/)).toHaveTextContent('12/09')

    const contratos = screen.getByRole('region', { name: 'Contratos' })
    const cartao = within(contratos).getByRole('article', { name: 'Contrato do buffet' })
    expect(within(cartao).getByText('PDF · 1,2 MB')).toBeInTheDocument()
    expect(within(cartao).getByText('v2')).toBeInTheDocument()
    expect(within(cartao).getByRole('button', { name: 'Excluir Contrato do buffet' })).toBeInTheDocument()

    // Coluna vazia continua no quadro: é nela que se envia o primeiro.
    expect(
      within(screen.getByRole('region', { name: 'Orçamentos' })).getByText('Nenhum documento'),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('region', { name: /^(Atas|Contratos|Orçamentos|Regulamentos|Outros)$/ }),
    ).toHaveLength(5)
  })

  it('o "+ Adicionar" do pé da coluna abre o formulário já na categoria dela', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<DocumentosPage />)
    await userEvent.click(await screen.findByRole('button', { name: '+ Adicionar regulamento' }))

    const dialogo = await screen.findByRole('alertdialog')
    expect(within(dialogo).getByLabelText('Categoria')).toHaveValue('Regulamento')
  })

  it('filtra por tipo pela URL, com a contagem nas pílulas e o "Mostrando X de Y"', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<DocumentosPage />)

    // A contagem entra no nome acessível ("Word 1"): esperar por ela é esperar a lista carregar.
    const word = await screen.findByRole('button', { name: 'Word 1' })
    expect(screen.getByRole('button', { name: /^PDF/ })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: /^Só da comissão/ })).toHaveTextContent('1')

    await userEvent.click(word)

    expect(await screen.findByText('Mostrando 1 de 2 documentos')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Ata da reunião de agosto' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Contrato do buffet' })).not.toBeInTheDocument()
  })

  it('o formando baixa, mas não adiciona, corrige nem exclui', async () => {
    entrarComo('Formando')
    comApi([contrato])

    renderizar(<DocumentosPage />)

    await screen.findByRole('button', { name: 'Baixar Contrato do buffet' })
    expect(screen.queryByRole('button', { name: /Adicionar documento/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Corrigir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^\+ Adicionar/ })).not.toBeInTheDocument()
  })

  it('baixar pede o arquivo à API e abre o PDF numa aba', async () => {
    entrarComo('Formando')
    comApi([contrato])
    const aba = { location: { href: '' }, close: vi.fn<() => void>() }
    vi.spyOn(window, 'open').mockReturnValue(aba as unknown as Window)
    let pedido = false
    servidor.use(
      http.get(`${DOCUMENTOS}/do-1/download`, () => {
        pedido = true
        return new HttpResponse(new Blob(['%PDF-1.4'], { type: 'application/pdf' }))
      }),
    )

    renderizar(<DocumentosPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Baixar Contrato do buffet' }))

    await waitFor(() => expect(aba.location.href).toBe('blob:documento'))
    expect(pedido).toBe(true)
  })

  it('adicionar exige o arquivo antes de ir à API', async () => {
    entrarComo('Tesoureiro')
    comApi([])
    let envios = 0
    servidor.use(
      // Sem ler o corpo: o FormData do jsdom com arquivo não atravessa o fetch do Node inteiro, e ler
      // o multipart aqui só testaria o jsdom. O que o formulário decide é se vai ou não à API.
      http.post(DOCUMENTOS, () => {
        envios++
        return HttpResponse.json(contrato)
      }),
    )

    renderizar(<DocumentosPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Adicionar documento/ }))
    const dialogo = await screen.findByRole('alertdialog')

    await userEvent.type(within(dialogo).getByLabelText('Título'), 'Regulamento da turma')
    await userEvent.selectOptions(within(dialogo).getByLabelText('Categoria'), 'Regulamento')
    await userEvent.selectOptions(within(dialogo).getByLabelText('Para quem é'), 'Turma')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Adicionar' }))

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent('Anexe o arquivo do documento.')
    expect(envios).toBe(0)

    await userEvent.upload(
      within(dialogo).getByLabelText('Anexar o arquivo'),
      new File(['%PDF-1.4'], 'regulamento.pdf', { type: 'application/pdf' }),
    )
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => expect(envios).toBe(1))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })
})
