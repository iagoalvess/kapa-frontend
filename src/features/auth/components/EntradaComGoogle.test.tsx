import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { carregarGoogle } from '@/lib/google'
import { convitePendente } from '@/lib/convitePendente'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import LoginPage from '../pages/LoginPage'
import { SenhaDaConta } from './SenhaDaConta'
import { EntradaComGoogle } from './EntradaComGoogle'

vi.mock('@/lib/google', () => ({ carregarGoogle: vi.fn<typeof carregarGoogle>() }))
const BASE = `${env.VITE_API_URL}/api/v1/auth/google`
let callback: ((resposta: { credential: string }) => void) | undefined
const original = env.VITE_GOOGLE_CLIENT_ID
const documentos = [
  { tipo: 'TermosDeUso', versao: '1' },
  { tipo: 'PoliticaDePrivacidade', versao: '1' },
]
const proximo = { contexto: 'contexto-curto', nome: 'Ana', email: 'ana@gmail.com', exige_recuperacao: false }

beforeEach(() => {
  env.VITE_GOOGLE_CLIENT_ID = 'teste.apps.googleusercontent.com'
  callback = undefined
  vi.mocked(carregarGoogle).mockResolvedValue({
    accounts: {
      id: {
        initialize: (opcoes) => {
          callback = opcoes.callback
        },
        renderButton: (elemento) => {
          const botao = document.createElement('button')
          botao.textContent = 'Continuar com Google'
          botao.addEventListener('click', () => callback?.({ credential: 'credencial-google' }))
          elemento.append(botao)
        },
      },
    },
  })
  servidor.use(
    http.get(`${BASE}/configuracao`, () => HttpResponse.json({ client_id: env.VITE_GOOGLE_CLIENT_ID })),
    http.post(`${BASE}/iniciar`, () => HttpResponse.json({ tentativa: 'tentativa', nonce: 'nonce' })),
  )
})
afterEach(() => {
  env.VITE_GOOGLE_CLIENT_ID = original
  sessao.encerrar()
  convitePendente.descartar()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('Entrada com Google', () => {
  it('acompanha a largura do painel sem duplicar botões e desconecta ao sair', async () => {
    let redimensionar: (() => void) | undefined
    const desconectar = vi.fn<() => void>()
    vi.stubGlobal(
      'ResizeObserver',
      class implements ResizeObserver {
        constructor(aoRedimensionar: ResizeObserverCallback) {
          redimensionar = () => aoRedimensionar([], this)
        }
        observe() {}
        unobserve() {}
        disconnect = desconectar
      },
    )
    const google = await carregarGoogle()
    const desenhar = vi.spyOn(google.accounts.id, 'renderButton')
    const { unmount } = renderizar(<EntradaComGoogle />)
    await screen.findByRole('button', { name: 'Continuar com Google' })
    const painel = screen.getByLabelText('Continuar com Google')
    Object.defineProperty(painel, 'clientWidth', { value: 280, configurable: true })
    act(() => redimensionar?.())
    expect(desenhar).toHaveBeenLastCalledWith(painel, expect.objectContaining({ width: '255' }))
    expect(screen.getAllByRole('button', { name: 'Continuar com Google' })).toHaveLength(1)
    const chamadas = desenhar.mock.calls.length
    act(() => redimensionar?.())
    expect(desenhar).toHaveBeenCalledTimes(chamadas)
    unmount()
    expect(desconectar).toHaveBeenCalledOnce()
    act(() => redimensionar?.())
    expect(desenhar).toHaveBeenCalledTimes(chamadas)
  })

  it('associa o convite da página à tentativa antes do callback do Google', async () => {
    let enviado: unknown
    servidor.use(
      http.post(`${BASE}/iniciar`, async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json({ tentativa: 'tentativa', nonce: 'nonce' })
      }),
    )
    renderizar(<EntradaComGoogle convite="convite-direto" />)
    await screen.findByRole('button', { name: 'Continuar com Google' })
    expect(enviado).toEqual({ convite: 'convite-direto' })
  })

  it('link em outra aba recupera convite, limpa URL e envia só o comprovante no corpo', async () => {
    let enviado: unknown
    servidor.use(
      http.post(`${BASE}/vinculo`, async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json({ access_token: 'google', expira_em: new Date().toISOString() })
      }),
      http.post(`${env.VITE_API_URL}/api/v1/convites/convite-outra-aba/aceitar`, () =>
        HttpResponse.json({ access_token: 'sessao-convite', expira_em: new Date().toISOString() }),
      ),
    )
    const { router } = renderizar(<LoginPage />, '/login?comprovante_google=prova&convite=convite-outra-aba')
    await waitFor(() => expect(sessao.accessToken()).toBe('sessao-convite'))
    expect(enviado).toEqual({ contexto: null, comprovante: 'prova' })
    expect(router.state.location.search).not.toContain('comprovante_google')
    expect(convitePendente.ler()).toBeNull()
  })

  it('fica oculta sem configuração e mantém e-mail e senha', () => {
    env.VITE_GOOGLE_CLIENT_ID = undefined
    renderizar(<LoginPage />)
    expect(screen.queryByRole('button', { name: 'Continuar com Google' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(carregarGoogle).not.toHaveBeenCalled()
  })

  it('entra com o botão oficial e guarda a sessão sem pedir senha', async () => {
    let enviado: unknown
    servidor.use(
      http.post(BASE, async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json({ access_token: 'token-google', expira_em: new Date().toISOString() })
      }),
    )
    renderizar(<LoginPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar com Google' }))
    await waitFor(() => expect(sessao.accessToken()).toBe('token-google'))
    expect(enviado).toEqual({ tentativa: 'tentativa', credencial: 'credencial-google' })
    expect(localStorage.length).toBe(0)
  })

  it('cadastro exige aceite, trava e-mail e não envia senha nem marketing automático', async () => {
    let enviado: Record<string, unknown> | undefined
    servidor.use(
      http.post(BASE, () =>
        HttpResponse.json({ codigo: 'auth.cadastro_necessario', dados: proximo }, { status: 409 }),
      ),
      http.get(`${env.VITE_API_URL}/api/v1/legal/vigentes`, () => HttpResponse.json(documentos)),
      http.post(`${BASE}/cadastro`, async ({ request }) => {
        enviado = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          { access_token: 'novo-google', expira_em: new Date().toISOString() },
          { status: 201 },
        )
      }),
    )
    renderizar(<LoginPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar com Google' }))
    expect(await screen.findByRole('textbox', { name: 'E-mail' })).toHaveAttribute('readonly')
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
    const marketing = screen.getByRole('checkbox', { name: /dicas e novidades/ })
    expect(marketing).not.toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(enviado).toBeUndefined()
    await userEvent.click(screen.getByRole('checkbox', { name: /Termos de Uso e a Política de Privacidade/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    await waitFor(() => expect(sessao.accessToken()).toBe('novo-google'))
    expect(enviado).not.toHaveProperty('senha')
    expect(enviado).not.toHaveProperty('email')
    expect(enviado).toMatchObject({ contexto: proximo.contexto, receber_comunicacao_do_kapa: false })
  })

  it('solicita vínculo sem obter sessão e permite voltar para a senha', async () => {
    servidor.use(
      http.post(BASE, () =>
        HttpResponse.json({ codigo: 'auth.google_vinculo_necessario', dados: proximo }, { status: 409 }),
      ),
      http.post(`${BASE}/vinculo/solicitar`, () => new HttpResponse(null, { status: 204 })),
    )
    renderizar(<LoginPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar com Google' }))
    await waitFor(() => expect(document.body.textContent).toContain('Enviar link de confirmação'))
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar link de confirmação' }))
    expect(await screen.findByText(/Se a solicitação puder ser concluída/)).toBeInTheDocument()
    expect(sessao.accessToken()).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Voltar para escolher como entrar' }))
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeVisible()
  })

  it('preserva convite e só publica sessão após o aceite', async () => {
    convitePendente.guardar('convite-google')
    servidor.use(
      http.post(BASE, () =>
        HttpResponse.json({ access_token: 'google', expira_em: new Date().toISOString() }),
      ),
      http.post(`${env.VITE_API_URL}/api/v1/convites/convite-google/aceitar`, () =>
        HttpResponse.json({ access_token: 'sessao-da-turma', expira_em: new Date().toISOString() }),
      ),
    )
    renderizar(<LoginPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar com Google' }))
    await waitFor(() => expect(sessao.accessToken()).toBe('sessao-da-turma'))
    expect(convitePendente.ler()).toBeNull()
  })

  it('mostra definir senha sem pedir senha atual para conta só-Google', async () => {
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/conta/acesso`, () =>
        HttpResponse.json({ email: 'ana@gmail.com', tem_senha: false }),
      ),
      http.post(
        `${env.VITE_API_URL}/api/v1/conta/esqueci-senha`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    )
    renderizar(<SenhaDaConta />)
    await userEvent.click(await screen.findByRole('button', { name: 'Definir senha' }))
    expect(await screen.findByText(/Enviamos um link para definir sua senha/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()
  })

  it('erro do Google permite nova tentativa e a opção por e-mail', async () => {
    servidor.use(
      http.post(BASE, () =>
        HttpResponse.json(
          { codigo: 'auth.google_credencial_invalida', title: 'Credencial inválida.' },
          { status: 401 },
        ),
      ),
    )
    renderizar(<LoginPage />)
    await act(async () => {
      await waitFor(() => expect(callback).toBeDefined())
    })
    await userEvent.click(screen.getByRole('button', { name: 'Continuar com Google' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Credencial inválida.')
    expect(screen.getByRole('button', { name: 'Tentar Google novamente' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeVisible()
  })
})
