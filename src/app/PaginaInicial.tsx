import { PAPEIS } from '@/config/perfis'
import { AvisoDeCadastro } from '@/features/formandos'
import { IndicadoresDeMembros } from '@/features/membros'
import { usePapel, useSessao } from '@/hooks/useSessao'

/**
 * Primeira tela depois do login.
 *
 * Por ora mostra o que já existe de número na turma: a faixa de membros, para quem faz a gestão
 * (formando não lê a lista de membros, e a API responderia 403). O painel com caixa e
 * adimplência entra na sprint do dashboard.
 */
export function PaginaInicial() {
  const { usuario } = useSessao()
  const { tem } = usePapel()

  return (
    <>
      <AvisoDeCadastro />
      {tem(PAPEIS.tesoureiro, PAPEIS.comissao) ? <IndicadoresDeMembros /> : null}

      <section className="bg-card shadow-cartao rounded-2xl p-5">
        <h2 className="text-foreground font-medium">Olá, {usuario?.nome || 'visitante'}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Aqui vão aparecer o caixa da turma, as cobranças e os avisos, conforme cada módulo chegar.
        </p>
      </section>
    </>
  )
}
