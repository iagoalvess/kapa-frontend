import { z } from 'zod'
import { type DadosDoOpcional, type ItemDeCobranca, TIPOS_DOS_OPCIONAIS } from '../types/cobrancas.types'
import { inteiroEmTexto } from '@/lib/esquemas'
import { deCampoDeDataHora, paraCampoDeDataHora } from '@/lib/formato'

/*
  Validação de **forma**. O que depende do estado — estoque abaixo do já reservado, item da festa já
  ligado, item em uso — volta da API com o código (`cobranca.estoque_menor_que_reservado`,
  `cobranca.item_da_festa_invalido`, `cobranca.item_em_uso`) e a mensagem pronta.

  O preço aqui é **unitário** (decisão 2): "R$ 180 cada", e quem multiplica pela quantidade é o
  pedido. Por isso não há o seletor "por parcela / total" do item do plano — não existe total sem
  quantidade.
*/

const TIPOS = TIPOS_DOS_OPCIONAIS

/** Campo numérico opcional: vazio é "sem limite", e não zero. */
const opcional = (maximo: number, mensagem: string) =>
  z
    .string()
    .trim()
    .refine(
      (valor) => valor === '' || (/^\d+$/.test(valor) && Number(valor) >= 1 && Number(valor) <= maximo),
      mensagem,
    )

export const esquemaDeOpcional = z
  .object({
    tipo: z.enum(TIPOS),
    descricao: z
      .string()
      .trim()
      .min(1, 'Dê um nome ao item — é o que o formando vê na vitrine.')
      .max(120, 'O nome deve ter no máximo 120 caracteres.'),
    /** Preço de **uma** unidade, em centavos. */
    valor_em_centavos: z.number().int().positive('Informe o preço de uma unidade, maior que zero.'),
    numero_de_parcelas: inteiroEmTexto(1, 120, 'De 1 a 120 parcelas.'),
    dia_de_vencimento: inteiroEmTexto(1, 31, 'Escolha um dia de 1 a 31.'),
    /** Vazio: sem cota por formando. */
    limite_por_formando: opcional(10_000, 'A cota por formando vai de 1 a 10.000.'),
    /** Vazio: sem teto. */
    estoque: opcional(10_000, 'O estoque vai de 1 a 10.000.'),
    /** `aaaa-mm-ddThh:mm`, no relógio de quem digita; vazio, aberto desde sempre. Vai à API em UTC. */
    abertura_de_vendas: z.string(),
    /** `aaaa-mm-dd`; vazio, sem prazo. */
    pedidos_ate_dia: z.string(),
    /** O item da festa que este item vende; vazio é "Nenhum". */
    item_da_festa_id: z.string(),
    /** Vitrine do formando ou loja pública (Sprint 26). */
    modo_de_venda: z.enum(['AoFormando', 'Publica']),
    /** Preço na loja, em centavos; zero é "o mesmo do formando". */
    preco_publico_em_centavos: z.number().int().min(0),
  })
  // Prazo antes da abertura é uma venda que nunca abre: a API recusa, e é melhor dizer antes.
  .superRefine((valores, contexto) => {
    if (
      valores.abertura_de_vendas &&
      valores.pedidos_ate_dia &&
      valores.pedidos_ate_dia < valores.abertura_de_vendas.slice(0, 10)
    )
      contexto.addIssue({
        code: 'custom',
        path: ['pedidos_ate_dia'],
        message: 'O prazo para pedir não pode ser anterior à abertura das vendas.',
      })

    // A loja vende só o convite da festa: a API recusa o resto com `loja.so_convite`.
    if (valores.modo_de_venda === 'Publica' && valores.tipo !== 'ConviteExtra')
      contexto.addIssue({
        code: 'custom',
        path: ['modo_de_venda'],
        message: 'A loja pública vende só o convite da festa.',
      })
  })

export type FormularioDeOpcional = z.infer<typeof esquemaDeOpcional>

/** O formulário vazio: convite extra, em 1×, todo dia 10, sem cota, sem teto e sem prazo. */
export const opcionalEmBranco = (): FormularioDeOpcional => ({
  tipo: 'ConviteExtra',
  descricao: 'Convite extra',
  valor_em_centavos: 0,
  numero_de_parcelas: '1',
  dia_de_vencimento: '10',
  limite_por_formando: '',
  estoque: '',
  abertura_de_vendas: '',
  pedidos_ate_dia: '',
  item_da_festa_id: '',
  modo_de_venda: 'AoFormando',
  preco_publico_em_centavos: 0,
})

/**
 * O que o formulário vira na API.
 *
 * O campo vazio some do corpo em vez de virar zero: "sem cota" e "cota de zero" são coisas
 * diferentes, e o segundo travaria a venda inteira.
 *
 * @param formulario Valores já validados pelo esquema.
 * @param primeiroMes Mês do primeiro vencimento, `aaaa-mm-dd`. O item novo começa no mês corrente;
 *   o editado conserva o que já tinha, senão alterar um item em uso esbarraria em
 *   `cobranca.item_em_uso` por causa de um campo que a tela nem mostra.
 */
export function paraDadosDoOpcional(formulario: FormularioDeOpcional, primeiroMes: string): DadosDoOpcional {
  return {
    tipo: formulario.tipo,
    descricao: formulario.descricao.trim(),
    valor_em_centavos: formulario.valor_em_centavos,
    numero_de_parcelas: Number(formulario.numero_de_parcelas),
    dia_de_vencimento: Number(formulario.dia_de_vencimento),
    primeiro_mes: primeiroMes,
    limite_por_formando: numero(formulario.limite_por_formando),
    estoque: numero(formulario.estoque),
    abertura_de_vendas: deCampoDeDataHora(formulario.abertura_de_vendas) ?? undefined,
    pedidos_ate_dia: data(formulario.pedidos_ate_dia),
    item_da_festa_id: data(formulario.item_da_festa_id),
    modo_de_venda: formulario.modo_de_venda,
    preco_publico_em_centavos:
      formulario.modo_de_venda === 'Publica' && formulario.preco_publico_em_centavos > 0
        ? formulario.preco_publico_em_centavos
        : undefined,
  }
}

/** O campo vazio some do corpo em vez de virar zero: "sem cota" e "cota de zero" são coisas diferentes. */
const numero = (texto: string) => (texto === '' ? undefined : Number(texto))

const data = (texto: string) => (texto === '' ? undefined : texto)

/** Do lado de volta: nulo e ausente viram o campo em branco, que é o que "sem limite" parece. */
const texto = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined ? '' : String(valor)

/** Um item opcional já gravado, de volta ao formulário. */
export function paraFormularioDoOpcional(item: ItemDeCobranca): FormularioDeOpcional {
  return {
    // Opcional só nasce com tipo de opcional: a API recusa os do plano (`cobranca.tipo_invalido`).
    tipo: item.tipo as FormularioDeOpcional['tipo'],
    descricao: item.descricao ?? '',
    valor_em_centavos: item.valor_em_centavos,
    numero_de_parcelas: String(item.numero_de_parcelas),
    dia_de_vencimento: String(item.dia_de_vencimento),
    limite_por_formando: texto(item.limite_por_formando),
    estoque: texto(item.estoque),
    abertura_de_vendas: paraCampoDeDataHora(item.abertura_de_vendas),
    pedidos_ate_dia: texto(item.pedidos_ate_dia),
    item_da_festa_id: texto(item.item_da_festa_id),
    modo_de_venda: item.modo_de_venda,
    preco_publico_em_centavos: item.preco_publico_em_centavos ?? 0,
  }
}

/** O dia 1 do mês corrente, `aaaa-mm-dd` — o primeiro vencimento de um item opcional novo. */
export function mesDeHoje(hoje = new Date()) {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
}
