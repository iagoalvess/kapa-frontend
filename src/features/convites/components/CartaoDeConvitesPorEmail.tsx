import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { useEscritaLiberada, useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarData } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { useConvites, useRevogarConvite } from '../hooks/useConvites'
import type { ConviteResumo, StatusDoConvite } from '../types/convite.types'
import { FormularioDeConvite } from './FormularioDeConvite'

const SITUACOES: Record<StatusDoConvite, { texto: string; tom: 'alerta' | 'sucesso' | 'neutro' | 'perigo' }> =
  {
    Pendente: { texto: 'Pendente', tom: 'alerta' },
    Aceito: { texto: 'Aceito', tom: 'sucesso' },
    Expirado: { texto: 'Expirado', tom: 'neutro' },
    Revogado: { texto: 'Revogado', tom: 'perigo' },
  }

/**
 * O que quem está logado pode oferecer por e-mail agora.
 *
 * @param ehPresidente Só o Presidente convida para a comissão.
 * @param contratada Com a turma paga, formando também entra — no gratuito o plano tem zero vagas.
 */
function papeisOferecidos(ehPresidente: boolean, contratada: boolean): Papel[] {
  const comissao = [PAPEIS.tesoureiro, PAPEIS.comissao, PAPEIS.presidente]
  if (!contratada) return ehPresidente ? comissao : []

  return ehPresidente ? [PAPEIS.formando, ...comissao] : [PAPEIS.formando]
}

/**
 * Convites por e-mail: o formulário e os convites já enviados, com a situação de cada um.
 *
 * Gestão (Comissão e Tesouraria) convida formandos; só o Presidente escolhe outro papel — a tela
 * esconde a escolha, e a API recusa com `convite.papel_restrito` de qualquer forma. No plano
 * gratuito a comissão se monta por aqui; formando só entra depois de contratar, porque o plano
 * gratuito tem zero vagas de formando (a API recusa com `convite.limite_do_plano`).
 */
export function CartaoDeConvitesPorEmail() {
  const { ehPresidente } = usePapel()
  const { data } = useFormaturaAtual()
  // Enquanto carrega, assume contratada — pelo mesmo motivo de `useEscritaLiberada`, e porque
  // trocar a lista de papéis depois remonta o formulário e apaga o que já foi digitado.
  const contratada = data?.ja_contratou ?? true
  const montavel = useEscritaLiberada()
  const papeis = papeisOferecidos(ehPresidente, contratada)
  const convites = useConvites()

  return (
    <Cartao
      titulo="Convites por e-mail"
      icone={Mail}
      descricao={
        contratada
          ? 'O link vai para o e-mail da pessoa e só funciona numa conta com esse e-mail. Vale por 7 dias.'
          : 'No plano gratuito você monta a comissão. Para convidar formandos, contrate um plano. O link vai para o e-mail da pessoa e vale por 7 dias.'
      }
    >
      {/* Chave pelos papéis: a escolha padrão muda quando o status da turma termina de carregar. */}
      <FormularioDeConvite key={papeis.join()} papeis={papeis} desabilitado={!montavel} />

      {convites.isPending ? (
        <EsqueletoDeTabela linhas={3} colunas={3} />
      ) : convites.isError ? (
        <ErroDaConsulta erro={convites.error} />
      ) : (
        <ListaDeConvites convites={convites.data.filter((convite) => !!convite.email)} />
      )}
    </Cartao>
  )
}

function ListaDeConvites({ convites }: { convites: ConviteResumo[] }) {
  if (convites.length === 0)
    return (
      <p className="text-muted-foreground motion-safe:animate-entrar text-sm">
        Nenhum convite enviado ainda.
      </p>
    )

  return (
    <Tabela
      cabecalho={
        <>
          <th className="py-3 pr-4 font-normal">E-mail</th>
          <th className="py-3 pr-4 font-normal">Papel</th>
          <th className="py-3 pr-4 font-normal">Válido até</th>
          <th className="py-3 pr-4 font-normal">Situação</th>
          <th className="py-3 font-normal">
            <span className="sr-only">Ações</span>
          </th>
        </>
      }
    >
      {convites.map((convite) => (
        <LinhaDeConvite key={convite.id} convite={convite} />
      ))}
    </Tabela>
  )
}

function LinhaDeConvite({ convite }: { convite: ConviteResumo }) {
  const revogar = useRevogarConvite()
  const escritaLiberada = useEscritaLiberada()
  const situacao = SITUACOES[convite.status]

  return (
    <tr className="border-b last:border-0">
      <td className="max-w-56 truncate py-3 pr-4">{convite.email}</td>
      <td className="py-3 pr-4">{ROTULOS_DE_PAPEL[convite.papel]}</td>
      <td className="py-3 pr-4">{formatarData(convite.expira_em)}</td>
      <td className="py-3 pr-4">
        <Selo tom={situacao.tom}>{situacao.texto}</Selo>
      </td>
      <td className="py-3 text-right">
        {convite.status === 'Pendente' ? (
          <DialogoDeConfirmacao
            gatilho={
              <Button
                variant="outline"
                size="sm"
                aria-label={`Revogar convite de ${convite.email}`}
                disabled={revogar.isPending || !escritaLiberada}
              >
                Revogar
              </Button>
            }
            titulo="Revogar o convite?"
            descricao={
              <>
                O link que <strong>{convite.email}</strong> recebeu para de funcionar. Se for engano, dá para
                convidar de novo — mas a pessoa recebe outro e-mail, com outro link.
              </>
            }
            rotulo="Revogar"
            destrutivo
            aoConfirmar={() =>
              revogar.mutate(convite.id, {
                onSuccess: () => toast.info('Convite revogado. O link parou de funcionar.'),
                onError: (erro) => toast.error(mensagemDoErro(erro)),
              })
            }
          />
        ) : null}
      </td>
    </tr>
  )
}
