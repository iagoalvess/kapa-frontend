import { ClipboardCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { toast } from 'sonner'
import { Avatar } from '@/components/Avatar'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { Select } from '@/components/Select'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { usePapel, useSessao } from '@/hooks/useSessao'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import {
  contar,
  useAlterarPapel,
  useMembros,
  useReligarMembro,
  useRemoverMembro,
  useResumoDeMembros,
} from '../hooks/useMembros'
import { DialogoDeDesligamento } from '../components/DialogoDeDesligamento'
import { IndicadoresDeMembros } from '../components/IndicadoresDeMembros'
import { SeloDeDesligado } from '../components/SeloDeDesligado'
import type { MembroDaFormatura, SituacaoDoCadastro } from '../types/membros.types'

const TAMANHO_DA_PAGINA = 20

/**
 * Situação do vínculo, como vai na URL, e o filtro que ela vira na API.
 *
 * Desligado e removido compartilham `ativo: false` e se separam por `desligado` — são dois fatos
 * diferentes com o mesmo efeito no acesso (decisão 1 da Sprint 15).
 */
const SITUACOES = {
  ativos: { rotulo: 'Ativos', ativo: true, desligado: undefined },
  desligados: { rotulo: 'Desligados', ativo: false, desligado: true },
  removidos: { rotulo: 'Removidos', ativo: false, desligado: false },
  todos: { rotulo: 'Todos', ativo: undefined, desligado: undefined },
} as const

type Situacao = keyof typeof SITUACOES

/** Situações do cadastro, como vão na URL e na API. */
const CADASTROS: Record<SituacaoDoCadastro, string> = {
  Pendente: 'Falta o essencial',
  Incompleto: 'Incompletos',
  Completo: 'Completos',
}

const ehSituacao = (valor: string | null): valor is Situacao => valor !== null && valor in SITUACOES
const ehCadastro = (valor: string | null): valor is SituacaoDoCadastro => valor !== null && valor in CADASTROS
const ehPapel = (valor: string | null): valor is Papel =>
  valor !== null && (Object.values(PAPEIS) as string[]).includes(valor)

/**
 * Membros da formatura: quem são, que papel têm, quanto do cadastro preencheram, e quem sai.
 *
 * Comissão e Tesouraria veem a lista; só o Presidente troca papel e remove. Os controles somem
 * para quem não pode — a recusa de verdade é da API, que confere o papel no vínculo gravado.
 * O nome abre o cadastro do membro.
 *
 * Página, busca, situação, papel e cadastro vivem na URL: voltar, recarregar e mandar o link
 * devolvem a mesma lista. As contagens dos filtros acompanham a situação escolhida, para o número
 * na pílula ser o que a lista vai trazer ao clicar.
 */
export default function MembrosPage() {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const { ehPresidente } = usePapel()
  const resumo = useResumoDeMembros()

  const situacaoNaUrl = parametros.get('situacao')
  const situacao: Situacao = ehSituacao(situacaoNaUrl) ? situacaoNaUrl : 'ativos'
  const papelNaUrl = parametros.get('papel')
  const papel = ehPapel(papelNaUrl) ? papelNaUrl : undefined
  const cadastroNaUrl = parametros.get('cadastro')
  const cadastro = ehCadastro(cadastroNaUrl) ? cadastroNaUrl : undefined
  const { ativo, desligado } = SITUACOES[situacao]

  /** Grava mudanças na URL; `null` remove o parâmetro. Filtro novo sempre volta à página 1. */
  const ordenacao = useOrdenacao(atualizar)
  const membros = useMembros({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    busca: busca || undefined,
    ativo,
    desligado,
    papel,
    cadastro,
    ...ordenacao.filtro,
  })

  const contagem = (filtro: Parameters<typeof contar>[1]) =>
    resumo.data ? contar(resumo.data, filtro) : undefined

  // Removeu o último da última página: a página pedida deixou de existir, volta para a última que existe.
  if (membros.data && membros.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, membros.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  return (
    <>
      <IndicadoresDeMembros />

      <FiltrosDaPlanilha
        principal={
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Situação</legend>
            {Object.entries(SITUACOES).map(
              ([valor, { rotulo, ativo: filtroAtivo, desligado: filtroDesligado }]) => (
                <Chip
                  key={valor}
                  tom="claro"
                  ativo={situacao === valor}
                  contagem={contagem({ ativo: filtroAtivo, desligado: filtroDesligado, papel })}
                  onClick={() => atualizar({ situacao: valor === 'ativos' ? null : valor })}
                >
                  {rotulo}
                </Chip>
              ),
            )}
          </fieldset>
        }
        legenda="Papel"
        filtros={Object.values(PAPEIS).map((valor) => (
          <Chip
            key={valor}
            ativo={papel === valor}
            contagem={contagem({ ativo, desligado, papel: valor })}
            onClick={() => atualizar({ papel: papel === valor ? null : valor })}
          >
            {ROTULOS_DE_PAPEL[valor]}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar membro',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={
          <>
            <FiltrosDeCadastro
              cadastro={cadastro}
              aoEscolher={(valor) => atualizar({ cadastro: cadastro === valor ? null : valor })}
            />
            {/* Adesões saiu do menu da esquerda e virou porta daqui: é a mesma turma vista de outro
                ângulo — quem já assinou o termo —, e quem vai atrás disso chegou por esta lista.
                O recorte é o mesmo da rota, então quem lê Membros lê Adesões. */}
            <Button asChild size="sm" className="h-8">
              <Link to={ROTAS.adesoes}>
                <ClipboardCheck aria-hidden />
                Adesões
              </Link>
            </Button>
          </>
        }
        contagem={{
          mostrando: membros.data?.itens.length ?? 0,
          total: membros.data?.total ?? 0,
          unidade: 'membros',
        }}
      />

      <Planilha
        rotulo="Lista de membros"
        consulta={membros}
        // Toda turma tem ao menos o Presidente: lista vazia é sempre busca ou filtro sem resultado.
        vazio={{ titulo: 'Nenhum membro encontrado', dica: 'Tente outra busca ou tire algum filtro.' }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="membro">Membro</ColunaOrdenavel>
            <ColunaOrdenavel coluna="papel">Papel</ColunaOrdenavel>
            <ColunaOrdenavel coluna="cadastro">Cadastro</ColunaOrdenavel>
            <ColunaOrdenavel coluna="situacao">Situação</ColunaOrdenavel>
            {ehPresidente ? (
              <th className="py-3 font-normal">
                <span className="sr-only">Ações</span>
              </th>
            ) : null}
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {(membros.data?.itens ?? []).map((membro) => (
          <LinhaDeMembro key={membro.usuario_id} membro={membro} editavel={ehPresidente} />
        ))}
      </Planilha>
    </>
  )
}

/** A situação do cadastro, no painel "Filtros" ao lado da busca: não precisa ficar à vista. */
function FiltrosDeCadastro({
  cadastro,
  aoEscolher,
}: {
  cadastro?: SituacaoDoCadastro
  aoEscolher: (valor: SituacaoDoCadastro) => void
}) {
  return (
    <BotaoDeFiltros id="filtros-de-membros" ligados={cadastro ? 1 : 0}>
      <fieldset className="grid gap-2">
        <legend className="text-muted-foreground mb-2 text-sm">Cadastro</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CADASTROS).map(([valor, rotulo]) => (
            <Chip
              key={valor}
              ativo={cadastro === valor}
              onClick={() => aoEscolher(valor as SituacaoDoCadastro)}
            >
              {rotulo}
            </Chip>
          ))}
        </div>
      </fieldset>
    </BotaoDeFiltros>
  )
}

/** A mensagem da API já explica o que fazer (`formatura.ultimo_presidente` e companhia). */
function avisarErro(erro: unknown) {
  toast.error(mensagemDoErro(erro))
}

/**
 * A porta de saída de um membro ativo — **uma só**, escolhida pela adesão dele (decisão 1 da
 * Sprint 15).
 *
 * Quem tem adesão aderiu, deve e pagou parte: sai por Desligar, que cancela o que ainda não venceu
 * e registra o porquê. Quem não tem é erro de cadastro: sai por Remover, que não toca em dinheiro
 * nenhum. Duas portas para o mesmo estado, com efeitos diferentes sobre dinheiro, é como alguém
 * apaga uma dívida sem querer.
 *
 * A adesão vem na própria linha (`tem_adesao`), e não de uma consulta por membro: a lista tem vinte
 * linhas, e vinte requisições para decidir o rótulo de um botão é uma tela que pisca.
 */
function AcaoDeSaida({
  membro,
  ocupado,
  ehOProprio,
  nome,
}: {
  membro: MembroDaFormatura
  ocupado: boolean
  ehOProprio: boolean
  nome: string
}) {
  const remover = useRemoverMembro()

  if (membro.tem_adesao) {
    return <DialogoDeDesligamento membro={membro} desabilitado={ocupado} />
  }

  return (
    <DialogoDeConfirmacao
      gatilho={
        <Button variant="outline" size="sm" disabled={ocupado}>
          Remover
        </Button>
      }
      titulo={ehOProprio ? 'Sair da formatura?' : `Remover ${nome}?`}
      descricao={
        ehOProprio
          ? 'Você perderá o acesso a esta turma. O seu histórico de pagamentos e adesão é mantido.'
          : 'A pessoa perde o acesso à turma na hora. O histórico de pagamentos e adesão dela é mantido.'
      }
      rotulo={ehOProprio ? 'Sair' : 'Remover'}
      destrutivo
      aoConfirmar={() => remover.mutate(membro.usuario_id, { onError: avisarErro })}
    />
  )
}

function LinhaDeMembro({ membro, editavel }: { membro: MembroDaFormatura; editavel: boolean }) {
  const { usuario } = useSessao()
  const alterar = useAlterarPapel()
  const religar = useReligarMembro()

  // Papel escolhido para si mesmo, aguardando confirmação: deixar a presidência tira o próprio acesso.
  const [papelAConfirmar, definirPapelAConfirmar] = useState<Papel | null>(null)

  const escritaLiberada = useEscritaLiberada()

  // Formatura fora de Ativa: os controles ficam, desabilitados — quem recusa de verdade é a API.
  const ocupado = alterar.isPending || religar.isPending || !escritaLiberada
  const podeEditar = editavel && membro.ativo
  const ehOProprio = membro.usuario_id === usuario?.id
  const nome = membro.nome_completo ?? membro.nome

  const trocarPapel = (papel: Papel) =>
    alterar.mutate({ usuario_id: membro.usuario_id, papel }, { onError: avisarErro })

  const escolherPapel = (papel: Papel) => {
    if (ehOProprio && membro.papel === PAPEIS.presidente) definirPapelAConfirmar(papel)
    else trocarPapel(papel)
  }

  return (
    // Removido fica esmaecido, como os cartões fora de foco da referência: está na lista, mas
    // não disputa atenção com quem está ativo.
    <tr className={cn('border-b last:border-0', !membro.ativo && 'text-muted-foreground')}>
      <td className="py-3 pr-4">
        <div className={cn('flex items-center gap-3', !membro.ativo && 'opacity-60')}>
          <Avatar nome={nome} semente={membro.usuario_id} className="size-8 text-sm" />
          <div className="grid min-w-0">
            {/* Removido não tem cadastro para abrir: a API só mostra o de quem ainda está na turma. */}
            {membro.ativo ? (
              <Link
                to={`${ROTAS.membros}/${membro.usuario_id}`}
                className="text-foreground truncate font-medium hover:underline"
              >
                {nome}
              </Link>
            ) : (
              <span className="text-foreground truncate font-medium">{nome}</span>
            )}
            <span className="text-texto-muted truncate">{membro.email}</span>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        {podeEditar ? (
          <Select
            aria-label={`Papel de ${nome}`}
            className="h-7 rounded-full text-sm md:text-sm"
            value={membro.papel}
            disabled={ocupado}
            onChange={(evento) => escolherPapel(evento.target.value as Papel)}
          >
            {Object.values(PAPEIS).map((papel) => (
              <option key={papel} value={papel}>
                {ROTULOS_DE_PAPEL[papel]}
              </option>
            ))}
          </Select>
        ) : (
          <Selo tom={membro.papel === PAPEIS.presidente ? 'marca' : 'neutro'}>
            {ROTULOS_DE_PAPEL[membro.papel]}
          </Selo>
        )}

        <DialogoDeConfirmacao
          aberto={papelAConfirmar !== null}
          aoFechar={() => definirPapelAConfirmar(null)}
          titulo="Deixar a presidência?"
          descricao={`Você passará a ${papelAConfirmar ? ROTULOS_DE_PAPEL[papelAConfirmar] : ''} e perderá, na hora, o acesso à gestão de membros e aos dados da turma.`}
          rotulo="Deixar a presidência"
          aoConfirmar={() => papelAConfirmar && trocarPapel(papelAConfirmar)}
        />
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground w-10 tabular-nums">{membro.completude}%</span>
          {membro.essencial_pendente ? (
            <Selo tom="alerta">Falta o essencial</Selo>
          ) : membro.completude === 100 ? (
            <Selo tom="sucesso">Completo</Selo>
          ) : null}
        </div>
      </td>
      <td className="py-3 pr-4">
        <SeloDeDesligado membro={membro} />
      </td>
      {editavel ? (
        <td className="py-3 text-right">
          {membro.ativo ? (
            <AcaoDeSaida membro={membro} ocupado={ocupado} ehOProprio={ehOProprio} nome={nome} />
          ) : membro.desligado_em ? (
            <DialogoDeConfirmacao
              gatilho={
                <Button variant="outline" size="sm" disabled={ocupado}>
                  Religar
                </Button>
              }
              titulo={`Religar ${nome}?`}
              descricao="O acesso dele volta. As parcelas canceladas no desligamento continuam canceladas — para voltar a cobrar, lance de novo."
              rotulo="Religar"
              aoConfirmar={() => religar.mutate(membro.usuario_id, { onError: avisarErro })}
            />
          ) : null}
        </td>
      ) : null}
    </tr>
  )
}
