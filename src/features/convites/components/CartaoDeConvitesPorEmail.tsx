import { Ban, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AcaoComConfirmacao, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Paginacao } from '@/components/Paginacao'
import { Tabela } from '@/components/Planilha'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { useEscritaLiberada, useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarData } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { paginar } from '@/lib/paginar'
import { useConvites, useRevogarConvite } from '../hooks/useConvites'
import type { ConviteResumo, StatusDoConvite } from '../types/convite.types'
import { FormularioDeConvite } from './FormularioDeConvite'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'

const SITUACOES: Record<StatusDoConvite, { texto: string; tom: TomDoSelo }> = {
  Pendente: { texto: 'Pendente', tom: 'alerta' },
  Aceito: { texto: 'Aceito', tom: 'sucesso' },
  Expirado: { texto: 'Expirado', tom: 'neutro' },
  Revogado: { texto: 'Revogado', tom: 'perigo' },
}

/**
 * O que quem está logado pode oferecer por e-mail agora.
 *
 * @param ehPresidente Só o Presidente convida para a comissão.
 * @param contratada Com a turma paga, formando também entra — no gratuito só a comissão, dentro das vagas do plano.
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
 * gratuito a comissão se monta por aqui, dentro das poucas vagas do plano; formando só entra depois
 * de contratar. Passar das vagas, de qualquer papel, a API recusa com `plano.limite_de_formandos`.
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
  const tamanhoDaPagina = useTamanhoDaPagina()
  const [paginaPedida, definirPagina] = useState(1)
  const pagina = paginar(convites, paginaPedida, tamanhoDaPagina)

  if (convites.length === 0)
    return (
      <p className="text-muted-foreground motion-safe:animate-entrar text-sm">
        Nenhum convite enviado ainda.
      </p>
    )

  return (
    <div>
      <Tabela
        emLista
        cabecalho={
          <>
            <th className="py-3 pr-4 font-normal">E-mail</th>
            <th className="py-3 pr-4 font-normal">Papel</th>
            <th className="py-3 pr-4 font-normal">Válido até</th>
            <th className="py-3 pr-4 font-normal">Situação</th>
          </>
        }
      >
        {pagina.visiveis.map((convite) => (
          <LinhaDeConvite key={convite.id} convite={convite} />
        ))}
      </Tabela>
      <Paginacao
        pagina={pagina.pagina}
        totalPaginas={pagina.totalPaginas}
        total={pagina.total}
        aoMudar={definirPagina}
      />
    </div>
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
          <AcoesDaLinha rotulo={`Ações do convite de ${convite.email}`}>
            <AcaoComConfirmacao
              rotulo="Revogar"
              descricaoAcessivel={`Revogar convite de ${convite.email}`}
              icone={Ban}
              desabilitada={revogar.isPending || !escritaLiberada}
              confirmacao={{
                titulo: 'Revogar o convite?',
                descricao: (
                  <>
                    O link que <strong>{convite.email}</strong> recebeu para de funcionar. Se for engano, dá
                    para convidar de novo — mas a pessoa recebe outro e-mail, com outro link.
                  </>
                ),
                rotulo: 'Revogar',
                aoConfirmar: () =>
                  revogar.mutate(convite.id, {
                    onSuccess: () => toast.info('Convite revogado. O link parou de funcionar.'),
                    onError: avisarErro,
                  }),
              }}
            />
          </AcoesDaLinha>
        ) : null}
      </td>
    </tr>
  )
}
