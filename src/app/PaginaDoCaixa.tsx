import { CaixaPage } from '@/features/financeiro'
import { AdimplenciaEFornecedores } from '@/features/relatorios'

/**
 * "Cadê o dinheiro": a prestação de contas da turma, em uma tela.
 *
 * É o que o formando abre e o que a comissão manda no grupo quando alguém pergunta. **Nenhum número
 * daqui aponta para uma pessoa** — são todos somas.
 *
 * Mora em `app/` porque compõe duas features: o caixa, a projeção e o extrato são de `financeiro`;
 * a adimplência e o gasto por fornecedor vêm do painel da turma, em `relatorios`. Uma feature não
 * importa de outra.
 */
export default function PaginaDoCaixa() {
  return <CaixaPage Complemento={AdimplenciaEFornecedores} />
}
