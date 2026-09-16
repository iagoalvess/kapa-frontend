import { AlertTriangle, CheckCheck, Clock, Send } from 'lucide-react'
import { Chip } from '@/components/Chip'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { formatarData, formatarDataHora } from '@/lib/formato'
import { useHistorico } from '../hooks/useRegras'
import {
  marcoDoDegrau,
  type Notificacao,
  ROTULOS_DE_CANAL,
  ROTULOS_DE_STATUS,
  type StatusDaNotificacao,
} from '../types/notificacoes.types'

const TAMANHO_DA_PAGINA = 20

const TONS: Record<StatusDaNotificacao, 'sucesso' | 'cinza' | 'perigo'> = {
  Entregue: 'sucesso',
  Enfileirada: 'cinza',
  Falhou: 'perigo',
}

/** Só os três que existem — o filtro não inventa situação que a API não devolve. */
const SITUACOES: StatusDaNotificacao[] = ['Enfileirada', 'Entregue', 'Falhou']

/**
 * Quem recebeu o quê, quando, por qual canal e com qual resultado.
 *
 * É o que a tesouraria abre quando alguém diz "nunca fui avisado" — e é onde o e-mail recusado em
 * definitivo aparece com o motivo, porque a régua para de tentar aquele endereço.
 */
export default function HistoricoDeAvisosPage() {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const status = (parametros.get('status') as StatusDaNotificacao | null) ?? undefined

  const historico = useHistorico({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    status,
    busca: busca || undefined,
    ordenar_por: parametros.get('ordenar_por') ?? undefined,
    descendente: parametros.get('descendente') === '1',
  })

  const itens = historico.data?.itens ?? []
  const falhas = itens.filter((item) => item.status === 'Falhou').length

  return (
    <>
      <LinkDeVolta para={ROTAS.regua}>Lembretes automáticos</LinkDeVolta>

      <FaixaDeIndicadores
        rotulo="Resumo dos avisos"
        indicadores={[
          { rotulo: 'Avisos no filtro', valor: historico.data?.total ?? null, icone: Send },
          {
            rotulo: 'Entregues nesta página',
            valor: historico.data ? itens.filter((item) => item.status === 'Entregue').length : null,
            icone: CheckCheck,
          },
          {
            rotulo: 'Falhas nesta página',
            valor: historico.data ? falhas : null,
            icone: AlertTriangle,
            sinal: falhas > 0 ? { texto: 'conferir contatos', tom: 'negativo' } : undefined,
          },
          {
            rotulo: 'Último envio',
            valor: historico.data ? (itens[0] ? formatarDataHora(itens[0].enviada_em) : 'Nenhum') : null,
            icone: Clock,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip ativo={!status} tom="claro" onClick={() => atualizar({ status: null })}>
            Todos
          </Chip>
        }
        legenda="Situação do envio"
        filtros={SITUACOES.map((situacao) => (
          <Chip
            key={situacao}
            ativo={status === situacao}
            onClick={() => atualizar({ status: status === situacao ? null : situacao })}
          >
            {ROTULOS_DE_STATUS[situacao]}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar destinatário',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        contagem={
          historico.data
            ? { mostrando: itens.length, total: historico.data.total, unidade: 'avisos' }
            : undefined
        }
      />

      <Planilha
        rotulo="Avisos enviados"
        consulta={historico}
        vazio={{
          titulo: 'Nenhum aviso enviado ainda',
          dica: 'A régua roda todo dia útil, das 9h às 20h. Quando ela falar com alguém, o registro aparece aqui.',
        }}
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
        ordenacao={{
          por: parametros.get('ordenar_por') ?? undefined,
          descendente: parametros.get('descendente') === '1',
          aoOrdenar: (coluna) =>
            atualizar(
              parametros.get('ordenar_por') !== coluna
                ? { ordenar_por: coluna, descendente: null }
                : parametros.get('descendente') === '1'
                  ? { ordenar_por: null, descendente: null }
                  : { ordenar_por: coluna, descendente: '1' },
            ),
        }}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="destinatario">Destinatário</ColunaOrdenavel>
            <th className="py-3 pr-4 font-normal">Assunto</th>
            <th className="py-3 pr-4 font-normal">Degrau</th>
            <th className="py-3 pr-4 font-normal">Canal</th>
            <ColunaOrdenavel coluna="data">Dia</ColunaOrdenavel>
            <th className="py-3 font-normal">Resultado</th>
          </>
        }
      >
        {itens.map((aviso) => (
          <Linha key={aviso.id} aviso={aviso} />
        ))}
      </Planilha>
    </>
  )
}

function Linha({ aviso }: { aviso: Notificacao }) {
  return (
    <tr className="border-b last:border-0">
      {/* `min-w-0` não serve numa célula: é o `max-w` que faz o texto longo truncar em vez de esticar a tabela. */}
      <td className="max-w-56 py-3 pr-4">
        <p className="text-foreground truncate font-medium">{aviso.nome ?? 'Tesouraria'}</p>
        <p className="text-texto-muted truncate text-xs">{aviso.destinatario}</p>
      </td>
      <td className="text-muted-foreground max-w-72 truncate py-3 pr-4">{aviso.assunto}</td>
      <td className="text-muted-foreground py-3 pr-4">{marcoDoDegrau(aviso)}</td>
      <td className="text-muted-foreground py-3 pr-4">{ROTULOS_DE_CANAL[aviso.canal]}</td>
      <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">
        {formatarData(aviso.data_de_referencia)}
      </td>
      <td className="py-3">
        <Selo tom={TONS[aviso.status]}>{ROTULOS_DE_STATUS[aviso.status]}</Selo>
        {aviso.erro ? <p className="text-texto-muted mt-1 max-w-56 truncate text-xs">{aviso.erro}</p> : null}
      </td>
    </tr>
  )
}
