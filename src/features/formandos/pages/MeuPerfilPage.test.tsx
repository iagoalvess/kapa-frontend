import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { useMinhaAdesao } from '@/features/adesoes/hooks/useAderir'
import MeuPerfilPage from './MeuPerfilPage'

const EU = `${env.VITE_API_URL}/api/v1/formandos/eu`

function PendenciasObservadas() {
  const { data } = useMinhaAdesao()
  return <p>Dados pendentes no termo: {data?.pendencias.length ?? 'carregando'}</p>
}

/** Como a API devolve: campo vazio vem `null`. */
const perfil = {
  usuario_id: 'u-1',
  nome: 'Ana',
  email: 'ana@exemplo.com',
  papel: 'Formando',
  pessoais: {
    nome_completo: 'Ana Souza',
    cpf: '52998224725',
    telefone: '+5541998765432',
  },
  contato_de_emergencia: { nome: null, telefone: null, parentesco: null },
  foto_arquivo_id: null,
  completude: 60,
  faltando: ['contatoDeEmergencia', 'foto'],
  essencial_pendente: false,
}

function entrar() {
  const corpo = {
    sub: 'u-1',
    name: 'Ana',
    role: [PERFIS.usuario],
    formatura_id: 'f-1',
    papel: PAPEIS.formando,
  }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

/** Abre a seção pelo "Editar" do cartão e devolve o formulário do diálogo. */
async function editar(nome: string) {
  const cartao = await screen.findByRole('region', { name: nome })
  await userEvent.click(within(cartao).getByRole('button', { name: 'Editar' }))
  return screen.findByRole('form', { name: nome })
}

describe('MeuPerfilPage', () => {
  beforeEach(() => {
    entrar()
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
      ),
      http.get(EU, () => HttpResponse.json(perfil)),
    )
  })

  afterEach(() => sessao.encerrar())

  it('mostra os documentos com máscara e o que ainda falta', async () => {
    renderizar(<MeuPerfilPage />)

    const pessoais = await screen.findByRole('region', { name: 'Dados pessoais' })
    expect(within(pessoais).getByText('529.982.247-25')).toBeInTheDocument()
    expect(within(pessoais).getByText('(41) 99876-5432')).toBeInTheDocument()
    expect(screen.getByText('60% preenchido')).toBeInTheDocument()
    expect(screen.getByText('Falta: Contato de emergência, Foto.')).toBeInTheDocument()
  })

  /** Salvar uma seção não pode reenviar (nem apagar) as outras. */
  it('atualiza as pendências do termo ao salvar os dados pessoais', async () => {
    let pendente = true
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/adesoes/eu`, () =>
        HttpResponse.json({
          adesao: null,
          pendencias: pendente ? ['nomeCompleto'] : [],
        }),
      ),
      http.put(EU, () => {
        pendente = false
        return HttpResponse.json(perfil)
      }),
    )
    renderizar(
      <>
        <MeuPerfilPage />
        <PendenciasObservadas />
      </>,
    )
    expect(await screen.findByText('Dados pendentes no termo: 1')).toBeInTheDocument()
    const pessoais = await editar('Dados pessoais')
    await userEvent.click(within(pessoais).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Dados pendentes no termo: 0')).toBeInTheDocument()
  })

  it('salva só a seção do botão, com campo vazio indo nulo', async () => {
    let enviado: Record<string, unknown> | undefined
    servidor.use(
      http.put(EU, async ({ request }) => {
        enviado = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...perfil, contato_de_emergencia: { nome: 'Marta' } })
      }),
    )

    renderizar(<MeuPerfilPage />)
    const emergencia = await editar('Contato de emergência')
    await userEvent.type(within(emergencia).getByLabelText('Nome'), 'Marta')
    await userEvent.click(within(emergencia).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(enviado).toBeDefined())
    expect(Object.keys(enviado!)).toEqual(['contato_de_emergencia'])
    expect(enviado!.contato_de_emergencia).toMatchObject({ nome: 'Marta', telefone: null, parentesco: null })
    await waitFor(() =>
      expect(screen.queryByRole('form', { name: 'Contato de emergência' })).not.toBeInTheDocument(),
    )
  })

  /** O dígito verificador é do backend; o erro volta com o campo apontado e acende embaixo dele. */
  it('mostra embaixo do CPF o erro que a API apontou nele', async () => {
    servidor.use(
      http.put(EU, () =>
        HttpResponse.json(
          {
            status: 400,
            codigo: 'perfil.cpf_invalido',
            errors: { 'pessoais.cpf': ['CPF inválido. Confira os 11 dígitos.'] },
          },
          { status: 400 },
        ),
      ),
    )

    renderizar(<MeuPerfilPage />)
    const pessoais = await editar('Dados pessoais')
    const cpf = within(pessoais).getByLabelText('CPF')
    await userEvent.clear(cpf)
    await userEvent.type(cpf, '529.982.247-24')
    await userEvent.click(within(pessoais).getByRole('button', { name: 'Salvar' }))

    expect(await within(pessoais).findByText('CPF inválido. Confira os 11 dígitos.')).toBeInTheDocument()
  })

  /** A lista do que falta já diz tudo; o aviso do essencial é da comissão, não do próprio. */
  it('sem o essencial, mostra só a lista do que falta', async () => {
    servidor.use(
      http.get(EU, () =>
        HttpResponse.json({
          ...perfil,
          pessoais: {},
          faltando: ['nomeCompleto', 'cpf', 'telefone'],
          essencial_pendente: true,
        }),
      ),
    )

    renderizar(<MeuPerfilPage />)

    expect(await screen.findByText('Falta: Nome completo, CPF, Telefone.')).toBeInTheDocument()
    expect(screen.queryByText(/Falta o essencial/)).not.toBeInTheDocument()
  })

  /** Encerrada é arquivo: a API recusaria, então a tela mostra a leitura, sem "Editar". */
  it('com a formatura encerrada, mostra o cadastro sem deixar editar', async () => {
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', status: 'Encerrada' }),
      ),
    )

    renderizar(<MeuPerfilPage />)

    const pessoais = await screen.findByRole('region', { name: 'Dados pessoais' })
    expect(within(pessoais).getByText('529.982.247-25')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument())
  })
})
