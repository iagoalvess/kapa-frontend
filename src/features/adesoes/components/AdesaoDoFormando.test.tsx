import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import type { Adesao, ConteudoParaAdesao, MinhaAdesao, PlanoAceito } from '../types/adesoes.types'
import { AdesaoDoFormando } from './AdesaoDoFormando'

const CONTEUDO = `${env.VITE_API_URL}/api/v1/adesoes/termos/vigente`
const MINHA = `${env.VITE_API_URL}/api/v1/adesoes/eu`
const ADERIR = `${env.VITE_API_URL}/api/v1/adesoes`
const CODIGO = `${env.VITE_API_URL}/api/v1/adesoes/codigo`

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const HASH = 'a'.repeat(64)

/** Como a API devolve: sem descrição, `descricao` não vem (`WhenWritingNull`). */
const plano: PlanoAceito = {
  percentual_de_multa: 200,
  percentual_de_juros_ao_mes: 100,
  carencia_em_dias: 0,
  percentual_de_desconto_por_antecipacao: 0,
  itens: [
    {
      tipo: 'Mensalidade',
      valor_em_centavos: 240_000,
      numero_de_parcelas: 12,
      dia_de_vencimento: 10,
      primeiro_mes: '2027-03-01',
    },
  ],
  parcelas: Array.from({ length: 12 }, (_, indice) => ({
    tipo: 'Mensalidade' as const,
    numero: indice + 1,
    de: 12,
    vencimento: `2027-${String((indice % 9) + 3).padStart(2, '0')}-10`,
    valor_em_centavos: 20_000,
  })),
  total_em_centavos: 240_000,
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
    http.post(CODIGO, () => {
      pedidos.codigo += 1
      return HttpResponse.json({ email: 'an*@kapa.dev', valido_por_minutos: 3 })
    }),
  )
  return pedidos
}

/** O caminho até a confirmação: rolar o termo, marcar, aceitar (que pede o código) e digitá-lo no diálogo. */
async function lerPedirCodigoEDigitar(codigo = '123456') {
  act(() => chegarAoFim?.())
  await userEvent.click(screen.getByRole('checkbox'))
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
    responder({ pendencias: [], menor_de_idade: false })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    const resumo = await screen.findByRole('region', { name: 'O que você vai pagar' })
    const termo = screen.getByRole('region', { name: 'Texto do termo' })
    expect(resumo.compareDocumentPosition(termo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByText(reais(240_000)).length).toBeGreaterThan(0)
    expect(screen.getByText('Em caso de atraso: multa de 2% e juros de 1% ao mês.')).toBeInTheDocument()
  })

  it('só libera o aceite depois de rolar o termo e confirmar o código, e envia os dois', async () => {
    let enviado: unknown
    responder({ pendencias: [], menor_de_idade: false })
    servidor.use(
      http.post(ADERIR, async ({ request }) => {
        enviado = await request.json()
        responder({ adesao, pendencias: [], menor_de_idade: false })
        return HttpResponse.json(adesao, { status: 201 })
      }),
    )

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    const aceitar = await screen.findByRole('button', { name: 'Aceitar' })
    expect(aceitar).toBeDisabled()
    expect(screen.getByRole('checkbox')).toBeDisabled()

    await lerPedirCodigoEDigitar()

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar adesão' }))

    expect(await screen.findByRole('region', { name: 'Termo assinado' })).toBeInTheDocument()
    expect(enviado).toEqual({ hash_do_conteudo: HASH, codigo: '123456' })
  })

  /** Sem a caixa marcada, aceitar só avisa: não gasta código nem abre o diálogo. */
  it('não pede código sem a caixa de aceite marcada', async () => {
    const pedidos = responder({ pendencias: [], menor_de_idade: false })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    await screen.findByRole('button', { name: 'Aceitar' })
    act(() => chegarAoFim?.())
    await userEvent.click(screen.getByRole('button', { name: 'Aceitar' }))

    expect(await screen.findByText('Marque que leu e aceita o termo.')).toBeInTheDocument()
    expect(pedidos.codigo).toBe(0)
    expect(screen.queryByLabelText(/Código enviado para/)).not.toBeInTheDocument()
  })

  it('pede nome, CPF e nascimento antes do aceite quando o cadastro não tem', async () => {
    responder({ pendencias: ['cpf', 'data_de_nascimento'], menor_de_idade: false })

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    expect(await screen.findByText('formulário do titular')).toBeInTheDocument()
    expect(screen.getByText(/informe seu CPF, data de nascimento/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aceitar' })).not.toBeInTheDocument()
  })

  it('termo ou plano mudado durante a leitura relê o conteúdo', async () => {
    const pedidos = responder({ pendencias: [], menor_de_idade: false })
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
    await lerPedirCodigoEDigitar()
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar adesão' }))

    await waitFor(() => expect(pedidos.conteudo).toBe(2))
  })

  it('sem termo nem plano, explica o que falta em vez de quebrar', async () => {
    responder({ pendencias: [], menor_de_idade: false }, {})

    renderizar(<AdesaoDoFormando FormularioDoTitular={TitularFalso} />)

    expect(await screen.findByText(/ainda não publicou o termo/)).toBeInTheDocument()
    expect(screen.getByText(/ainda não tem plano de cobrança em vigor/)).toBeInTheDocument()
  })

  it('menor de 18 anos é encaminhado à comissão', async () => {
    responder({ pendencias: [], menor_de_idade: true })

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
})
