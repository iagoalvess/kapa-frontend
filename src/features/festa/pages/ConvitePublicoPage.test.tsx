import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { EventoDoConvite } from '@/types/festa'
import type { ConsultaNaPortaria, ConvitePublico } from '../types/convites.types'
import ConvitePublicoPage from './ConvitePublicoPage'

const TOKEN = 'MED27-7QK4-ABCDEFGH'
const CONVITES = `${env.VITE_API_URL}/api/v1/festa/convites`

const evento: EventoDoConvite = {
  id: 'ev-1',
  tipo: 'Festa',
  titulo: 'Festa de formatura',
  data: '2027-12-11',
  hora: '22:00:00',
  local: 'Espaço Vitrália',
  completo: true,
  fechamento_da_lista: '2027-12-11T01:00:00Z',
  janela_abre_em: '2027-12-11T19:00:00Z',
}

const convite: ConvitePublico = {
  turma: 'Medicina 2027',
  instituicao: 'UFPR',
  evento,
  codigo: 'MED27-7QK4',
  token: TOKEN,
  nome_do_convidado: 'Maria Silva',
  documento: 'RG ••••6789',
}

const naPortaria = (janelaAberta: boolean): ConsultaNaPortaria => ({
  evento,
  janela_aberta: janelaAberta,
  convite: {
    id: 'c-1',
    evento_id: 'ev-1',
    codigo: 'MED27-7QK4',
    nome_do_convidado: 'Maria Silva',
    documento: 'RG ••••6789',
    convidado_de: 'Ana Souza',
    origem: 'Comprado',
    situacao: 'Valido',
    motivo_da_revogacao: null,
    entrada: null,
    entrou_sem_rede_duas_vezes: false,
  },
})

function abrir() {
  return renderizar(<ConvitePublicoPage />, `/ingresso/${TOKEN}`, '/ingresso/:token')
}

describe('ConvitePublicoPage', () => {
  afterEach(() => sessao.encerrar())

  it('sem sessão, mostra o convite com o QR e sem a portaria', async () => {
    servidor.use(http.get(`${CONVITES}/${TOKEN}`, () => HttpResponse.json(convite)))

    abrir()

    expect(await screen.findByText('MED27-7QK4')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'QR Code do convite MED27-7QK4' })).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('RG ••••6789')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Validar entrada' })).not.toBeInTheDocument()
  })

  it('convite que não existe (ou foi revogado) diz só que não foi encontrado', async () => {
    servidor.use(
      http.get(`${CONVITES}/${TOKEN}`, () =>
        HttpResponse.json(
          { codigo: 'festa.convite_nao_encontrado', detail: 'Convite não encontrado.' },
          { status: 404 },
        ),
      ),
    )

    abrir()

    expect(await screen.findByRole('heading', { name: 'Convite não encontrado' })).toBeInTheDocument()
  })

  it('a Gestão da turma valida a entrada pela própria página', async () => {
    entrarComo('Comissao')
    servidor.use(
      http.get(`${CONVITES}/${TOKEN}`, () => HttpResponse.json(convite)),
      http.get(`${env.VITE_API_URL}/api/v1/festa/portaria/convites/${TOKEN}`, () =>
        HttpResponse.json(naPortaria(true)),
      ),
      http.post(`${CONVITES}/${TOKEN}/check-in`, () =>
        HttpResponse.json({
          check_in_id: 'k-1',
          validado_em: '2027-12-12T01:14:00Z',
          validado_por: 'Pedro',
          validado_por_usuario_id: 'u-9',
        }),
      ),
    )

    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Validar entrada' }))

    expect(await screen.findByText('Entrada validada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desfazer entrada' })).toBeInTheDocument()
  })

  it('a segunda leitura por outra pessoa mostra quando e por quem, em vez de erro', async () => {
    entrarComo('Comissao')
    servidor.use(
      http.get(`${CONVITES}/${TOKEN}`, () => HttpResponse.json(convite)),
      http.get(`${env.VITE_API_URL}/api/v1/festa/portaria/convites/${TOKEN}`, () =>
        HttpResponse.json(naPortaria(true)),
      ),
      http.post(`${CONVITES}/${TOKEN}/check-in`, () =>
        HttpResponse.json(
          {
            codigo: 'festa.ja_validado',
            detail: 'Já validado.',
            dados: {
              check_in_id: 'k-1',
              validado_em: '2027-12-12T01:14:00Z',
              validado_por: 'Bruno',
              validado_por_usuario_id: 'u-outro',
            },
          },
          { status: 409 },
        ),
      ),
    )

    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Validar entrada' }))

    expect(await screen.findByText(/^Já validado às/)).toBeInTheDocument()
    expect(screen.getByText(/Por Bruno/)).toBeInTheDocument()
  })

  it('fora da janela, a Gestão vê quando a validação abre e não o botão', async () => {
    entrarComo('Tesoureiro')
    servidor.use(
      http.get(`${CONVITES}/${TOKEN}`, () => HttpResponse.json(convite)),
      http.get(`${env.VITE_API_URL}/api/v1/festa/portaria/convites/${TOKEN}`, () =>
        HttpResponse.json(naPortaria(false)),
      ),
    )

    abrir()

    expect(await screen.findByText(/A validação abre em/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Validar entrada' })).not.toBeInTheDocument()
  })

  it('convite de outra turma: a portaria responde 404 e a página continua sendo só o convite', async () => {
    entrarComo('Comissao')
    servidor.use(
      http.get(`${CONVITES}/${TOKEN}`, () => HttpResponse.json(convite)),
      http.get(`${env.VITE_API_URL}/api/v1/festa/portaria/convites/${TOKEN}`, () =>
        HttpResponse.json({ codigo: 'festa.convite_nao_encontrado' }, { status: 404 }),
      ),
    )

    abrir()

    expect(await screen.findByText('MED27-7QK4')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Portaria' })).not.toBeInTheDocument()
  })
})
