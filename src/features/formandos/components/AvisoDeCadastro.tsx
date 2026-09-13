import { Link } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useMeuPerfil } from '../hooks/useMeuPerfil'

/**
 * Lembrete no início para quem ainda não preencheu o essencial. Some quando o essencial está lá.
 *
 * Lembra, não bloqueia: travar o acesso até o cadastro estar completo garante que metade da turma
 * nunca entre uma segunda vez.
 */
export function AvisoDeCadastro() {
  const perfil = useMeuPerfil()

  if (!perfil.data?.essencialPendente) return null

  return (
    <section
      aria-label="Seu cadastro"
      className="bg-warning-bg text-warning-text motion-safe:animate-entrar flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4 text-sm"
    >
      <p>
        Complete seu cadastro: a comissão precisa do seu nome completo, CPF e telefone para emitir as
        cobranças.
      </p>
      <Link to={ROTAS.meuCadastro} className="ml-auto font-medium underline">
        Completar cadastro
      </Link>
    </section>
  )
}
