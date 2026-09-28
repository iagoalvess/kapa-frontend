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
import { Link, useParams } from 'react-router'
import { AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDaContaNoSuporte, ROTAS } from '@/config/rotas'
import { formatarCentavos, formatarConclusao, formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { APARENCIA_DA_COBRANCA, type CobrancaDoPlano, MOTIVO_DA_COBRANCA } from '@/types/assinatura'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { SeloDaAssinatura, SeloDaTurma } from '../components/SeloDeStatus'
import { useAtivarAssinatura, useEstornarPagamento, useTurmaNoSuporte } from '../hooks/useSuporte'
import type { ModoDeEstorno } from '../types/suporte.types'
import { toast } from 'sonner'

/**
 * A turma no painel de suporte: situação, licença, membros e os números que explicam a ligação.
 *
 * Tudo é leitura, menos duas coisas: **ativar a assinatura à mão** e **estornar um pagamento do plano** (Sprint 37).
 * A primeira é a razão de o painel existir —
 * sem ela, a resposta a "paguei e a turma não ativou" é um `UPDATE` no banco de produção.
 *
 * O CPF dos membros chega mascarado da API, como chega para a Gestão. Não existe endpoint aqui que
 * devolva o número inteiro: quem atende não precisa dele para dizer por que o pagamento não entrou.
 *
 * Não há "entrar como" nesta tela nem em lugar nenhum do painel. É a ferramenta de suporte mais
 * útil que existe e a que mais estraga a trilha: dali em diante, todo evento ficaria no nome do
 * usuário, e não no de quem atendeu.
 */
export default function TurmaNoSuportePage() {
  const { id = '' } = useParams()
  const turma = useTurmaNoSuporte(id)
  const ativar = useAtivarAssinatura(id)

  if (turma.isPending) {
    return (
      <>
        <LinkDeVolta para={ROTAS.suporte}>Suporte</LinkDeVolta>
        <Cartao rotulo="Carregando a turma">
          <EsqueletoDeDados linhas={6} />
        </Cartao>
      </>
    )
  }

  if (turma.isError) {
    return (
      <>
        <LinkDeVolta para={ROTAS.suporte}>Suporte</LinkDeVolta>
        <ErroDaConsulta erro={turma.error} />
      </>
    )
  }

  const dados = turma.data
  const assinatura = dados.assinatura
  const jaAtiva = dados.status === 'Ativa' && assinatura?.status === 'Ativa'

  return (
    <>
      <LinkDeVolta para={ROTAS.suporte}>Suporte</LinkDeVolta>

      <FaixaDeIndicadores
        rotulo="Números da turma"
        indicadores={[
          {
            rotulo: 'Membros ativos',
            valor: dados.membros.filter((membro) => membro.ativo && !membro.desligado_em).length,
            icone: Users,
          },
          { rotulo: 'Parcelas', valor: dados.parcelas, icone: ReceiptText },
          {
            rotulo: 'Parcelas pagas',
            valor: dados.parcelas_pagas,
            unidade: `de ${formatarNumero(dados.parcelas)}`,
            icone: BadgeCheck,
          },
          { rotulo: 'Adesões', valor: dados.adesoes, icone: ClipboardCheck },
        ]}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
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

        <Cartao
          rotulo="Assinatura"
          titulo="Licença"
          selo={assinatura ? <SeloDaAssinatura status={assinatura.status} /> : undefined}
          descricao={
            assinatura
              ? 'O plano contratado e até quando a licença paga vale.'
              : 'Esta turma nunca contratou um plano.'
          }
          acao={
            assinatura && !jaAtiva ? (
              <DialogoDeConfirmacao
                titulo="Ativar a licença desta turma?"
                descricao="Use quando o pagamento entrou e o webhook do provedor se perdeu. A ação fica registrada na trilha de auditoria da turma, no seu nome, e o Presidente recebe o aviso de licença ativa."
                rotulo="Ativar"
                aoConfirmar={() =>
                  ativar.mutate(undefined, {
                    onSuccess: () => toast.success('Licença ativada.'),
                    onError: avisarErro,
                  })
                }
                gatilho={
                  <Button size="sm" variant="outline" disabled={ativar.isPending}>
                    <BadgeCheck aria-hidden />
                    {ativar.isPending ? 'Ativando…' : 'Ativar assinatura'}
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
            <p className="text-muted-foreground text-sm text-pretty">
              Peça à comissão que escolha um plano na tela de planos. O painel não contrata por ninguém — quem
              decide quanto a turma paga é ela.
            </p>
          )}
        </Cartao>
      </div>

      <PagamentosDaTurma turmaId={id} pagamentos={dados.pagamentos} />

      <Cartao
        icone={Users}
        titulo="Membros"
        descricao="Quem está na turma, com o papel de cada um. O CPF sai mascarado, como sai para a comissão."
      >
        {/* Rolagem interna: uma turma de 150 pessoas deixa a página com seis mil pixels, e quem
            atende perde de vista a licença e os números que explicam a ligação. */}
        <ul className="rolagem-discreta grid max-h-[28rem] gap-1 overflow-y-auto">
          {dados.membros.map((membro) => (
            <li key={membro.usuario_id}>
              <Link
                to={rotaDaContaNoSuporte(membro.usuario_id)}
                className="hover:bg-muted focus-visible:ring-ring flex flex-wrap items-center gap-3 rounded-2xl p-3 focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block truncate font-medium">{membro.nome}</span>
                  <span className="text-muted-foreground block truncate text-sm">{membro.email}</span>
                </span>
                {membro.cpf ? (
                  <span className="text-muted-foreground font-mono text-xs">{membro.cpf}</span>
                ) : null}
                <Selo tom="cinza">{membro.papel}</Selo>
                {membro.desligado_em ? (
                  <Selo tom="alerta">Saiu em {formatarData(membro.desligado_em)}</Selo>
                ) : null}
                {membro.ativo ? null : <Selo tom="neutro">Sem acesso</Selo>}
              </Link>
            </li>
          ))}
        </ul>
      </Cartao>
    </>
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
              ? 'Desistência em até 7 dias do pagamento (Termos, seção 7). Depois disso, a API recusa.'
              : 'O Kapa encerrou sem culpa da turma, ou ela recusou a versão nova dos Termos (seções 13 e 14).'}
          </p>
        </fieldset>
      </DialogoDeConfirmacao>
    </Cartao>
  )
}
