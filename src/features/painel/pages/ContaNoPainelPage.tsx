import { CalendarDays, GraduationCap, Lock, Mail, Megaphone, ShieldCheck, UserRound } from 'lucide-react'
import { useParams } from 'react-router'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { toast } from 'sonner'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeCartao, EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDaTurmaNoPainel, ROTAS } from '@/config/rotas'
import { formatarData, formatarDataHora, jaChegou } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { ROTULOS_DAS_JORNADAS } from '@/types/comunicacaoDoKapa'
import { SeloDaTurma } from '../components/SeloDeStatus'
import { useAcaoNaConta, useContaNoSuporte } from '../hooks/usePainel'
import type { AcaoNaConta, UsuarioNoSuporte } from '../types/painel.types'

/** A grade da coluna lateral de ações: o conteúdo à esquerda, o acesso e as ações à direita. */
const COLUNAS = 'grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]'

/** As três ações de conta, com o que dizer quando cada uma der certo. */
const ACOES: {
  acao: AcaoNaConta
  rotulo: string
  sucesso: string
  /** Pergunta de confirmação, para a ação que muda o acesso da conta. */
  confirmar?: { titulo: string; descricao: string }
}[] = [
  {
    acao: 'reenviar-confirmacao',
    rotulo: 'Reenviar confirmação',
    sucesso: 'E-mail de confirmação reenviado.',
  },
  {
    acao: 'redefinir-senha',
    rotulo: 'Redefinir senha',
    sucesso: 'E-mail de redefinição enviado ao dono da conta.',
    confirmar: {
      titulo: 'Enviar a redefinição de senha?',
      descricao:
        'O dono da conta recebe um link para escolher uma senha nova. A senha atual continua valendo até ele usar o link.',
    },
  },
  {
    acao: 'desbloquear',
    rotulo: 'Desbloquear',
    sucesso: 'Bloqueio por tentativas levantado.',
    confirmar: {
      titulo: 'Desbloquear a conta?',
      descricao:
        'As tentativas erradas voltam a zero e a conta aceita login na hora. Faça isso só depois de confirmar que é o dono quem pede.',
    },
  },
]

/**
 * A conta no painel do Kapa: quem é, em que turmas está e, na coluna lateral, o acesso e as ações.
 *
 * As três ações são todas **por e-mail ao dono da conta**, nunca no lugar dele. O suporte não define senha para
 * ninguém: senha escolhida pelo atendente é senha que duas pessoas conhecem, e o log de acesso deixa de dizer quem
 * entrou. Cada uma grava um evento de auditoria com quem executou, quando e sobre quem.
 *
 * Desbloquear **não** reativa conta desativada: bloqueio é a defesa contra força bruta e expira sozinho; desativar é
 * decisão administrativa.
 */
export default function ContaNoPainelPage() {
  const { id = '' } = useParams()
  const conta = useContaNoSuporte(id)

  if (conta.isPending) {
    return (
      <>
        <LinkDeVolta para={ROTAS.painelContas}>Contas</LinkDeVolta>
        <div className={COLUNAS}>
          <EsqueletoDeCartao>
            <EsqueletoDeDados linhas={5} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDeDados linhas={3} />
          </EsqueletoDeCartao>
        </div>
      </>
    )
  }

  if (conta.isError) {
    return (
      <>
        <LinkDeVolta para={ROTAS.painelContas}>Contas</LinkDeVolta>
        <ErroDaConsulta erro={conta.error} aoTentarDeNovo={() => void conta.refetch()} />
      </>
    )
  }

  const dados = conta.data

  return (
    <>
      <LinkDeVolta para={ROTAS.painelContas}>Contas</LinkDeVolta>

      <div className={COLUNAS}>
        <div className="grid gap-5">
          <Cartao
            icone={UserRound}
            titulo={dados.nome}
            selo={dados.ativo ? undefined : <Selo tom="perigo">Conta desativada</Selo>}
            descricao={dados.email}
          >
            <ListaDeDados>
              <Dado icone={ShieldCheck} rotulo="Perfis">
                {dados.perfis.length > 0 ? dados.perfis.join(', ') : '—'}
              </Dado>
              <Dado icone={CalendarDays} rotulo="Conta criada em">
                {formatarData(dados.criado_em)}
              </Dado>
              <Dado icone={Megaphone} rotulo="Novidades do Kapa">
                {dados.comunicacao_do_kapa.receber ? 'recebe' : 'não recebe'}
              </Dado>
              {dados.comunicacao_do_kapa.envios.map((envio) => (
                <Dado
                  key={envio.enviado_em + envio.jornada}
                  icone={Megaphone}
                  rotulo={formatarData(envio.enviado_em)}
                >
                  {ROTULOS_DAS_JORNADAS[envio.jornada] ?? envio.jornada} · {envio.formatura}
                </Dado>
              ))}
              {dados.anonimizado_em ? (
                <Dado icone={ShieldCheck} rotulo="Anonimizada em">
                  {formatarData(dados.anonimizado_em)}
                </Dado>
              ) : null}
            </ListaDeDados>
          </Cartao>

          <TurmasDaConta conta={dados} />
        </div>

        <AcessoDaConta conta={dados} />
      </div>
    </>
  )
}

/**
 * O acesso da conta e as três ações, na coluna lateral: botões pequenos, como toda ação de cartão.
 *
 * @param conta A conta aberta.
 */
function AcessoDaConta({ conta }: { conta: UsuarioNoSuporte }) {
  const executar = useAcaoNaConta(conta.id)
  const bloqueada = !!conta.bloqueado_ate && !jaChegou(conta.bloqueado_ate)

  const disparar = (item: (typeof ACOES)[number]) =>
    executar.mutate(item.acao, {
      onSuccess: () => toast.success(item.sucesso),
      onError: avisarErro,
    })

  return (
    <Cartao
      titulo="Acesso"
      descricao="Tudo por e-mail ao dono da conta. O suporte não define senha nem entra no lugar de ninguém."
    >
      <ListaDeDados>
        <Dado icone={Mail} rotulo="E-mail confirmado">
          {conta.email_confirmado ? 'sim' : 'ainda não'}
        </Dado>
        <Dado icone={Lock} rotulo="Bloqueio por senha">
          {bloqueada ? `até ${formatarDataHora(conta.bloqueado_ate)}` : 'nenhum'}
        </Dado>
        <Dado icone={Lock} rotulo="Tentativas erradas">
          {conta.tentativas_falhas}
        </Dado>
      </ListaDeDados>

      <div className="flex flex-wrap gap-2">
        {ACOES.map((item) => {
          const botao = (
            <Button
              key={item.acao}
              size="sm"
              variant="outline"
              disabled={executar.isPending}
              onClick={item.confirmar ? undefined : () => disparar(item)}
            >
              {item.rotulo}
            </Button>
          )

          return item.confirmar ? (
            <DialogoDeConfirmacao
              key={item.acao}
              titulo={item.confirmar.titulo}
              descricao={item.confirmar.descricao}
              rotulo={item.rotulo}
              aoConfirmar={() => disparar(item)}
              gatilho={botao}
            />
          ) : (
            botao
          )
        })}
      </div>

      <TextoDoCartao className="text-texto-muted text-pretty">
        Cada ação fica registrada na auditoria com o seu nome, o horário e a conta afetada.
      </TextoDoCartao>
    </Cartao>
  )
}

/**
 * Onde a pessoa está, e com que papel — a lista vem inteira com a conta, e é curta.
 *
 * @param conta A conta aberta.
 */
function TurmasDaConta({ conta }: { conta: UsuarioNoSuporte }) {
  return (
    <Cartao icone={GraduationCap} titulo="Turmas" descricao="Onde a pessoa está, e com que papel.">
      {conta.vinculos.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Esta conta não está em nenhuma turma: cadastrou-se e ainda não criou nem aceitou convite.
        </p>
      ) : (
        <Tabela
          emLista
          legenda="Turmas da conta"
          cabecalho={
            <>
              <th className="py-3 pr-4 font-normal">Turma</th>
              <th className="py-3 pr-4 font-normal">Papel</th>
              <th className="py-3 pr-4 font-normal">Vínculo</th>
              <th className="py-3 font-normal">Turma está</th>
            </>
          }
        >
          {conta.vinculos.map((vinculo) => (
            <tr key={vinculo.formatura_id} className="border-b last:border-0">
              <th scope="row" className="grid min-w-52 py-3 pr-4 text-left font-normal">
                <LinkDaPagina
                  to={rotaDaTurmaNoPainel(vinculo.formatura_id)}
                  className="text-foreground truncate font-medium hover:underline"
                >
                  {vinculo.nome}
                </LinkDaPagina>
                <span className="text-texto-muted truncate text-xs">{vinculo.instituicao}</span>
              </th>
              <td className="py-3 pr-4">
                <Selo tom="cinza">{vinculo.papel}</Selo>
              </td>
              <td className="py-3 pr-4 whitespace-nowrap">
                {vinculo.desligado_em ? (
                  <Selo tom="alerta">Saiu em {formatarData(vinculo.desligado_em)}</Selo>
                ) : vinculo.ativo ? (
                  <Selo tom="sucesso">Ativo</Selo>
                ) : (
                  <Selo>Sem acesso</Selo>
                )}
              </td>
              <td className="py-3">
                <SeloDaTurma status={vinculo.status} />
              </td>
            </tr>
          ))}
        </Tabela>
      )}
    </Cartao>
  )
}
