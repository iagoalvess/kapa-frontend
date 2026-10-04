import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MODULOS, type Modulo } from '@/config/planos'
import { ROTAS } from '@/config/rotas'
import { sessao } from '@/lib/http/sessao'
import { renderizar } from '@/test/utils'
import { PreviaDaArea } from './PreviaDaArea'

/**
 * Cada área trancada pela rota leva a uma maquete própria. A lista é a de `PreviaDaArea`: uma linha
 * por caminho, com um texto que só aparece naquela maquete — o título de um cartão ou o rótulo de um
 * indicador. Se o exemplo for apagado por engano, o teste diz qual.
 */
const CASOS: readonly { nome: string; modulo: Modulo; caminho: string; texto: string }[] = [
  { nome: 'mural', modulo: MODULOS.mural, caminho: ROTAS.mural, texto: 'Avisos publicados' },
  { nome: 'acervo', modulo: MODULOS.mural, caminho: ROTAS.documentos, texto: 'Categorias em uso' },
  { nome: 'orçamento da festa', modulo: MODULOS.festa, caminho: ROTAS.festa, texto: 'Falta juntar' },
  {
    nome: 'meus convites',
    modulo: MODULOS.festa,
    caminho: ROTAS.meusConvites,
    texto: 'Convidado a definir',
  },
  { nome: 'mesas', modulo: MODULOS.mesas, caminho: ROTAS.mesas, texto: 'Mapa do salão' },
  { nome: 'portaria', modulo: MODULOS.festa, caminho: ROTAS.portaria, texto: 'Convites válidos' },
  { nome: 'compras da loja', modulo: MODULOS.festa, caminho: ROTAS.comprasDaLoja, texto: 'Aguardando PIX' },
  {
    nome: 'avisos enviados',
    modulo: MODULOS.avisos,
    caminho: ROTAS.avisosEnviados,
    texto: 'Momento do lembrete',
  },
  { nome: 'lembretes', modulo: MODULOS.avisos, caminho: ROTAS.regua, texto: 'Sequência de lembretes' },
  {
    nome: 'relatórios',
    modulo: MODULOS.relatorios,
    caminho: ROTAS.relatorios,
    texto: 'Saídas por categoria',
  },
  {
    nome: 'auditoria',
    modulo: MODULOS.auditoria,
    caminho: ROTAS.auditoria,
    texto: 'O que aconteceu na turma',
  },
]

describe('PreviaDaArea', () => {
  afterEach(() => sessao.encerrar())

  it.each(CASOS)('desenha a maquete de $nome com dados de exemplo', ({ modulo, caminho, texto }) => {
    renderizar(<PreviaDaArea modulo={modulo} caminho={caminho} />, caminho)

    expect(screen.getByText(texto)).toBeInTheDocument()
  })
})
