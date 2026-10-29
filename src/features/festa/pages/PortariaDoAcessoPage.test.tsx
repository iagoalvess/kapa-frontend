import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { credencialDaPortaria, type CredencialDaPortaria } from '@/lib/http/credencialDaPortaria'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { ListaDaPortaria } from '../types/convites.types'
import PortariaDoAcessoPage from './PortariaDoAcessoPage'

const API = env.VITE_API_URL
const CAMINHO = '/portaria/acesso/:token?'

const evento: CredencialDaPortaria['evento'] = {
  id: 'ev-1',
  tipo: 'Festa',
  titulo: 'Baile de formatura',
  data: '2027-12-11',
  hora: '22:00:00',
  local: 'Espaço Vitrália',
  completo: true,
  fechamento_da_lista: '2027-12-10T01:00:00Z',
  janela_abre_em: '2020-01-01T00:00:00Z',
}

const credencial: CredencialDaPortaria = {
  acesso_id: 'a-1',
  nome: 'João',
  token: 'credencial-do-joao',
  expira_em: '2099-01-01T00:00:00Z',
  evento,
}

const lista: ListaDaPortaria = {
  evento,
  total: 1,
  validados: 0,
  sem_titular: 0,
  janela_aberta: true,
  gerada_em: '2027-12-12T01:00:00Z',
  convites: [
    {
      id: 'c-1',
      evento_id: 'ev-1',
      codigo: 'MED27-AAAA',
      nome_do_convidado: 'Maria Avó',
      documento: 'RG ••••6789',
      convidado_de: 'Ana Souza',
      origem: 'Comprado',
      situacao: 'Valido',
      motivo_da_revogacao: null,
      entrada: null,
      entrou_sem_rede_duas_vezes: false,
      observacoes: null,
    },
  ],
}

describe('PortariaDoAcessoPage', () => {
  beforeEach(() => localStorage.clear())

  afterEach(() => {
    sessao.encerrar()
    localStorage.clear()
  })

  it('com a comissão logada, não gasta o link e explica para quem ele é', async () => {
    entrarComo('Comissao')
    let ativou = false
    servidor.use(
      http.post(`${API}/api/v1/festa/portaria/acessos/ativar`, () => {
        ativou = true
        return HttpResponse.json(credencial)
      }),
    )

    renderizar(<PortariaDoAcessoPage />, '/portaria/acesso/tok-1', CAMINHO)

    expect(
      await screen.findByRole('heading', { name: 'Este link é para quem fica na porta' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Liberar este celular/ })).not.toBeInTheDocument()
    expect(ativou).toBe(false)
  })

  it('libera o celular, guarda a credencial e busca a lista com ela', async () => {
    let corpo: unknown = null
    let autorizacao: string | null = null
    servidor.use(
      http.post(`${API}/api/v1/festa/portaria/acessos/ativar`, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json(credencial)
      }),
      http.get(`${API}/api/v1/festa/portaria`, ({ request }) => {
        autorizacao = request.headers.get('Authorization')
        return HttpResponse.json(lista)
      }),
    )

    renderizar(<PortariaDoAcessoPage />, '/portaria/acesso/tok-1', CAMINHO)
    await userEvent.click(await screen.findByRole('button', { name: /Liberar este celular/ }))

    expect(await screen.findByText('Maria Avó')).toBeInTheDocument()
    expect(screen.getByText(/Liberado para/)).toHaveTextContent('Liberado para João')
    expect(corpo).toEqual({ token: 'tok-1' })
    expect(autorizacao).toBe('Bearer credencial-do-joao')
    expect(credencialDaPortaria.ler()?.acesso_id).toBe('a-1')
  })

  it('acesso cortado pela comissão esquece a credencial', async () => {
    credencialDaPortaria.gravar(credencial)
    servidor.use(
      http.get(`${API}/api/v1/festa/portaria`, () =>
        HttpResponse.json({ status: 403, codigo: 'auth.sem_permissao' }, { status: 403 }),
      ),
    )

    renderizar(<PortariaDoAcessoPage />, '/portaria/acesso', CAMINHO)

    expect(await screen.findByRole('heading', { name: 'Acesso encerrado' })).toBeInTheDocument()
    expect(credencialDaPortaria.ler()).toBeNull()
  })
})
