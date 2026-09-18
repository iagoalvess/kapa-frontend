import { Bell, CalendarClock, History, Inbox, Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { EditorDeTemplate } from '../components/EditorDeTemplate'
import { useHistorico, useRegua } from '../hooks/useRegras'
import { destinoDoDegrau, marcoDoDegrau, type Regra, tomDoDegrau } from '../types/notificacoes.types'

/** Em palavras, a distância do gatilho — a coluna que explica o `D-5` ao lado. */
function quandoDispara(regra: Regra) {
  const dias = regra.dias_de_deslocamento

  if (regra.gatilho === 'InformePendente') return `Parado há ${dias} dias`
  if (dias === 0) return 'No dia do vencimento'
  if (dias < 0) return `${Math.abs(dias)} dias antes`

  return `${dias} dias depois`
}

/**
 * A régua de cobrança da turma: os degraus na tabela do cartão, do lembrete antes do vencimento à
 * cobrança firme, e o texto de cada um no diálogo de edição.
 *
 * Era uma linha do tempo horizontal em que cada ponto mostrava três coisas e escondia o resto atrás
 * de um clique num círculo de 14px. A ordem — que é o que a linha desenhava — a tabela ordenada já
 * diz, e em troca cabem na tela o assunto, quem recebe e se o degrau está ligado.
 *
 * A turma que nunca configurou nada já vê a régua padrão — a API a materializa na primeira leitura,
 * porque exigir configuração antes de funcionar significa que metade das turmas nunca teria lembrete.
 *
 * O degrau aberto vive na URL (`?degrau=`): recarregar e mandar o link voltam ao mesmo ponto.
 */
export default function ReguaPage() {
  const { parametros, atualizar } = useFiltrosDaUrl()
  const regua = useRegua()
  // Uma linha só: o que se quer daqui é o total de envios, não a lista — ela tem tela própria.
  const historico = useHistorico({ pagina: 1, tamanho: 1 })

  const regras = regua.data?.regras ?? []
  const vencimentos = regras
    .filter((regra) => regra.gatilho === 'Vencimento')
    .toSorted((a, b) => a.dias_de_deslocamento - b.dias_de_deslocamento)
  const fila = regras.filter((regra) => regra.gatilho === 'InformePendente')

  const selecionado = parametros.get('degrau') ?? undefined
  const emEdicao = regras.find((regra) => regra.id === selecionado)
  const ativos = regras.filter((regra) => regra.ativa)

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo da régua"
        indicadores={[
          {
            rotulo: 'Degraus ativos',
            valor: regua.data ? ativos.length : null,
            unidade: `de ${regras.length}`,
            icone: CalendarClock,
          },
          {
            rotulo: 'Avisos enviados',
            valor: historico.data?.total ?? null,
            nota: 'desde o início da turma',
            icone: Mail,
          },
          {
            rotulo: 'Avisa a tesouraria',
            valor: regua.data
              ? regras.filter((regra) => regra.ativa && regra.avisar_tesouraria).length
              : null,
            unidade: 'degraus',
            icone: Bell,
          },
          {
            rotulo: 'Janela de envio',
            valor: '9h às 20h',
            unidade: 'dias úteis',
            icone: CalendarClock,
          },
        ]}
      />

      {regua.isPending ? <EsqueletoDeCartao /> : null}
      {regua.isError ? <ErroDaConsulta erro={regua.error} /> : null}

      {regua.data ? (
        <Cartao
          titulo="Régua de cobrança"
          icone={CalendarClock}
          descricao="Na ordem em que o formando recebe. Ninguém recebe mais de uma mensagem por dia."
          acao={
            <Button asChild variant="outline" size="sm">
              <Link to={ROTAS.avisosEnviados}>
                <History aria-hidden />
                Avisos enviados
              </Link>
            </Button>
          }
        >
          <TabelaDeDegraus>
            {vencimentos.map((regra) => (
              <LinhaDoDegrau key={regra.id} regra={regra} aoEditar={() => atualizar({ degrau: regra.id })} />
            ))}
          </TabelaDeDegraus>
        </Cartao>
      ) : null}

      {/* Cartão próprio, e não uma seção da régua: quem recebe é a tesouraria, e não o formando —
          a régua acima é a ordem em que a turma é cobrada, e a fila não entra nela. */}
      {regua.data && fila.length > 0 ? (
        <Cartao
          titulo="Fila da tesouraria"
          icone={Inbox}
          descricao="Informe de pagamento parado trava a cobrança da parcela — este aviso lembra quem confere."
        >
          <TabelaDeDegraus>
            {fila.map((regra) => (
              <LinhaDoDegrau key={regra.id} regra={regra} aoEditar={() => atualizar({ degrau: regra.id })} />
            ))}
          </TabelaDeDegraus>
        </Cartao>
      ) : null}

      <DialogoDeFormulario
        aberto={!!emEdicao}
        aoFechar={() => atualizar({ degrau: null })}
        titulo={emEdicao ? `${marcoDoDegrau(emEdicao)} — ${tomDoDegrau(emEdicao)}` : 'Degrau'}
        descricao={emEdicao ? `Vai para: ${destinoDoDegrau(emEdicao)}.` : ''}
        largura="largo"
      >
        {regua.data && emEdicao ? (
          <EditorDeTemplate
            key={emEdicao.id}
            regua={regua.data}
            regra={emEdicao}
            aoFechar={() => atualizar({ degrau: null })}
          />
        ) : null}
      </DialogoDeFormulario>
    </>
  )
}

/** As colunas dos degraus, iguais nos dois cartões — a régua e a fila da tesouraria. */
function TabelaDeDegraus({ children }: { children: ReactNode }) {
  return (
    <Tabela
      cabecalho={
        <>
          <th className="py-3 pr-4 font-normal">Momento</th>
          <th className="py-3 pr-4 font-normal">Quando</th>
          <th className="py-3 pr-4 font-normal">Vai para</th>
          <th className="py-3 pr-4 font-normal">Assunto</th>
          <th className="py-3 pr-4 font-normal">Situação</th>
          <th className="py-3 text-right font-normal">Ações</th>
        </>
      }
    >
      {children}
    </Tabela>
  )
}

/**
 * Um degrau na tabela: o marco, quando dispara, quem recebe, o assunto e a situação.
 *
 * O assunto é o que a comissão quer conferir de relance — antes ele só aparecia depois de abrir o
 * editor. Truncado, porque a coluna é a única que cresce.
 */
function LinhaDoDegrau({ regra, aoEditar }: { regra: Regra; aoEditar: () => void }) {
  return (
    <tr className="border-b last:border-0">
      <td className="text-foreground py-3 pr-4 font-medium tabular-nums">{marcoDoDegrau(regra)}</td>
      <td className="py-3 pr-4 whitespace-nowrap">{quandoDispara(regra)}</td>
      <td className="py-3 pr-4 whitespace-nowrap">{destinoDoDegrau(regra)}</td>
      <td className="max-w-64 truncate py-3 pr-4" title={regra.assunto}>
        {regra.assunto}
      </td>
      <td className="py-3 pr-4">{regra.ativa ? <Selo tom="sucesso">Ativo</Selo> : <Selo>Desligado</Selo>}</td>
      <td className="py-3 text-right">
        <Button
          variant="outline"
          size="sm"
          aria-label={`Editar ${marcoDoDegrau(regra)} — ${tomDoDegrau(regra)}`}
          onClick={aoEditar}
        >
          Editar
        </Button>
      </td>
    </tr>
  )
}
