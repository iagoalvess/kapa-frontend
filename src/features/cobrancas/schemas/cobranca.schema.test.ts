import { describe, expect, it } from 'vitest'
import {
  esquemaDeItem,
  itemEmBranco,
  lerPercentual,
  paraDadosDoItem,
  paraDadosDoPlano,
  paraFormularioDeItem,
  esquemaDoPlano,
  paraFormularioDoPlano,
} from './cobranca.schema'

describe('item do plano', () => {
  it('por parcela vira total: 350 × 24 é 8.400', () => {
    const dados = paraDadosDoItem({ ...itemEmBranco(), valor_em_centavos: 35_000, primeiro_mes: '2026-03' })

    expect(dados).toMatchObject({
      valor_em_centavos: 840_000,
      numero_de_parcelas: 24,
      primeiro_mes: '2026-03-01',
    })
    expect(dados.descricao).toBeUndefined()
  })

  it('total vai como veio, e a volta abre "total" quando não divide exato', () => {
    const dados = paraDadosDoItem({
      ...itemEmBranco(),
      modoDoValor: 'total',
      valor_em_centavos: 100_000,
      numero_de_parcelas: '3',
      primeiro_mes: '2026-03',
    })

    expect(dados.valor_em_centavos).toBe(100_000)
    expect(paraFormularioDeItem(dados)).toMatchObject({ modoDoValor: 'total', valor_em_centavos: 100_000 })
  })

  it('a volta abre "por parcela" quando o total divide exato', () => {
    const formulario = paraFormularioDeItem({
      tipo: 'Mensalidade',
      valor_em_centavos: 840_000,
      numero_de_parcelas: 24,
      dia_de_vencimento: 31,
      primeiro_mes: '2026-03-01',
    })

    expect(formulario).toMatchObject({
      modoDoValor: 'parcela',
      valor_em_centavos: 35_000,
      dia_de_vencimento: '31',
      primeiro_mes: '2026-03',
    })
  })

  it('recusa valor zero, dia 32 e mês fora do formato', () => {
    const resultado = esquemaDeItem.safeParse({
      ...itemEmBranco(),
      valor_em_centavos: 0,
      dia_de_vencimento: '32',
      primeiro_mes: '03/2026',
    })

    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues.map((erro) => erro.path[0])).toEqual(
      expect.arrayContaining(['valor_em_centavos', 'dia_de_vencimento', 'primeiro_mes']),
    )
  })
})

/** O item do rateio: uma avulsa de R$ 100 em uma vez — "o buffet subiu". */
const rateavel = () => ({
  ...itemEmBranco(),
  tipo: 'Avulsa' as const,
  descricao: 'Rateio do buffet',
  valor_em_centavos: 10_000,
  numero_de_parcelas: '1',
})

describe('rateio extraordinário', () => {
  it('sem a marca, o rateio não viaja para a API', () => {
    const dados = paraDadosDoItem({ ...rateavel(), origem_da_decisao: 'assembleia de 12/10' })

    expect(dados.aplicar_a_quem_ja_aderiu).toBeUndefined()
    expect(dados.origem_da_decisao).toBeUndefined()
  })

  it('com a marca, leva a origem sem espaço em volta', () => {
    const dados = paraDadosDoItem({
      ...rateavel(),
      aplicar_a_quem_ja_aderiu: true,
      origem_da_decisao: ' assembleia de 12/10 ',
    })

    expect(dados).toMatchObject({ aplicar_a_quem_ja_aderiu: true, origem_da_decisao: 'assembleia de 12/10' })
  })

  it('marcado, exige a origem e recusa mês que já passou', () => {
    const resultado = esquemaDeItem.safeParse({
      ...rateavel(),
      aplicar_a_quem_ja_aderiu: true,
      origem_da_decisao: '   ',
      primeiro_mes: '2020-01',
    })

    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues.map((erro) => erro.path[0])).toEqual(
      expect.arrayContaining(['origem_da_decisao', 'primeiro_mes']),
    )
  })

  it('desmarcado, mês passado continua válido — o item novo só alcança quem aderir depois', () => {
    const resultado = esquemaDeItem.safeParse({ ...rateavel(), primeiro_mes: '2020-01' })

    expect(resultado.success).toBe(true)
  })
})

describe('regras do plano', () => {
  it('percentual com vírgula ou ponto vira base 10.000, e a volta mostra duas casas', () => {
    expect(lerPercentual('2,5')).toBe(250)
    expect(lerPercentual('0.33')).toBe(33)
    expect(lerPercentual('2,555')).toBeNull()
    expect(lerPercentual('abc')).toBeNull()

    const dados = paraDadosDoPlano({
      nome: ' Plano 2027 ',
      multa: '2',
      jurosAoMes: '1,5',
      carencia_em_dias: '5',
      descontoPorAntecipacao: '0',
      dias_minimos_para_desconto: '0',
    })

    expect(dados).toEqual({
      nome: 'Plano 2027',
      percentual_de_multa: 200,
      percentual_de_juros_ao_mes: 150,
      carencia_em_dias: 5,
      percentual_de_desconto_por_antecipacao: 0,
      dias_minimos_para_desconto: 0,
    })
    expect(
      paraFormularioDoPlano({ ...dados, id: 'p', status: 'Rascunho', itens: [], formandos_com_parcela: 0 })
        .jurosAoMes,
    ).toBe('1,50')
  })

  it('desconto sem antecedência é recusado — senão ele sai para quem paga um dia antes', () => {
    const base = {
      nome: 'Plano 2027',
      multa: '2',
      jurosAoMes: '1',
      carencia_em_dias: '0',
      dias_minimos_para_desconto: '0',
    }

    expect(esquemaDoPlano.safeParse({ ...base, descontoPorAntecipacao: '5' }).success).toBe(false)
    expect(esquemaDoPlano.safeParse({ ...base, descontoPorAntecipacao: '0' }).success).toBe(true)
    expect(
      esquemaDoPlano.safeParse({
        ...base,
        descontoPorAntecipacao: '5',
        dias_minimos_para_desconto: '30',
      }).success,
    ).toBe(true)
  })
})
