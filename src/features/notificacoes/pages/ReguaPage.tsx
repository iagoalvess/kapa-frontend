import { Bell, CalendarClock, History, Inbox, Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Interruptor } from '@/components/Interruptor'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Tabela } from '@/components/Planilha'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { avisarErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { useDefinirRegra, useHistorico, useRegua } from '../hooks/useRegras'
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
 * cobrança firme, e a mesma sequência desenhada ao lado.
 *
 * O e-mail de cada degrau é padrão do Kapa (decisão de 24/09/2026): a comissão só liga ou desliga,
 * na chave da linha. Não há editor, prévia nem envio de teste.
 *
 * A turma que nunca abriu esta tela já tem a régua inteira ligada — a API a materializa na primeira
 * leitura, porque exigir configuração antes de funcionar significa que metade das turmas nunca teria
 * lembrete.
 */
export default function ReguaPage() {
  const regua = useRegua()
  // Uma linha só: o que se quer daqui é o total de envios, não a lista — ela tem tela própria.
  const historico = useHistorico({ pagina: 1, tamanho: 1 })

  const regras = regua.data?.regras ?? []
  const vencimentos = regras
    .filter((regra) => regra.gatilho === 'Vencimento')
    .toSorted((a, b) => a.dias_de_deslocamento - b.dias_de_deslocamento)
  const fila = regras.filter((regra) => regra.gatilho === 'InformePendente')
  const ativos = regras.filter((regra) => regra.ativa)

  return (
    <>
      <LinkDeVolta para={ROTAS.cobrancas}>Plano de cobrança</LinkDeVolta>
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
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
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
                <LinhaDoDegrau key={regra.id} regra={regra} />
              ))}
            </TabelaDeDegraus>

            {/* Seção à parte, e não mais linhas da tabela acima: quem recebe é a tesouraria, e a
                fila não entra na ordem em que a turma é cobrada. */}
            {fila.length > 0 ? (
              <section aria-label="Fila da tesouraria" className="grid gap-3 border-t pt-5">
                <div className="flex items-start gap-3">
                  <span className="bg-brand-tint text-brand-text inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Inbox className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="grid gap-0.5">
                    <h3 className="text-foreground font-medium">Fila da tesouraria</h3>
                    <p className="text-muted-foreground text-sm">
                      Informe de pagamento parado trava a cobrança da parcela — este aviso lembra quem
                      confere.
                    </p>
                  </div>
                </div>
                <TabelaDeDegraus>
                  {fila.map((regra) => (
                    <LinhaDoDegrau key={regra.id} regra={regra} />
                  ))}
                </TabelaDeDegraus>
              </section>
            ) : null}
          </Cartao>

          {/* A segunda linha do grid é da sequência: ela ocupa a altura que o cartão da régua der. */}
          <Cartao
            titulo="Sequência de lembretes"
            descricao="Visão do fluxo de comunicação"
            className="grid-rows-[auto_1fr]"
          >
            <SequenciaDeLembretes degraus={vencimentos} />
          </Cartao>
        </div>
      ) : null}
    </>
  )
}

/**
 * Os degraus numa linha vertical, só para ler o fluxo — ligar e desligar fica na tabela ao lado.
 * O degrau desligado fica apagado, e não some: a sequência mostra onde ele cairia.
 *
 * Cada degrau, menos o último, cresce para dividir a altura que sobra: o espaço entre eles acompanha
 * a altura do cartão da régua ao lado, e a linha, que vai até o fim do degrau, continua ligando os pontos.
 */
function SequenciaDeLembretes({ degraus }: { degraus: Regra[] }) {
  if (degraus.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum lembrete na régua.</p>
  }

  return (
    <ol className="flex flex-col">
      {degraus.map((regra, indice) => (
        <li
          key={regra.id}
          className={cn(
            'relative flex flex-1 items-start gap-3 pb-5 pl-6 last:flex-none last:pb-0',
            !regra.ativa && 'opacity-50',
          )}
        >
          {/* Da borda de baixo deste ponto à borda de cima do próximo, sem entrar em nenhum: o ponto do
              degrau desligado é translúcido, e a linha apareceria através dele. */}
          {indice < degraus.length - 1 ? (
            <span className="bg-brand absolute top-[26px] -bottom-3.5 left-[5px] w-0.5" aria-hidden />
          ) : null}
          <span className="bg-brand absolute top-3.5 left-0 size-3 rounded-full" aria-hidden />
          <span className="bg-brand-tint text-brand-text inline-flex size-10 shrink-0 items-center justify-center rounded-full">
            <Mail className="size-4" aria-hidden />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5 text-sm">
            <span className="text-foreground font-medium tabular-nums">{marcoDoDegrau(regra)}</span>
            <span className="text-muted-foreground">{quandoDispara(regra)}</span>
            <span className="text-muted-foreground">Para o {destinoDoDegrau(regra).toLowerCase()}</span>
          </div>
          <p className="bg-brand-tint text-foreground w-36 shrink-0 rounded-xl px-3 py-2 text-sm">
            {regra.assunto}
          </p>
        </li>
      ))}
    </ol>
  )
}

/** As colunas dos degraus, iguais nas duas seções — a régua e a fila da tesouraria. */
function TabelaDeDegraus({ children }: { children: ReactNode }) {
  return (
    <Tabela
      cabecalho={
        <>
          <th className="py-3 pr-4 font-normal">Momento</th>
          <th className="py-3 pr-4 font-normal">Quando</th>
          <th className="py-3 pr-4 font-normal">Vai para</th>
          <th className="py-3 pr-4 font-normal">Assunto</th>
          <th className="py-3 font-normal">Situação</th>
        </>
      }
    >
      {children}
    </Tabela>
  )
}

/**
 * Um degrau na tabela: o marco, quando dispara, quem recebe, o assunto do e-mail e a chave que o
 * liga e desliga.
 *
 * A chave grava na hora, sem diálogo: desligar não apaga nada, e ligar de novo é o mesmo clique.
 */
function LinhaDoDegrau({ regra }: { regra: Regra }) {
  const definir = useDefinirRegra()
  const nome = `${marcoDoDegrau(regra)} — ${tomDoDegrau(regra)}`

  const alternar = () =>
    definir.mutate(
      { id: regra.id, ativa: !regra.ativa },
      {
        onSuccess: () => (regra.ativa ? toast.info(`${nome} desligado.`) : toast.success(`${nome} ligado.`)),
        onError: avisarErro,
      },
    )

  return (
    <tr className="border-b last:border-0">
      <td className="text-foreground py-3 pr-4 font-medium tabular-nums">{marcoDoDegrau(regra)}</td>
      <td className="py-3 pr-4 whitespace-nowrap">{quandoDispara(regra)}</td>
      <td className="py-3 pr-4 whitespace-nowrap">{destinoDoDegrau(regra)}</td>
      <td className="max-w-64 truncate py-3 pr-4" title={regra.assunto}>
        {regra.assunto}
      </td>
      <td className="py-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-2">
          <Interruptor
            ligado={regra.ativa}
            rotulo={nome}
            aoAlternar={alternar}
            desabilitado={definir.isPending}
          />
          {regra.ativa ? 'Ativo' : 'Desligado'}
        </span>
      </td>
    </tr>
  )
}
