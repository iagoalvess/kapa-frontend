import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  ReceiptText,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDaContaNoSuporte, ROTAS } from '@/config/rotas'
import { formatarData, formatarNumero } from '@/lib/formato'
import { SeloDaAssinatura, SeloDaTurma } from '../components/SeloDeStatus'
import { useAtivarAssinatura, useTurmaNoSuporte } from '../hooks/useSuporte'
import { toast } from 'sonner'

/**
 * A turma no painel de suporte: situação, licença, membros e os números que explicam a ligação.
 *
 * Tudo é leitura, menos uma coisa: **ativar a assinatura à mão**. É a razão de o painel existir —
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
              {dados.ano}.{dados.semestre}
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
                    onError: (erro: unknown) =>
                      toast.error(erro instanceof Error ? erro.message : 'Não foi possível ativar.'),
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
