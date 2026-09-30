import { CalendarPlus, GraduationCap, Repeat, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Chip } from '@/components/Chip'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { rotaDaTurmaNoPainel } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'
import { formatarData, formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { NotaFiscalDosPlanos } from '../components/NotaFiscalDosPlanos'
import { LICENCAS, LICENCAS_DO_FILTRO, SeloDaLicenca } from '../components/SeloDeStatus'
import { useAnalyticsDoPadrao, useTurmasDoPainel } from '../hooks/usePainel'

const TAMANHO_DA_PAGINA = 20

/** Os chips aceitos na URL: `?licenca=Premium`. Qualquer outro valor vale como "Todas". */
const OPCOES_DE_LICENCA = Object.fromEntries(LICENCAS_DO_FILTRO.map((licenca) => [licenca, licenca]))

/**
 * As turmas da plataforma (Sprint 44, D2): planilha paginada no servidor, com chips por licença, busca e
 * ordenação — o estado inteiro na URL, como Despesas e Parcelas.
 *
 * O nome abre a turma no painel. A planilha da nota fiscal dos planos é uma ação desta lista (T5): é daqui que
 * sai a lista de quem pagou o Kapa no mês.
 */
export default function TurmasDoPainelPage() {
  const tamanho = useTamanhoDaPagina(TAMANHO_DA_PAGINA)
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const ordenacao = useOrdenacao(atualizar)
  const escolhida = parametros.get('licenca')
  const licenca = ehOpcao(escolhida, OPCOES_DE_LICENCA) ? escolhida : undefined

  const turmas = useTurmasDoPainel({
    pagina,
    tamanho,
    termo: busca || undefined,
    licenca,
    ...ordenacao.filtro,
  })
  const itens = turmas.data?.itens ?? []
  const resumo = useAnalyticsDoPadrao().data?.formaturas
  const porLicenca = new Map(resumo?.por_licenca.map((linha) => [linha.licenca, linha.turmas]))
  const filtrando = Boolean(licenca || busca)

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo das turmas"
        indicadores={[
          { rotulo: 'Turmas', valor: resumo?.total ?? null, icone: GraduationCap },
          {
            rotulo: 'Pagantes',
            valor: resumo?.pagantes ?? null,
            unidade: resumo ? `de ${formatarNumero(resumo.total)}` : undefined,
            icone: Repeat,
          },
          {
            rotulo: 'No gratuito',
            valor: resumo ? (porLicenca.get('Gratuito') ?? 0) : null,
            icone: Sparkles,
          },
          { rotulo: 'Novas em 30 dias', valor: resumo?.novas_no_periodo ?? null, icone: CalendarPlus },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip
            tom="claro"
            ativo={!licenca}
            contagem={resumo?.total}
            onClick={() => atualizar({ licenca: null })}
          >
            Todas
          </Chip>
        }
        legenda="Licença"
        filtros={LICENCAS_DO_FILTRO.map((valor) => (
          <Chip
            key={valor}
            ativo={licenca === valor}
            contagem={resumo ? (porLicenca.get(valor) ?? 0) : undefined}
            onClick={() => atualizar({ licenca: licenca === valor ? null : valor })}
          >
            {ehOpcao(valor, LICENCAS) ? LICENCAS[valor].rotulo : valor}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar turma, instituição ou curso',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={<NotaFiscalDosPlanos />}
        contagem={{ mostrando: itens.length, total: turmas.data?.total ?? 0, unidade: 'turmas' }}
      />

      <Planilha
        rotulo="Lista de turmas"
        consulta={turmas}
        vazio={{
          titulo: filtrando ? 'Nenhuma turma com esses filtros' : 'Nenhuma turma na plataforma',
          dica: filtrando
            ? 'Tente outro nome, instituição ou licença.'
            : 'As turmas aparecem aqui assim que a primeira comissão se cadastrar.',
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="nome">Turma</ColunaOrdenavel>
            {/* Os membros saem de subconsulta sobre os vínculos: não ordenam. */}
            <th className="py-3 pr-4 text-right font-normal">Membros</th>
            <ColunaOrdenavel coluna="criada_em">Criada em</ColunaOrdenavel>
            <th className="py-3 font-normal">Licença</th>
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {itens.map((turma) => (
          <tr key={turma.id} className="border-b last:border-0">
            <th scope="row" className="grid min-w-52 py-3 pr-4 text-left font-normal">
              <Link
                to={rotaDaTurmaNoPainel(turma.id)}
                className="text-foreground truncate font-medium hover:underline"
              >
                {turma.nome}
              </Link>
              <span className="text-texto-muted truncate text-xs">
                {turma.curso} · {turma.instituicao}
              </span>
            </th>
            <td className="py-3 pr-4 text-right whitespace-nowrap">
              {formatarNumero(turma.membros)}
              <span className="text-texto-muted lg:hidden"> membros</span>
            </td>
            <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">
              {formatarData(turma.criada_em)}
            </td>
            <td className="py-3">
              <SeloDaLicenca licenca={turma.licenca} />
            </td>
          </tr>
        ))}
      </Planilha>
    </>
  )
}
