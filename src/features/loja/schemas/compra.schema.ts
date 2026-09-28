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
  }
}
