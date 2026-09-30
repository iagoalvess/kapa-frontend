import { MailCheck, UserPlus, UserRoundX, Users } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { Chip } from '@/components/Chip'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { rotaDaContaNoPainel } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'
import { formatarData, formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { useAnalyticsDoPadrao, useContasDoPainel } from '../hooks/usePainel'
import { type ContaNoPainel, SITUACOES_DA_CONTA } from '../types/painel.types'

const TAMANHO_DA_PAGINA = 20

/**
 * A situação da conta numa palavra. A desativada vence a bloqueada: desbloquear não a traz de volta.
 *
 * @param conta A linha da lista.
 */
function SeloDaConta({ conta }: { conta: ContaNoPainel }) {
  if (!conta.ativo) return <Selo tom="perigo">Desativada</Selo>
  if (conta.bloqueado_ate) return <Selo tom="alerta">Bloqueada</Selo>
  if (!conta.email_confirmado) return <Selo tom="cinza">Sem confirmação</Selo>
  return <Selo tom="sucesso">Confirmada</Selo>
}

/**
 * As contas da plataforma (Sprint 44, D2): planilha paginada no servidor, com chips por situação, busca por nome
 * ou e-mail e ordenação — o estado inteiro na URL. O nome abre a conta no painel, onde ficam as ações.
 */
export default function ContasDoPainelPage() {
  const tamanho = useTamanhoDaPagina(TAMANHO_DA_PAGINA)
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const ordenacao = useOrdenacao(atualizar)
  const escolhida = parametros.get('situacao')
  const situacao = ehOpcao(escolhida, SITUACOES_DA_CONTA) ? escolhida : undefined

  const contas = useContasDoPainel({
    pagina,
    tamanho,
    termo: busca || undefined,
    situacao,
    ...ordenacao.filtro,
  })
  const itens = contas.data?.itens ?? []
  const filtrando = Boolean(situacao || busca)
  // Só a faixa e o "Todas" contam: o analytics não separa bloqueada nem desativada, e um número
  // aproximado no chip seria pior que nenhum.
  const resumo = useAnalyticsDoPadrao().data?.contas

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo das contas"
        indicadores={[
          { rotulo: 'Contas', valor: resumo?.total ?? null, icone: Users },
          {
            rotulo: 'E-mail confirmado',
            valor: resumo?.confirmadas ?? null,
            unidade: resumo ? `de ${formatarNumero(resumo.total)}` : undefined,
            icone: MailCheck,
          },
          { rotulo: 'Sem turma', valor: resumo?.sem_turma ?? null, icone: UserRoundX },
          { rotulo: 'Novas em 30 dias', valor: resumo?.no_periodo ?? null, icone: UserPlus },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip
            tom="claro"
            ativo={!situacao}
            contagem={resumo?.total}
            onClick={() => atualizar({ situacao: null })}
          >
            Todas
          </Chip>
        }
        legenda="Situação"
        filtros={Object.entries(SITUACOES_DA_CONTA).map(([valor, rotulo]) => (
          <Chip
            key={valor}
            ativo={situacao === valor}
            onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
          >
            {rotulo}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar por nome ou e-mail',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        contagem={{ mostrando: itens.length, total: contas.data?.total ?? 0, unidade: 'contas' }}
      />

      <Planilha
        rotulo="Lista de contas"
        consulta={contas}
        vazio={{
          titulo: filtrando ? 'Nenhuma conta com esses filtros' : 'Nenhuma conta cadastrada',
          dica: filtrando
            ? 'Tente outro nome, e-mail ou situação.'
            : 'As contas aparecem aqui a cada cadastro.',
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="nome">Conta</ColunaOrdenavel>
            <th className="py-3 pr-4 text-right font-normal">Turmas</th>
            <ColunaOrdenavel coluna="criado_em">Criada em</ColunaOrdenavel>
            <th className="py-3 font-normal">Situação</th>
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {itens.map((conta) => (
          <tr key={conta.id} className="border-b last:border-0">
            <td className="py-3 pr-4">
              <div className="flex min-w-52 items-center gap-3">
                <Avatar nome={conta.nome} semente={conta.id} className="size-8 text-sm" />
                <div className="grid min-w-0">
                  <Link
                    to={rotaDaContaNoPainel(conta.id)}
                    className="text-foreground truncate font-medium hover:underline"
                  >
                    {conta.nome}
                  </Link>
                  <span className="text-texto-muted truncate text-xs">{conta.email}</span>
                </div>
              </div>
            </td>
            <td className="py-3 pr-4 text-right whitespace-nowrap">
              {formatarNumero(conta.turmas)}
              <span className="text-texto-muted lg:hidden"> {conta.turmas === 1 ? 'turma' : 'turmas'}</span>
            </td>
            <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">
              {formatarData(conta.criado_em)}
            </td>
            <td className="py-3">
              <SeloDaConta conta={conta} />
            </td>
          </tr>
        ))}
      </Planilha>
    </>
  )
}
