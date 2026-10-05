import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  ReceiptText,
  Undo2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { toast } from 'sonner'
import { AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Avatar } from '@/components/Avatar'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeCartao, EsqueletoDeDados, EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Paginacao } from '@/components/Paginacao'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDaContaNoPainel, ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'
import { formatarCentavos, formatarConclusao, formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { APARENCIA_DA_COBRANCA, type CobrancaDoPlano, MOTIVO_DA_COBRANCA } from '@/types/assinatura'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { SeloDaAssinatura, SeloDaTurma } from '../components/SeloDeStatus'
import {
  useAtivarAssinatura,
  useEstornarPagamento,
  useMembrosNoSuporte,
  useTurmaNoSuporte,
} from '../hooks/usePainel'
import type { ModoDeEstorno, TurmaNoSuporte } from '../types/painel.types'

/** A grade da coluna lateral de ações: o conteúdo à esquerda, a licença à direita. */
const COLUNAS = 'grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]'

/**
 * A turma no painel do Kapa: situação, licença, pagamentos do plano e quem está dentro.
 *
 * Tudo é leitura, menos duas coisas: **ativar a assinatura à mão** e **estornar um pagamento do plano** (Sprint 37).
 * A primeira é a razão de o painel existir — sem ela, a resposta a "paguei e a turma não ativou" é um `UPDATE` no
 * banco de produção.
 *
 * O CPF dos membros chega mascarado da API, como chega para a Gestão. Não há "entrar como" nesta tela nem em lugar
 * nenhum do painel: dali em diante, todo evento ficaria no nome do usuário, e não no de quem atendeu.
 */
export default function TurmaNoPainelPage() {
  const { id = '' } = useParams()
  const turma = useTurmaNoSuporte(id)

  if (turma.isPending) {
    return (
      <>
        <LinkDeVolta para={ROTAS.painelTurmas}>Turmas</LinkDeVolta>
        <div className={COLUNAS}>
          <EsqueletoDeCartao>
            <EsqueletoDeDados linhas={4} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDeDados linhas={4} />
          </EsqueletoDeCartao>
        </div>
      </>
    )
  }

  if (turma.isError) {
    return (
      <>
        <LinkDeVolta para={ROTAS.painelTurmas}>Turmas</LinkDeVolta>
        <ErroDaConsulta erro={turma.error} aoTentarDeNovo={() => void turma.refetch()} />
      </>
    )
  }

  const dados = turma.data

  return (
    <>
      <LinkDeVolta para={ROTAS.painelTurmas}>Turmas</LinkDeVolta>

      <FaixaDeIndicadores
        rotulo="Números da turma"
        indicadores={[
          { rotulo: 'Membros ativos', valor: dados.membros_ativos, icone: Users },
          {
            rotulo: 'Parcelas pagas',
            valor: dados.parcelas_pagas,
            unidade: `de ${formatarNumero(dados.parcelas)}`,
            icone: BadgeCheck,
          },
          { rotulo: 'Parcelas', valor: dados.parcelas, icone: ReceiptText },
          { rotulo: 'Adesões', valor: dados.adesoes, icone: ClipboardCheck },
        ]}
      />

      <div className={COLUNAS}>
        <div className="grid gap-5">
          <Cartao
            icone={GraduationCap}
            titulo={dados.nome}
            selo={<SeloDaTurma status={dados.status} />}
            descricao={`${dados.curso} · ${dados.instituicao}`}
          >
            <ListaDeDados>
              <Dado icone={Building2} rotulo="Conclusão">
                {formatarConclusao(dados.ano, dados.semestre)}
              </Dado>
              <Dado icone={CalendarDays} rotulo="Criada em">
                {formatarData(dados.criada_em)}
              </Dado>
              <Dado icone={CalendarDays} rotulo="Ativada em">
                {dados.ativada_em ? formatarData(dados.ativada_em) : 'nunca'}
              </Dado>
              <Dado icone={ReceiptText} rotulo="Identificador">
                <span className="font-mono text-xs break-all">{dados.id}</span>
              </Dado>
            </ListaDeDados>
          </Cartao>

          <MembrosDaTurma turmaId={id} />
          <PagamentosDaTurma turmaId={id} pagamentos={dados.pagamentos} />
        </div>

        <LicencaDaTurma turma={dados} />
      </div>
    </>
  )
}

/**
 * A licença, na coluna lateral: o plano, a vigência e a ativação à mão — a ação que o painel existe para ter.
 *
 * @param turma A turma, com a assinatura mais recente.
 */
function LicencaDaTurma({ turma }: { turma: TurmaNoSuporte }) {
  const ativar = useAtivarAssinatura(turma.id)
  const assinatura = turma.assinatura
  const jaAtiva = turma.status === 'Ativa' && assinatura?.status === 'Ativa'

  return (
    <Cartao
      titulo="Licença"
      selo={assinatura ? <SeloDaAssinatura status={assinatura.status} /> : undefined}
      descricao={
        assinatura
          ? 'O plano contratado e até quando a licença paga vale.'
          : 'A turma está no plano gratuito.'
      }
      acao={
        assinatura && !jaAtiva ? (
          <DialogoDeConfirmacao
            titulo="Ativar a licença desta turma?"
            descricao="Use se o pagamento foi confirmado, mas a licença ainda não foi ativada. Esta ação fica registrada em seu nome, e o presidente recebe um aviso."
            rotulo="Ativar"
            aoConfirmar={() =>
              ativar.mutate(undefined, {
                onSuccess: () => toast.success('Licença ativada.'),
                onError: avisarErro,
              })
            }
            gatilho={
              <Button size="sm" variant="outline" disabled={ativar.isPending}>
                {ativar.isPending ? 'Ativando…' : 'Ativar'}
              </Button>
            }
          />
        ) : undefined
      }
    >
      {assinatura ? (
        <ListaDeDados>
          <Dado icone={ClipboardCheck} rotulo="Plano">
            {assinatura.plano_nome}
          </Dado>
          <Dado icone={Users} rotulo="Limite">
            {formatarNumero(assinatura.limite_de_formandos)} formandos
          </Dado>
          <Dado icone={CalendarDays} rotulo="Vigente até">
            {assinatura.vigente_ate ? formatarData(assinatura.vigente_ate) : '—'}
          </Dado>
          <Dado icone={CalendarDays} rotulo="Contratada em">
            {formatarData(assinatura.contratada_em)}
          </Dado>
          {assinatura.cancelada_em ? (
            <Dado icone={CalendarDays} rotulo="Renovação cancelada">
              {formatarData(assinatura.cancelada_em)}
            </Dado>
          ) : null}
        </ListaDeDados>
      ) : (
        <TextoDoCartao className="text-pretty">
          Nunca contratou um plano. O painel não contrata por ninguém — quem decide quanto a turma paga é a
          comissão, na tela de planos.
        </TextoDoCartao>
      )}
    </Cartao>
  )
}

/**
 * Os membros da turma, paginados no servidor com a página na URL (T4): uma turma de 150 pessoas não desce
 * inteira para a tela mostrar vinte, e o link da página três abre a página três.
 *
 * @param turmaId Formatura.
 */
function MembrosDaTurma({ turmaId }: { turmaId: string }) {
  const tamanho = useTamanhoDaPagina()
  const { pagina, atualizar } = useFiltrosDaUrl()
  const membros = useMembrosNoSuporte(turmaId, { pagina, tamanho })
  const itens = membros.data?.itens ?? []

  return (
    <Cartao
      icone={Users}
      titulo="Membros"
      descricao="Quem está na turma, com o papel de cada um. O CPF sai mascarado, como sai para a comissão."
    >
      {membros.isPending ? <EsqueletoDeTabela colunas={4} /> : null}
      {membros.isError ? (
        <ErroDaConsulta compacto erro={membros.error} aoTentarDeNovo={() => void membros.refetch()} />
      ) : null}
      {membros.data && itens.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ninguém entrou na turma ainda.</p>
      ) : null}

      {itens.length > 0 ? (
        <Tabela
          emLista
          legenda="Membros da turma"
          cabecalho={
            <>
              <th className="py-3 pr-4 font-normal">Membro</th>
              <th className="py-3 pr-4 font-normal">CPF</th>
              <th className="py-3 pr-4 font-normal">Papel</th>
              <th className="py-3 font-normal">Situação</th>
            </>
          }
        >
          {itens.map((membro) => (
            <tr key={membro.usuario_id} className="border-b last:border-0">
              <td className="py-3 pr-4">
                <div className="flex min-w-52 items-center gap-3">
                  <Avatar nome={membro.nome} semente={membro.usuario_id} className="size-8 text-sm" />
                  <div className="grid min-w-0">
                    <LinkDaPagina
                      to={rotaDaContaNoPainel(membro.usuario_id)}
                      className="text-foreground truncate font-medium hover:underline"
                    >
                      {membro.nome}
                    </LinkDaPagina>
                    <span className="text-texto-muted truncate text-xs">{membro.email}</span>
                  </div>
                </div>
              </td>
              <td className="text-muted-foreground py-3 pr-4 font-mono text-xs whitespace-nowrap">
                {membro.cpf ?? ''}
              </td>
              <td className="py-3 pr-4">
                <Selo tom="cinza">{membro.papel}</Selo>
              </td>
              <td className="py-3 whitespace-nowrap">
                {membro.desligado_em ? (
                  <Selo tom="alerta">Saiu em {formatarData(membro.desligado_em)}</Selo>
                ) : membro.ativo ? (
                  <Selo tom="sucesso">Ativo</Selo>
                ) : (
                  <Selo>Sem acesso</Selo>
                )}
              </td>
            </tr>
          ))}
        </Tabela>
      ) : null}

      {membros.data ? (
        <Paginacao
          pagina={membros.data.pagina}
          totalPaginas={membros.data.total_paginas}
          total={membros.data.total}
          ocupado={membros.isPlaceholderData}
          aoMudar={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
        />
      ) : null}
    </Cartao>
  )
}

/**
 * Os pagamentos do plano da turma, com o estorno (Sprint 37, P7).
 *
 * O estorno é um diálogo só para a lista inteira, aberto pela linha: nele o atendente escolhe o modo — tudo de
 * volta, na desistência em 7 dias, ou o que falta do ciclo, nos casos dos Termos. Estornar encerra a assinatura
 * na hora, e o diálogo diz isso antes, não depois.
 */
function PagamentosDaTurma({ turmaId, pagamentos }: { turmaId: string; pagamentos: CobrancaDoPlano[] }) {
  const estornar = useEstornarPagamento(turmaId)
  const [escolhido, definirEscolhido] = useState<CobrancaDoPlano | null>(null)
  const [modo, definirModo] = useState<ModoDeEstorno>('Integral')

  return (
    <Cartao
      icone={ReceiptText}
      titulo="Pagamentos do plano"
      descricao="O que a turma pagou ao Kapa. Estornar devolve o dinheiro pelo Mercado Pago e encerra a assinatura na hora."
    >
      {pagamentos.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum pagamento do plano.</p>
      ) : (
        <Tabela
          emLista
          legenda="Pagamentos do plano"
          cabecalho={
            <>
              <th className="py-3 pr-4 font-normal">Data</th>
              <th className="py-3 pr-4 font-normal">Pagamento</th>
              <th className="py-3 pr-4 font-normal">Situação</th>
              <th className="py-3 pr-4 text-right font-normal">Valor</th>
            </>
          }
        >
          {pagamentos.map((pagamento) => {
            const aparencia = APARENCIA_DA_COBRANCA[pagamento.situacao]

            return (
              <tr key={pagamento.id} className="border-b last:border-0">
                <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">
                  {formatarData(pagamento.paga_em ?? pagamento.criada_em)}
                </td>
                <td className="py-3 pr-4">
                  {MOTIVO_DA_COBRANCA[pagamento.motivo]} · {pagamento.plano_nome} ·{' '}
                  {MEIOS_DE_PAGAMENTO[pagamento.meio].rotulo}
                </td>
                <td className="py-3 pr-4">
                  <Selo tom={aparencia.tom}>{aparencia.rotulo}</Selo>
                </td>
                <td className="py-3 pr-4 text-right whitespace-nowrap">
                  {formatarCentavos(pagamento.valor_em_centavos)}
                  {pagamento.valor_estornado_em_centavos ? (
                    <span className="text-muted-foreground block text-xs">
                      − {formatarCentavos(pagamento.valor_estornado_em_centavos)}
                    </span>
                  ) : null}
                </td>
                <td className="py-2 text-right">
                  {pagamento.situacao === 'Paga' ? (
                    <AcoesDaLinha rotulo={`Ações do pagamento de ${formatarData(pagamento.paga_em)}`}>
                      <AcaoDaLinha
                        rotulo="Estornar"
                        descricaoAcessivel={`Estornar o pagamento de ${formatarData(pagamento.paga_em)}`}
                        icone={Undo2}
                        tom="perigo"
                        desabilitada={estornar.isPending}
                        onClick={() => {
                          definirModo('Integral')
                          definirEscolhido(pagamento)
                        }}
                      />
                    </AcoesDaLinha>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </Tabela>
      )}

      <DialogoDeConfirmacao
        aberto={escolhido !== null}
        aoFechar={() => definirEscolhido(null)}
        titulo="Estornar o pagamento?"
        descricao={`O valor volta pelo Mercado Pago, a renovação é cancelada e a turma fica só para consulta a partir de agora. Pagamento de ${formatarCentavos(escolhido?.valor_em_centavos ?? 0)} em ${formatarData(escolhido?.paga_em ?? null)}.`}
        rotulo="Estornar"
        destrutivo
        aoConfirmar={() => {
          if (!escolhido) return
          estornar.mutate(
            { cobrancaId: escolhido.id, modo },
            { onSuccess: () => toast.info('Pagamento estornado.'), onError: avisarErro },
          )
          definirEscolhido(null)
        }}
      >
        <fieldset className="grid gap-2">
          <legend className="text-foreground mb-2 text-sm font-medium">Quanto devolver</legend>
          <div className="flex flex-wrap gap-2">
            <Chip ativo={modo === 'Integral'} onClick={() => definirModo('Integral')}>
              Tudo
            </Chip>
            <Chip ativo={modo === 'Proporcional'} onClick={() => definirModo('Proporcional')}>
              O que falta do ciclo
            </Chip>
          </div>
          <p className="text-muted-foreground text-sm text-pretty">
            {modo === 'Integral'
              ? 'Use para desistências feitas em até 7 dias após o pagamento, conforme a seção 7 dos Termos.'
              : 'O Kapa encerrou sem culpa da turma, ou ela recusou a versão nova dos Termos (seções 13 e 14).'}
          </p>
        </fieldset>
      </DialogoDeConfirmacao>
    </Cartao>
  )
}
