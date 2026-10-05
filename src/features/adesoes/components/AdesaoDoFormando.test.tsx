import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import { useExtrato } from '@/features/pagamentos'
import type { Adesao, ConteudoParaAdesao, MinhaAdesao, PlanoAceito } from '../types/adesoes.types'
import { AdesaoDoFormando } from './AdesaoDoFormando'

const CONTEUDO = `${env.VITE_API_URL}/api/v1/adesoes/termos/vigente`
const MINHA = `${env.VITE_API_URL}/api/v1/adesoes/eu`
const ADERIR = `${env.VITE_API_URL}/api/v1/adesoes`
const CODIGO = `${env.VITE_API_URL}/api/v1/adesoes/codigo`

function ExtratoObservado() {
  const { data } = useExtrato()
  return <p>Parcelas no extrato: {data?.parcelas.length ?? 'carregando'}</p>
}

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const HASH = 'a'.repeat(64)

/** Como a API devolve: sem descrição, `descricao` vem nulo. */
const plano: PlanoAceito = {
  percentual_de_multa: 200,
  percentual_de_juros_ao_mes: 100,
  carencia_em_dias: 0,
  percentual_de_desconto_por_antecipacao: 0,
  dias_minimos_para_desconto: 0,
  itens: [
    {
      tipo: 'Mensalidade',
      descricao: null,
      valor_em_centavos: 240_000,
      numero_de_parcelas: 12,
      dia_de_vencimento: 10,
      primeiro_mes: '2027-03-01',
    },
  ],
  parcelas: Array.from({ length: 12 }, (_, indice) => ({
    tipo: 'Mensalidade' as const,
    descricao: null,
    numero: indice + 1,
    de: 12,
    vencimento: `2027-${String((indice % 9) + 3).padStart(2, '0')}-10`,
    valor_em_centavos: 20_000,
  })),
  total_em_centavos: 240_000,
  cesta: null,
}

const conteudo: ConteudoParaAdesao = {
  termo: {
    id: 't-1',
    versao: 1,
    conteudo: '# Termo\n\nA turma contrata a formatura.',
    vigente_desde: '2026-09-14T12:00:00Z',
  },
  plano,
  hash_do_conteudo: HASH,
  resumo: null,
  catalogo: [
    {
      id: 'pk-1',
      grupo: null,
      tipo: 'Mensalidade',
      descricao: null,
      valor_em_centavos: 240_000,
      numero_de_parcelas: 12,
      convites_da_festa: 0,
      convites_da_colacao: 0,
    },
    {
      id: 'pk-10',
      grupo: 'Festa',
      tipo: 'Festa',
      descricao: '10 pessoas',
      valor_em_centavos: 300_000,
      numero_de_parcelas: 10,
      convites_da_festa: 10,
      convites_da_colacao: 0,
    },
    {
      id: 'pk-15',
      grupo: 'Festa',
      tipo: 'Festa',
      descricao: '15 pessoas',
      valor_em_centavos: 420_000,
      numero_de_parcelas: 10,
      convites_da_festa: 15,
      convites_da_colacao: 0,
    },
  ],
  cesta_contratada: [],
}

const adesao: Adesao = {
  id: 'ad-1',
  versao: 1,
  aceito_em: '2026-09-14T13:32:05Z',
  hash_do_conteudo: HASH,
  nome_completo: 'Ana Souza',
  cpf: '52998224725',
  email_do_aceite: 'ana@kapa.dev',
  conteudo_do_termo: '# Termo\n\nA turma contrata a formatura.',
  plano,
}

/** O formulário do titular vem de outra feature; aqui basta saber que ele aparece. */
function TitularFalso() {
  return <p>formulário do titular</p>
}

/** `IntersectionObserver` de mentira: o teste decide quando o fim do termo aparece. */
let chegarAoFim: (() => void) | undefined

class ObservadorFalso {
  constructor(callback: IntersectionObserverCallback) {
    chegarAoFim = () =>
      callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

function responder(minha: MinhaAdesao, conteudoDaTurma: ConteudoParaAdesao = conteudo) {
  const pedidos = { conteudo: 0, codigo: 0 }
  servidor.use(
    http.get(CONTEUDO, () => {
      pedidos.conteudo += 1
      return HttpResponse.json(conteudoDaTurma)
    }),
    http.get(MINHA, () => HttpResponse.json(minha)),
    // A cesta viva do termo assinado (Sprint 48): vazia, cai no quadro do termo.
    http.get(`${env.VITE_API_URL}/api/v1/adesoes/minha-cesta`, () =>
      HttpResponse.json({ pacotes: [], disponiveis: [] }),
    ),
    http.post(CODIGO, () => {
      pedidos.codigo += 1
      return HttpResponse.json({ email: 'an*@kapa.dev', valido_por_minutos: 3 })
    }),
  )
  return pedidos
}

/** Põe a mensalidade na cesta — sem pacote, a tela não deixa aceitar (Sprint 47, D33). */
async function escolherAMensalidade() {
  await userEvent.click(await screen.findByRole('checkbox', { name: /Mensalidade/ }))
}

/** O caminho até a confirmação: rolar o termo, marcar, aceitar (que pede o código) e digitá-lo no diálogo. */
async function lerPedirCodigoEDigitar(codigo = '123456') {
  act(() => chegarAoFim?.())
  await userEvent.click(screen.getByRole('checkbox', { name: /Li o termo/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Aceitar' }))
  await userEvent.type(await screen.findByLabelText(/Código enviado para/), codigo)
}

describe('AdesaoDoFormando', () => {
  beforeEach(() => {
    chegarAoFim = undefined
    vi.stubGlobal('IntersectionObserver', ObservadorFalso)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('mostra o que se paga antes do termo', async () => {
    responder({ adesao: null, pendencias: [], menor_de_idade: false })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)
    await escolherAMensalidade()

    const resumo = await screen.findByRole('region', { name: 'O que você vai pagar' })
    const termo = screen.getByRole('region', { name: 'Texto do termo' })
    expect(resumo.compareDocumentPosition(termo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByText(reais(240_000)).length).toBeGreaterThan(0)
    expect(screen.getByText('Em caso de atraso: multa de 2% e juros de 1% ao mês.')).toBeInTheDocument()
  })

  it('sem resumo do termo, não há cartão nem espaço reservado', async () => {
    responder({ adesao: null, pendencias: [], menor_de_idade: false })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    await screen.findByRole('region', { name: 'O que você vai pagar' })
    expect(screen.queryByRole('region', { name: 'Resumo do termo por IA' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Gerado por IA/)).not.toBeInTheDocument()
  })

  it('com resumo, mostra os parágrafos acima do termo, com o aviso uma vez', async () => {
    responder(
      { adesao: null, pendencias: [], menor_de_idade: false },
      { ...conteudo, resumo: 'Você paga 12 parcelas\nde R$ 200,00.\n\nAtraso gera multa.' },
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    const resumo = await screen.findByRole('region', { name: 'Resumo do termo por IA' })
    const termo = screen.getByRole('region', { name: 'Termo de adesão' })
    // A linha em branco separa parágrafos; a quebra simples dentro de um vira espaço.
    expect(within(resumo).getByText('Você paga 12 parcelas de R$ 200,00.')).toBeInTheDocument()
    expect(within(resumo).getByText('Atraso gera multa.')).toBeInTheDocument()
    expect(resumo.compareDocumentPosition(termo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByText(/Gerado por IA/)).toHaveLength(1)
  })

  it('só libera o aceite depois de rolar o termo e confirmar o código, e envia os dois', async () => {
    let enviado: unknown
    let quantidade = 0
    responder({ adesao: null, pendencias: [], menor_de_idade: false })
    servidor.use(
      http.post(ADERIR, async ({ request }) => {
        enviado = await request.json()
        quantidade = 12
        responder({ adesao, pendencias: [], menor_de_idade: false })
        return HttpResponse.json(adesao, { status: 201 })
      }),
      http.get(`${env.VITE_API_URL}/api/v1/extrato/eu`, () =>
        HttpResponse.json({
          parcelas: Array.from({ length: quantidade }, (_, i) => ({ id: String(i) })),
          proxima: null,
          em_aberto_em_centavos: 0,
        }),
      ),
    )

    renderizar(
      <>
        <AdesaoDoFormando FormularioDoTitular={TitularFalso} />
        <ExtratoObservado />
      </>,
    )
    expect(await screen.findByText('Parcelas no extrato: 0')).toBeInTheDocument()

    const aceitar = await screen.findByRole('button', { name: 'Aceitar' })
    expect(aceitar).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /Li o termo/ })).toBeDisabled()

    await escolherAMensalidade()
    await lerPedirCodigoEDigitar()

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar adesão' }))

    expect(await screen.findByRole('region', { name: 'Termo assinado' })).toBeInTheDocument()
    expect(enviado).toEqual({ hash_do_conteudo: HASH, codigo: '123456', pacotes: ['pk-1'] })
    expect(await screen.findByText('Parcelas no extrato: 12')).toBeInTheDocument()
  })

  /** Sem a caixa marcada, aceitar só avisa: não gasta código nem abre o diálogo. */
  it('não pede código sem a caixa de aceite marcada', async () => {
    const pedidos = responder({ adesao: null, pendencias: [], menor_de_idade: false })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    await screen.findByRole('button', { name: 'Aceitar' })
    await escolherAMensalidade()
    act(() => chegarAoFim?.())
    await userEvent.click(screen.getByRole('button', { name: 'Aceitar' }))

    expect(await screen.findByText('Marque que leu e aceita o termo.')).toBeInTheDocument()
    expect(pedidos.codigo).toBe(0)
    expect(screen.queryByLabelText(/Código enviado para/)).not.toBeInTheDocument()
  })

  it('pede nome, CPF e nascimento antes do aceite quando o cadastro não tem', async () => {
    responder({ adesao: null, pendencias: ['cpf', 'dataDeNascimento'], menor_de_idade: false })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    expect(await screen.findByText('formulário do titular')).toBeInTheDocument()
    expect(screen.getByText(/complete os dados que faltam: CPF, data de nascimento/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aceitar' })).not.toBeInTheDocument()
  })

  it('termo ou plano mudado durante a leitura relê o conteúdo', async () => {
    const pedidos = responder({ adesao: null, pendencias: [], menor_de_idade: false })
    servidor.use(
      http.post(ADERIR, () =>
        HttpResponse.json(
          { status: 409, codigo: 'adesao.termo_desatualizado', detail: 'O termo ou o plano mudou.' },
          { status: 409 },
        ),
      ),
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)
    await screen.findByRole('button', { name: 'Aceitar' })
    await escolherAMensalidade()
    await waitFor(() => expect(pedidos.conteudo).toBe(2))
    await lerPedirCodigoEDigitar()
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar adesão' }))

    await waitFor(() => expect(pedidos.conteudo).toBe(3))
  })

  it('sem termo nem plano, explica o que falta em vez de quebrar', async () => {
    responder(
      { adesao: null, pendencias: [], menor_de_idade: false },
      { termo: null, plano: null, hash_do_conteudo: null, resumo: null, catalogo: [], cesta_contratada: [] },
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    expect(await screen.findByText(/ainda não publicou o termo/)).toBeInTheDocument()
    expect(screen.getByText(/ainda não tem plano de cobrança em vigor/)).toBeInTheDocument()
  })

  /** D32 e D33: a festa é uma faixa por vez, com "Não quero"; sem pacote nenhum, não há aceite. */
  it('monta a cesta com uma faixa por grupo e só libera o aceite com ao menos um pacote', async () => {
    const pedidos: string[][] = []
    responder({ adesao: null, pendencias: [], menor_de_idade: false })
    servidor.use(
      http.get(CONTEUDO, ({ request }) => {
        pedidos.push(new URL(request.url).searchParams.getAll('pacotes'))
        return HttpResponse.json(conteudo)
      }),
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)
    const festa = await screen.findByRole('group', { name: 'Festa' })
    act(() => chegarAoFim?.())

    expect(screen.getByRole('button', { name: 'Aceitar' })).toBeDisabled()
    expect(within(festa).getByRole('radio', { name: 'Não quero' })).toBeChecked()

    await userEvent.click(within(festa).getByRole('radio', { name: /10 pessoas/ }))
    await userEvent.click(within(festa).getByRole('radio', { name: /15 pessoas/ }))

    expect(within(festa).getByText('15 convites da festa')).toBeInTheDocument()
    await waitFor(() => expect(pedidos.at(-1)).toEqual(['pk-15']))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Aceitar' })).toBeEnabled())
  })

  it('a re-adesão mostra a cesta contratada, travada', async () => {
    responder(
      { adesao: { ...adesao, versao: 1 }, pendencias: [], menor_de_idade: false },
      { ...conteudo, termo: { ...conteudo.termo!, versao: 2 }, cesta_contratada: ['pk-15'] },
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Ler a versão 2' }))

    const festa = await screen.findByRole('group', { name: 'Festa' })
    expect(within(festa).getByRole('radio', { name: /15 pessoas/ })).toBeChecked()
    expect(within(festa).getByRole('radio', { name: /15 pessoas/ })).toBeDisabled()
  })

  it('o termo assinado traz o quadro de escolhas', async () => {
    responder({
      adesao: {
        ...adesao,
        plano: {
          ...plano,
          cesta: [
            {
              item_id: 'pk-15',
              grupo: 'Festa',
              tipo: 'Festa',
              descricao: '15 pessoas',
              valor_em_centavos: 420_000,
              convites_da_festa: 15,
              convites_da_colacao: 0,
            },
          ],
        },
      },
      pendencias: [],
      menor_de_idade: false,
    })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    const quadro = await screen.findByRole('region', { name: 'Quadro de escolhas' })
    expect(within(quadro).getByText('Festa — 15 pessoas')).toBeInTheDocument()
    expect(within(quadro).getByText('15 convites da festa')).toBeInTheDocument()
  })

  it('menor de 18 anos é encaminhado à comissão', async () => {
    responder({ adesao: null, pendencias: [], menor_de_idade: true })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    expect(await screen.findByText('A sua adesão é feita com a comissão.')).toBeInTheDocument()
  })

  it('quem já aderiu vê o termo assinado com versão, data e o registro do aceite', async () => {
    responder({ adesao, pendencias: [], menor_de_idade: false })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    expect(await screen.findByText(/Versão 1, aceita em 14\/09\/2026/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar PDF' })).toBeInTheDocument()
    expect(screen.getByText('529.982.247-25')).toBeInTheDocument()
    expect(screen.getByText('ana@kapa.dev')).toBeInTheDocument()
  })

  it('mostra o título de cada tópico do resumo, sem os dois-pontos', async () => {
    responder(
      { adesao, pendencias: [], menor_de_idade: false },
      { ...conteudo, resumo: 'Pagamentos: Você paga R$ 12.510,00. Em 12x.\n\nAtraso: Multa de 2%.' },
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)
    const resumo = await screen.findByRole('region', { name: 'Resumo do termo por IA' })
    expect(within(resumo).getAllByRole('listitem')).toHaveLength(2)
    expect(within(resumo).getByText('Pagamentos')).toBeInTheDocument()
    expect(within(resumo).getByText('Você paga R$ 12.510,00. Em 12x.')).toBeInTheDocument()
    expect(within(resumo).getByText('Multa de 2%.')).toBeInTheDocument()
  })

  it('separa o resumo em pontos sem fragmentar os valores', async () => {
    responder(
      { adesao, pendencias: [], menor_de_idade: false },
      { ...conteudo, resumo: 'Você paga R$ 12.510,00. Atraso gera multa.' },
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)
    const resumo = await screen.findByRole('region', { name: 'Resumo do termo por IA' })
    expect(within(resumo).getAllByRole('listitem')).toHaveLength(2)
    expect(within(resumo).getByText('Você paga R$ 12.510,00.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver minhas parcelas' })).toHaveAttribute(
      'href',
      '/minhas-parcelas',
    )
  })

  it('avisa quando o resumo é de outra versão e abre essa versão para leitura', async () => {
    const usuario = userEvent.setup()
    responder(
      { adesao, pendencias: [], menor_de_idade: false },
      { ...conteudo, termo: { ...conteudo.termo!, versao: 2 }, resumo: 'Novas condições da turma.' },
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)
    const resumo = await screen.findByRole('region', { name: 'Resumo do termo por IA' })
    expect(resumo).toHaveTextContent('Este resumo é da versão 2. Você aceitou a versão 1.')
    await usuario.click(screen.getByRole('button', { name: 'Ler a versão 2' }))
    expect(await screen.findByRole('region', { name: 'Termo de adesão' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Termo assinado' })).not.toBeInTheDocument()
  })

  it.each([0, 1, 10])('mostra a antecedência de %i dias enviada pelo plano', async (dias) => {
    responder({
      adesao: {
        ...adesao,
        plano: { ...plano, percentual_de_desconto_por_antecipacao: 300, dias_minimos_para_desconto: dias },
      },
      pendencias: [],
      menor_de_idade: false,
    })
    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)
    const financeiro = await screen.findByRole('region', { name: 'O que você aceitou pagar' })
    const condicao =
      dias === 0
        ? 'antes do vencimento'
        : `com pelo menos ${dias} ${dias === 1 ? 'dia' : 'dias'} de antecedência`
    expect(financeiro).toHaveTextContent(`Desconto de 3% para pagamento ${condicao}.`)
  })

  it('quem já aderiu também vê o resumo, acima do termo assinado', async () => {
    responder(
      { adesao, pendencias: [], menor_de_idade: false },
      { ...conteudo, resumo: 'Você paga 12 parcelas.' },
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    const resumo = await screen.findByRole('region', { name: 'Resumo do termo por IA' })
    const assinado = screen.getByRole('region', { name: 'Termo assinado' })
    expect(resumo).toHaveTextContent('Você paga 12 parcelas.')
    expect(resumo).toHaveTextContent('a partir da versão 1')
    expect(resumo.compareDocumentPosition(assinado) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
