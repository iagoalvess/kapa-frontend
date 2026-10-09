import { DialogoDeSenha } from '@/features/auth'
import MeuPerfilPage from '@/features/formandos/pages/MeuPerfilPage'

/**
 * O próprio cadastro na turma, com a troca de senha no pé do resumo.
 *
 * Mora em `app/` porque compõe duas features: o cadastro é de `formandos` e a senha é de `auth` — e uma
 * feature não importa de outra.
 */
export default function PaginaDoMeuCadastro() {
  return <MeuPerfilPage acoes={<DialogoDeSenha />} />
}
