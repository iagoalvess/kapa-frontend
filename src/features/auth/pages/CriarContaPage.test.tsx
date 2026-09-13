import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import CriarContaPage from './CriarContaPage'

const REGISTRAR = `${env.VITE_API_URL}/api/v1/auth/registrar`
const VIGENTES = `${env.VITE_API_URL}/api/v1/legal/vigentes`

function documentos(versaoDosTermos = '1') {
  return [
    {
      id: 'd-1',
      tipo: 'PoliticaDePrivacidade',
      versao: '1',
      conteudo: '# P',
      vigenteDesde: '2026-09-11T00:00:00Z',
    },
    {
      id: 'd-2',
      tipo: 'TermosDeUso',
      versao: versaoDosTermos,
      conteudo: '# T',
      vigenteDesde: '2026-09-11T00:00:00Z',
    },
  ]
}

async function preencherDados(senha = 'Senha@Forte123') {
  await userEvent.type(screen.getByLabelText('Nome'), 'Ana')
  await userEvent.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
  await userEvent.type(screen.getByLabelText('Senha'), senha)
}

async function aceitarTudo() {
  await userEvent.click(screen.getByRole('checkbox', { name: /Termos de Uso e a Política de Privacidade/ }))
}

async function criarConta() {
  const botao = screen.getByRole('button', { name: 'Criar conta' })
  await waitFor(() => expect(botao).toBeEnabled())
  await userEvent.click(botao)
}

async function preencher(senha?: string) {
  await preencherDados(senha)
  await aceitarTudo()
  await criarConta()
}

describe('CriarContaPage', () => {
  beforeEach(() => {
    sessao.encerrar()
    servidor.use(http.get(VIGENTES, () => HttpResponse.json(documentos())))
  })

  it('cria a conta enviando o aceite das versões vigentes no mesmo corpo', async () => {
    let corpo: unknown
    servidor.use(
      http.post(REGISTRAR, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json({ accessToken: 'token-novo', expiraEm: new Date().toISOString() })
      }),
    )

    renderizar(<CriarContaPage />)
    await preencher()

    await waitFor(() => {
      expect(sessao.accessToken()).toBe('token-novo')
    })
    expect(corpo).toMatchObject({
      aceites: [
        { tipo: 'PoliticaDePrivacidade', versao: '1' },
        { tipo: 'TermosDeUso', versao: '1' },
      ],
    })
  })

  it('não envia o cadastro sem o aceite', async () => {
    let chamou = false
    servidor.use(
      http.post(REGISTRAR, () => {
        chamou = true
        return HttpResponse.json({})
      }),
    )

    renderizar(<CriarContaPage />)
    await preencherDados()
    await criarConta()

    expect(await screen.findByText('É preciso aceitar para continuar.')).toBeInTheDocument()
    expect(chamou).toBe(false)
  })

  /** Publicação de termos com a tela aberta não pode custar o que já foi digitado. */
  it('com versão desatualizada recarrega os documentos e pede o aceite de novo sem limpar os campos', async () => {
    let versoesAceitas: unknown
    servidor.use(
      http.post(REGISTRAR, async ({ request }) => {
        versoesAceitas = ((await request.json()) as { aceites: unknown }).aceites
        return HttpResponse.json(
          { status: 409, detail: 'Documento atualizado.', codigo: 'legal.versao_desatualizada' },
          { status: 409 },
        )
      }),
    )

    renderizar(<CriarContaPage />)
    servidor.use(http.get(VIGENTES, () => HttpResponse.json(documentos('2'))))
    await preencher()

    expect(await screen.findByText(/Os termos foram atualizados/)).toBeInTheDocument()
    expect(versoesAceitas).toContainEqual({ tipo: 'TermosDeUso', versao: '1' })
    expect(screen.getByLabelText('Nome')).toHaveValue('Ana')
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@exemplo.com')
    expect(screen.getByRole('checkbox', { name: /Termos de Uso/ })).not.toBeChecked()

    servidor.use(
      http.post(REGISTRAR, async ({ request }) => {
        versoesAceitas = ((await request.json()) as { aceites: unknown }).aceites
        return HttpResponse.json({ accessToken: 'token-novo', expiraEm: new Date().toISOString() })
      }),
    )
    await aceitarTudo()
    await criarConta()

    await waitFor(() => expect(versoesAceitas).toContainEqual({ tipo: 'TermosDeUso', versao: '2' }))
  })

  it('o link de cada documento abre em nova aba', () => {
    renderizar(<CriarContaPage />)

    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    )
  })

  it('mostra o e-mail já usado embaixo do campo de e-mail', async () => {
    servidor.use(
      http.post(REGISTRAR, () =>
        HttpResponse.json(
          { status: 409, detail: 'Já existe uma conta com este e-mail.', codigo: 'usuario.email_em_uso' },
          { status: 409 },
        ),
      ),
    )

    renderizar(<CriarContaPage />)
    await preencher()

    expect(await screen.findByText('Já existe uma conta com este e-mail.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })

  it('mostra a política de senha que a API recusou embaixo do campo de senha', async () => {
    servidor.use(
      http.post(REGISTRAR, () =>
        HttpResponse.json(
          { status: 400, errors: { senha: ['A senha deve ter no mínimo 8 caracteres.'] } },
          { status: 400 },
        ),
      ),
    )

    renderizar(<CriarContaPage />)
    await preencher('curta')

    expect(await screen.findByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
  })
})
