import {
  CalendarDays,
  GraduationCap,
  KeyRound,
  Lock,
  LockOpen,
  Mail,
  MailCheck,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDaTurmaNoSuporte, ROTAS } from '@/config/rotas'
import { formatarData, formatarDataHora } from '@/lib/formato'
import { SeloDaTurma } from '../components/SeloDeStatus'
import { useAcaoNaConta, useContaNoSuporte } from '../hooks/useSuporte'
import type { AcaoNaConta } from '../types/suporte.types'

/** As três ações de conta, com o que dizer quando cada uma der certo. */
const ACOES: { acao: AcaoNaConta; rotulo: string; icone: typeof Mail; sucesso: string }[] = [
  {
    acao: 'reenviar-confirmacao',
    rotulo: 'Reenviar confirmação',
    icone: MailCheck,
    sucesso: 'E-mail de confirmação reenviado.',
  },
  {
    acao: 'redefinir-senha',
    rotulo: 'Enviar redefinição de senha',
    icone: KeyRound,
    sucesso: 'E-mail de redefinição enviado ao dono da conta.',
  },
  {
    acao: 'desbloquear',
    rotulo: 'Desbloquear',
    icone: LockOpen,
    sucesso: 'Bloqueio por tentativas levantado.',
  },
]

/**
 * A conta no painel de suporte: acesso, bloqueio e em que turmas a pessoa está.
 *
 * As três ações são todas **por e-mail ao dono da conta**, nunca no lugar dele. O suporte não
 * define senha para ninguém: senha escolhida pelo atendente é senha que duas pessoas conhecem, e o
 * log de acesso deixa de dizer quem entrou.
 *
 * Cada uma grava um evento de auditoria com quem executou, quando e sobre quem — sem formatura no
 * corpo, porque são ações da conta e a pessoa pode estar em nenhuma turma ou em três.
 *
 * Desbloquear **não** reativa conta desativada: são coisas diferentes. Bloqueio é a defesa contra
 * força bruta e expira sozinho; desativar é decisão administrativa, e se desfaz na gestão de
 * usuários.
 */
export default function ContaNoSuportePage() {
  const { id = '' } = useParams()
  const conta = useContaNoSuporte(id)
  const executar = useAcaoNaConta(id)

  if (conta.isPending) {
    return (
      <>
        <LinkDeVolta para={ROTAS.suporte}>Suporte</LinkDeVolta>
        <Cartao rotulo="Carregando a conta">
          <EsqueletoDeDados linhas={6} />
        </Cartao>
      </>
    )
  }

  if (conta.isError) {
    return (
      <>
        <LinkDeVolta para={ROTAS.suporte}>Suporte</LinkDeVolta>
        <ErroDaConsulta erro={conta.error} />
      </>
    )
  }

  const dados = conta.data
  const bloqueada = !!dados.bloqueado_ate && new Date(dados.bloqueado_ate) > new Date()

  const disparar = (item: (typeof ACOES)[number]) =>
    executar.mutate(item.acao, {
      onSuccess: () => toast.success(item.sucesso),
      onError: (erro: unknown) =>
        toast.error(erro instanceof Error ? erro.message : 'Não foi possível executar a ação.'),
    })

  return (
    <>
      <LinkDeVolta para={ROTAS.suporte}>Suporte</LinkDeVolta>

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Cartao
          icone={UserRound}
          titulo={dados.nome}
          selo={dados.ativo ? undefined : <Selo tom="perigo">Conta desativada</Selo>}
          descricao={dados.email}
        >
          <ListaDeDados>
            <Dado icone={Mail} rotulo="E-mail confirmado">
              {dados.email_confirmado ? 'sim' : 'ainda não'}
            </Dado>
            <Dado icone={Lock} rotulo="Bloqueio por senha">
              {bloqueada ? `até ${formatarDataHora(dados.bloqueado_ate)}` : 'nenhum'}
            </Dado>
            <Dado icone={Lock} rotulo="Tentativas erradas">
              {dados.tentativas_falhas}
            </Dado>
            <Dado icone={ShieldCheck} rotulo="Perfis">
              {dados.perfis.length > 0 ? dados.perfis.join(', ') : '—'}
            </Dado>
            <Dado icone={CalendarDays} rotulo="Conta criada em">
              {formatarData(dados.criado_em)}
            </Dado>
            {dados.anonimizado_em ? (
              <Dado icone={ShieldCheck} rotulo="Anonimizada em">
                {formatarData(dados.anonimizado_em)}
              </Dado>
            ) : null}
          </ListaDeDados>
        </Cartao>

        <Cartao
          rotulo="Ações"
          titulo="O que dá para fazer"
          descricao="Tudo por e-mail ao dono da conta. O suporte não define senha nem entra no lugar de ninguém."
        >
          <div className="grid gap-2">
            {ACOES.map((item) => (
              <Button
                key={item.acao}
                variant="outline"
                className="justify-start"
                disabled={executar.isPending}
                onClick={() => disparar(item)}
              >
                <item.icone aria-hidden />
                {item.rotulo}
              </Button>
            ))}
          </div>

          <p className="text-texto-muted text-xs text-pretty">
            Cada ação fica registrada na auditoria com o seu nome, o horário e a conta afetada.
          </p>
        </Cartao>
      </div>

      <Cartao
        icone={GraduationCap}
        titulo="Turmas"
        descricao="Onde a pessoa está, e com que papel. Turma em que ela foi removida não aparece."
      >
        {dados.vinculos.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Esta conta não está em nenhuma turma. É o caso de quem se cadastrou e ainda não criou nem aceitou
            convite.
          </p>
        ) : (
          <ul className="grid gap-1">
            {dados.vinculos.map((vinculo) => (
              <li key={vinculo.formatura_id}>
                <Link
                  to={rotaDaTurmaNoSuporte(vinculo.formatura_id)}
                  className="hover:bg-muted focus-visible:ring-ring flex flex-wrap items-center gap-3 rounded-2xl p-3 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate font-medium">{vinculo.nome}</span>
                    <span className="text-muted-foreground block truncate text-sm">
                      {vinculo.instituicao}
                    </span>
                  </span>
                  <Selo tom="cinza">{vinculo.papel}</Selo>
                  {vinculo.desligado_em ? (
                    <Selo tom="alerta">Saiu em {formatarData(vinculo.desligado_em)}</Selo>
                  ) : null}
                  <SeloDaTurma status={vinculo.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </>
  )
}
