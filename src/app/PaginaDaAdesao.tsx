import { AdesaoDoFormando } from '@/features/adesoes'
import { DadosDoTitular } from '@/features/formandos'

/**
 * O termo de adesão do próprio membro: ler, aceitar, ver o assinado.
 *
 * Mora em `app/` porque compõe duas features: a adesão pede nome, CPF e nascimento na própria tela,
 * e quem grava o cadastro é `formandos` — uma feature não importa de outra.
 */
export default function PaginaDaAdesao() {
  return <AdesaoDoFormando FormularioDoTitular={DadosDoTitular} />
}
