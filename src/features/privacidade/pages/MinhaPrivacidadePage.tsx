import {
  BellRing,
  Download,
  ExternalLink,
  FileSignature,
  GraduationCap,
  Mail,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import {
  formatarCentavos,
  formatarCep,
  formatarCpf,
  formatarData,
  formatarDataHora,
  formatarTelefone,
} from '@/lib/formato'
import { CartaoDeSolicitacoes } from '../components/CartaoDeSolicitacoes'
import { DialogoDeExclusao } from '../components/DialogoDeExclusao'
import { ListaDeConsentimentos } from '../components/ListaDeConsentimentos'
import { SecaoDeDados } from '../components/SecaoDeDados'
import {
  useBaixarPacote,
  useCancelarSolicitacao,
  useConfirmarSolicitacao,
  useMeusDados,
  useRevogarConsentimento,
  useSolicitacoes,
  useSolicitar,
} from '../hooks/usePrivacidade'
import type { MeusDadosDaTurma } from '../types/privacidade.types'

/** O endereço numa linha só, como ele sairia num envelope. */
function endereco(turma: MeusDadosDaTurma) {
  const { endereco: e } = turma.perfil ?? {}

  if (!e?.logradouro) return null

  const rua = [e.logradouro, e.numero, e.complemento].filter(Boolean).join(', ')
  const cidade = [e.bairro, e.cidade && e.uf ? `${e.cidade}/${e.uf}` : e.cidade].filter(Boolean).join(' — ')

  return [rua, cidade, e.cep ? `CEP ${formatarCep(e.cep)}` : null].filter(Boolean).join(' · ')
}

/**
 * O portal do titular: o que a Kapa guarda sobre você, e o que você pode fazer a respeito.
 *
 * Uma tela por pessoa, e não por turma: quem está em duas formaturas vê as duas aqui, porque titular
 * na LGPD é a pessoa. É por isso que esta é a única tela do app que mostra dado de outra turma que
 * não a selecionada — e ela o faz sem pedir nada além do próprio token.
 *
 * Cada seção diz **por que** o dado existe e **por quanto tempo** fica. Sem essas duas linhas, a
 * tela cumpriria a letra do art. 18 e não responderia à pergunta que a pessoa veio fazer.
 */
export default function MinhaPrivacidadePage() {
  const dados = useMeusDados()
  const fila = useSolicitacoes()
  const solicitar = useSolicitar()
  const confirmar = useConfirmarSolicitacao()
  const cancelar = useCancelarSolicitacao()
  const baixar = useBaixarPacote()
  const revogar = useRevogarConsentimento()

  const ocupado = confirmar.isPending || cancelar.isPending || baixar.isPending

  if (dados.isPending) return <EsqueletoDeCartoes quantidade={4} />

  if (dados.isError) return <ErroDaConsulta erro={dados.error} />

  const { conta, turmas, consentimentos, comunicacoes } = dados.data

  return (
    <div className="grid gap-5">
      <Cartao
        titulo="Seus direitos sobre estes dados"
        icone={ShieldCheck}
        descricao="A Lei Geral de Proteção de Dados garante que você veja, corrija, leve embora e peça a eliminação do que guardamos."
        acao={
          <>
            <Button
              size="sm"
              disabled={solicitar.isPending}
              onClick={() => solicitar.mutate({ tipo: 'Exportacao' })}
            >
              <Download aria-hidden />
              Exportar meus dados
            </Button>
            <DialogoDeExclusao
              ocupado={solicitar.isPending}
              aoConfirmar={(senha, aoFalhar, aoConcluir) =>
                solicitar.mutate({ tipo: 'Exclusao', senha }, { onError: aoFalhar, onSuccess: aoConcluir })
              }
            />
          </>
        }
      >
        <p className="text-muted-foreground text-[15px]">
          Para <strong className="text-foreground font-medium">corrigir</strong> qualquer dado desta página,
          use{' '}
          <Link to={ROTAS.meuCadastro} className="text-brand-text underline underline-offset-4">
            Meus dados
          </Link>{' '}
          — o cadastro é seu e você o edita quando quiser. Para saber{' '}
          <strong className="text-foreground font-medium">com quem compartilhamos</strong>, veja a{' '}
          <Link to={ROTAS.operadores} className="text-brand-text underline underline-offset-4">
            lista de operadores
            <ExternalLink className="ml-0.5 inline size-3.5" aria-hidden />
          </Link>
          .
        </p>

        {fila.data ? (
          <CartaoDeSolicitacoes
            solicitacoes={fila.data}
            ocupado={ocupado}
            aoBaixar={(solicitacao) => baixar.mutate(solicitacao)}
            aoConfirmar={(id) => confirmar.mutate(id)}
            aoCancelar={(id) => cancelar.mutate(id)}
          />
        ) : null}
      </Cartao>

      {/* Duas colunas, como em Dados da formatura: à esquerda o que a Kapa guarda sobre você — a
          conta e cada turma, que é o que cresce —, à direita as duas provas, que são curtas e de
          altura fixa. Empilhado, quem tem duas turmas rolava a tela inteira para achar os
          consentimentos. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <div className="grid gap-5">
          <SecaoDeDados
            titulo="Conta"
            icone={UserRound}
            porQue="É o que permite você entrar, e é para onde mandamos aviso de cobrança e redefinição de senha."
            porQuanto="Enquanto a conta existir. Se você pedir a eliminação, estes campos são apagados e o acesso é encerrado."
          >
            <ListaDeDados>
              <Dado icone={UserRound} rotulo="Nome">
                {conta.nome}
              </Dado>
              <Dado icone={Mail} rotulo="E-mail">
                {conta.email}{' '}
                {conta.email_confirmado ? (
                  <Selo tom="sucesso">Confirmado</Selo>
                ) : (
                  <Selo tom="alerta">Não confirmado</Selo>
                )}
              </Dado>
              {conta.telefone ? (
                <Dado icone={BellRing} rotulo="Telefone">
                  {formatarTelefone(conta.telefone)}
                </Dado>
              ) : null}
              <Dado icone={ShieldCheck} rotulo="Conta criada em">
                {formatarDataHora(conta.criado_em)}
              </Dado>
            </ListaDeDados>
          </SecaoDeDados>

          {turmas.map((turma) => (
            <SecaoDeDados
              key={turma.formatura_id}
              titulo={turma.formatura}
              icone={GraduationCap}
              porQue="Cadastro, cobrança e adesão desta turma. O cadastro identifica quem assina o termo; a cobrança é o que você deve e o que já pagou."
              porQuanto="Enquanto a turma existir, e depois pelo prazo de guarda fiscal. A eliminação apaga o que identifica você e preserva os lançamentos, sem o seu nome."
              acao={turma.ativo ? null : <Selo tom="cinza">Vínculo inativo</Selo>}
            >
              <ListaDeDados>
                <Dado icone={GraduationCap} rotulo="Instituição">
                  {turma.instituicao} · {turma.papel}
                </Dado>
                {turma.perfil?.nome_completo ? (
                  <Dado icone={UserRound} rotulo="Nome completo">
                    {turma.perfil.nome_completo}
                  </Dado>
                ) : null}
                {turma.perfil?.cpf ? (
                  <Dado icone={UserRound} rotulo="CPF">
                    {formatarCpf(turma.perfil.cpf)}
                  </Dado>
                ) : null}
                {turma.perfil?.telefone ? (
                  <Dado icone={BellRing} rotulo="Telefone">
                    {formatarTelefone(turma.perfil.telefone)}
                  </Dado>
                ) : null}
                {endereco(turma) ? (
                  <Dado icone={UserRound} rotulo="Endereço">
                    {endereco(turma)}
                  </Dado>
                ) : null}
                {turma.perfil?.contato_de_emergencia.nome ? (
                  <Dado icone={BellRing} rotulo="Emergência">
                    {turma.perfil.contato_de_emergencia.nome}
                    {turma.perfil.contato_de_emergencia.parentesco
                      ? ` (${turma.perfil.contato_de_emergencia.parentesco})`
                      : ''}
                  </Dado>
                ) : null}
                <Dado icone={Wallet} rotulo="Cobrança">
                  {turma.financeiro.parcelas.length} parcela
                  {turma.financeiro.parcelas.length === 1 ? '' : 's'} ·{' '}
                  {formatarCentavos(turma.financeiro.total_em_centavos)} no total ·{' '}
                  {formatarCentavos(turma.financeiro.pago_em_centavos)} pagos
                </Dado>
                {turma.adesao ? (
                  <Dado icone={FileSignature} rotulo="Termo assinado">
                    versão {turma.adesao.versao} em {formatarDataHora(turma.adesao.aceito_em)}, do IP{' '}
                    {turma.adesao.endereco_ip}
                  </Dado>
                ) : null}
                {turma.perfil?.tem_foto ? (
                  <Dado icone={UserRound} rotulo="Foto">
                    Guardada
                  </Dado>
                ) : null}
              </ListaDeDados>
            </SecaoDeDados>
          ))}
        </div>

        <div className="grid gap-5">
          <SecaoDeDados
            titulo="Consentimentos"
            icone={FileSignature}
            porQue="É a prova de que a Kapa pediu sua autorização antes de tratar seus dados, e de qual texto valia naquele dia."
            porQuanto="Para sempre. O registro não é alterado nem apagado — revogar grava uma linha nova, e o aceite original continua."
          >
            <ListaDeConsentimentos
              consentimentos={consentimentos}
              revogando={revogar.isPending ? revogar.variables : undefined}
              aoRevogar={(id) => revogar.mutate(id)}
            />
          </SecaoDeDados>

          <SecaoDeDados
            titulo="Comunicações"
            icone={BellRing}
            porQue="Guardamos o que você escolheu receber e o registro do que já enviamos — é o que responde 'nunca fui avisado'."
            porQuanto="O histórico de envio fica 180 dias. As preferências ficam enquanto o vínculo existir."
          >
            <ListaDeDados>
              <Dado icone={Mail} rotulo="Avisos enviados">
                {comunicacoes.notificacoes_enviadas}
                {comunicacoes.ultima_enviada_em
                  ? ` · o último em ${formatarData(comunicacoes.ultima_enviada_em)}`
                  : ''}
              </Dado>
              {comunicacoes.preferencias.map((preferencia) => (
                <Dado
                  key={`${preferencia.formatura_id}-${preferencia.tipo}`}
                  icone={BellRing}
                  rotulo={preferencia.tipo}
                >
                  {preferencia.ativa ? 'Ligado' : 'Desligado'}
                </Dado>
              ))}
            </ListaDeDados>
          </SecaoDeDados>
        </div>
      </div>
    </div>
  )
}
