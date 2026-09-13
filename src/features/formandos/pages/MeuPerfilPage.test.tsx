import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import MeuPerfilPage from './MeuPerfilPage'

const EU = `${env.VITE_API_URL}/api/v1/formandos/eu`

/** Como a API devolve: campo vazio não vem (`WhenWritingNull`). */
const perfil = {
  usuarioId: 'u-1',
  nome: 'Ana',
  email: 'ana@exemplo.com',
  papel: 'Formando',
  pessoais: { nomeCompleto: 'Ana Souza', cpf: '52998224725', telefone: '+5541998765432' },
  endereco: {},
  contatoDeEmergencia: {},
  completude: 30,
  faltando: [
    'nomeNoDiploma',
    'rg',
    'matricula',
    'dataDeNascimento',
    'endereco',
    'contatoDeEmergencia',
    'foto',
  ],
  essencialPendente: false,
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
    accessToken: `c.${btoa(JSON.stringify(corpo))}.a`,
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

const secao = (nome: string) => screen.getByRole('form', { name: nome })

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

    expect(await screen.findByLabelText('CPF')).toHaveValue('529.982.247-25')
    expect(within(secao('Dados pessoais')).getByLabelText('Telefone')).toHaveValue('(41) 99876-5432')
    expect(screen.getByText('30% preenchido')).toBeInTheDocument()
    expect(screen.getByText(/Falta: Nome no diploma, RG/)).toBeInTheDocument()
  })

  /** Salvar uma seção não pode reenviar (nem apagar) as outras. */
  it('salva só a seção do botão, com campo vazio indo nulo', async () => {
    let enviado: Record<string, unknown> | undefined
    servidor.use(
      http.put(EU, async ({ request }) => {
        enviado = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...perfil, endereco: { numero: '10' } })
      }),
    )

    renderizar(<MeuPerfilPage />)
    const endereco = await screen.findByRole('form', { name: 'Endereço' })
    await userEvent.type(within(endereco).getByLabelText('Número'), '10')
    await userEvent.click(within(endereco).getByRole('button', { name: 'Salvar endereço' }))

    await waitFor(() => expect(enviado).toBeDefined())
    expect(Object.keys(enviado!)).toEqual(['endereco'])
    expect(enviado!.endereco).toMatchObject({ numero: '10', cep: null, logradouro: null })
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
    const cpf = await screen.findByLabelText('CPF')
    await userEvent.clear(cpf)
    await userEvent.type(cpf, '529.982.247-24')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar dados pessoais' }))

    expect(
      await within(secao('Dados pessoais')).findByText('CPF inválido. Confira os 11 dígitos.'),
    ).toBeInTheDocument()
  })

  it('preenche o endereço pelo CEP e deixa os campos editáveis', async () => {
    servidor.use(
      http.get('https://viacep.com.br/ws/80010000/json/', () =>
        HttpResponse.json({
          logradouro: 'Rua XV de Novembro',
          bairro: 'Centro',
          localidade: 'Curitiba',
          uf: 'PR',
        }),
      ),
    )

    renderizar(<MeuPerfilPage />)
    const endereco = await screen.findByRole('form', { name: 'Endereço' })
    await userEvent.type(within(endereco).getByLabelText('CEP'), '80010-000')

    await waitFor(() =>
      expect(within(endereco).getByLabelText('Logradouro')).toHaveValue('Rua XV de Novembro'),
    )
    expect(within(endereco).getByLabelText('Cidade')).toHaveValue('Curitiba')
    expect(within(endereco).getByLabelText('Logradouro')).toBeEnabled()
  })

  it('CEP que o ViaCEP não conhece pede o endereço à mão', async () => {
    servidor.use(
      http.get('https://viacep.com.br/ws/99999999/json/', () => HttpResponse.json({ erro: 'true' })),
    )

    renderizar(<MeuPerfilPage />)
    const endereco = await screen.findByRole('form', { name: 'Endereço' })
    await userEvent.type(within(endereco).getByLabelText('CEP'), '99999-999')

    expect(await within(endereco).findByText(/Preencha o endereço à mão/)).toBeInTheDocument()
  })

  it('avisa quando falta o essencial para a cobrança', async () => {
    servidor.use(http.get(EU, () => HttpResponse.json({ ...perfil, pessoais: {}, essencialPendente: true })))

    renderizar(<MeuPerfilPage />)

    expect(await screen.findByText(/Falta o essencial: nome completo, CPF e telefone/)).toBeInTheDocument()
  })

  /** Encerrada é arquivo: a API recusaria, então a tela nem oferece o botão. */
  it('com a formatura encerrada, mostra o cadastro sem deixar salvar', async () => {
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', status: 'Encerrada' }),
      ),
    )

    renderizar(<MeuPerfilPage />)

    expect(await screen.findByLabelText('CPF')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('CPF')).toBeDisabled())
    expect(screen.queryByRole('button', { name: /^Salvar/ })).not.toBeInTheDocument()
  })
})
