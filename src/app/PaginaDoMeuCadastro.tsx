import { DialogoDeSenha } from '@/features/auth'
import MeuPerfilPage from '@/features/formandos/pages/MeuPerfilPage'
import { MinhasPreferenciasPage } from '@/features/notificacoes'

/**
 * O próprio cadastro na turma, com a troca de senha no pé do resumo e as notificações embaixo.
 *
 * Mora em `app/` porque compõe três features: o cadastro é de `formandos`, a senha é de `auth` e as
 * preferências são de `notificacoes` — e uma feature não importa de outra.
 *
 * As preferências ficam aqui, e não num item de menu próprio: são da conta da pessoa, como a senha,
 * e é neste cartão que ela já está quando pensa "não quero mais este e-mail".
 */
export default function PaginaDoMeuCadastro() {
  return (
    <>
      <MeuPerfilPage acoes={<DialogoDeSenha />} />
      <MinhasPreferenciasPage />
    </>
  )
}
