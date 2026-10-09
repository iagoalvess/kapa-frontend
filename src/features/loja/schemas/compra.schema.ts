import { z } from 'zod'
import { inteiroEmTexto } from '@/lib/esquemas'
import { soDigitos } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { MEIOS_DE_PAGAMENTO, type MeioDePagamento } from '@/types/pagamento'
import type { DadosDaCompra } from '../types/loja.types'

/*
  Validação de **forma**. O dígito verificador do CPF, o limite por pessoa e o estoque voltam da API
  (`loja.cpf_invalido` no campo, `loja.limite_por_pessoa` e `loja.esgotado` no formulário) — aqui só o
  que dá para dizer antes de gastar uma ida à fila da turma.
*/

const obrigatorio = (mensagem: string, maximo = 200) => z.string().trim().min(1, mensagem).max(maximo)

/** Quem vai usar um convite: nome e documento já na compra — o e-mail do convidado fica para o link. */
const esquemaDoTitular = z.object({
  nome: obrigatorio('Informe o nome de quem vai usar.', 120),
  tipo_do_documento: z.enum(['Cpf', 'Rg']),
  numero_do_documento: obrigatorio('Informe o documento.', 20),
})

type TitularDoConvite = z.infer<typeof esquemaDoTitular>

/** Um titular em branco, com CPF como documento. */
export const titularEmBranco = (): TitularDoConvite => ({
  nome: '',
  tipo_do_documento: 'Cpf',
  numero_do_documento: '',
})

export const esquemaDaCompra = z.object({
  quantidade: inteiroEmTexto(1, 10_000, 'Escolha ao menos 1 convite.'),
  nome: obrigatorio('Informe o seu nome.', 120),
  email: z.string().trim().email('Informe um e-mail válido — é para ele que vão os convites.'),
  cpf: z
    .string()
    .trim()
    .refine((valor) => soDigitos(valor).length === 11, 'O CPF tem 11 números.'),
  // Os meios vêm do mapa único (`types/pagamento`); quais a loja aceita é a API que diz.
  meio: z.custom<MeioDePagamento>(
    (valor) => typeof valor === 'string' && ehOpcao(valor, MEIOS_DE_PAGAMENTO),
    'Escolha como pagar.',
  ),
  /** Um por convite, na ordem — a tela acompanha a quantidade. */
  convidados: z.array(esquemaDoTitular),
  /** O aceite da base legal e do descarte dos dados (decisão 5). */
  ciente: z.boolean().refine(Boolean, 'Confirme que leu como seus dados são usados.'),
})

export type FormularioDaCompra = z.infer<typeof esquemaDaCompra>

/**
 * O formulário vazio: um convite, pelo primeiro meio que a loja aceita.
 *
 * @param meio O primeiro de `meios` da loja.
 */
export const compraEmBranco = (meio: MeioDePagamento = 'Pix'): FormularioDaCompra => ({
  quantidade: '1',
  nome: '',
  email: '',
  cpf: '',
  meio,
  convidados: [titularEmBranco()],
  ciente: false,
})

/**
 * O formulário no corpo da API.
 *
 * @param valores Já validados.
 * @param itemId O convite escolhido.
 * @param chave A chave de idempotência sorteada ao abrir o formulário — a mesma em toda tentativa.
 */
export function paraDadosDaCompra(valores: FormularioDaCompra, itemId: string, chave: string): DadosDaCompra {
  return {
    item_de_cobranca_id: itemId,
    quantidade: Number(valores.quantidade),
    nome: valores.nome.trim(),
    email: valores.email.trim(),
    cpf: soDigitos(valores.cpf),
    meio: valores.meio,
    chave_de_idempotencia: chave,
    convidados: valores.convidados.map((convidado) => ({
      nome: convidado.nome.trim(),
      tipo_do_documento: convidado.tipo_do_documento,
      numero_do_documento: convidado.numero_do_documento.trim(),
      email: null,
    })),
    leu_a_politica: valores.ciente,
  }
}
