import { ArrowRight } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { estilos } from '@/components/layout/LayoutDeAutenticacao'
import { PERFIS, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { usePerfil } from '@/hooks/useSessao'
import { formatarData } from '@/lib/formato'
import { SemFormatura } from '../components/SemFormatura'
import { useMinhasFormaturas, useSelecionarFormatura } from '../hooks/useFormaturas'
import type { FormaturaDoUsuario } from '../types/formaturas.types'

/**
 * Escolha da formatura da sessão.
 *
 * Só chega aqui quem tem **nenhuma** ou **duas ou mais**: com um vínculo só, o backend já emite
 * o token com a formatura no login, porque confirmar a única opção da lista não é uma decisão.
 * Nenhuma formatura não é uma lista vazia — é o começo do produto, e tem tela própria.
 */
export default function SelecaoDeFormaturaPage() {
  const navegar = useNavigate()
  const formaturas = useMinhasFormaturas()
  const selecionar = useSelecionarFormatura()
  const ehDaKapa = usePerfil().tem(PERFIS.administrador)

  // Guardado pela guarda `ExigeFormatura`: para onde voltar depois de escolher.
  const destino = useEstadoDeNavegacao('de') ?? ROTAS.inicio

  const escolher = (id: string) =>
    selecionar.mutate(id, { onSuccess: () => navegar(destino, { replace: true }) })

  // Quem é da Kapa sem turma não é "conta sem formatura": a porta dele é o painel (Sprint 44, E1).
  if (formaturas.data?.length === 0)
    return ehDaKapa ? <Navigate to={ROTAS.painelVisaoGeral} replace /> : <SemFormatura />

  return (
    <>
      <h1 className={estilos.titulo}>Escolha a formatura</h1>
      <p className={estilos.subtitulo}>Escolha a turma que você quer acessar agora.</p>

      <div className="grid gap-2">
        {formaturas.isPending ? (
          <EsqueletoDeCartoes quantidade={2} altura="h-14" forma="linha" className="md:grid-cols-1" />
        ) : null}

        {formaturas.isError ? (
          <ErroDaConsulta erro={formaturas.error} aoTentarDeNovo={() => void formaturas.refetch()} />
        ) : null}

        {formaturas.data ? (
          <ul className="border-border divide-border motion-safe:animate-entrar divide-y border-y">
            {formaturas.data.map((formatura) => (
              <li key={formatura.id}>
                <LinhaDaTurma
                  formatura={formatura}
                  desabilitada={selecionar.isPending}
                  aoEscolher={() => escolher(formatura.id)}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {selecionar.isError ? <ErroDaConsulta emLinha erro={selecionar.error} /> : null}
      </div>
    </>
  )
}

/**
 * Uma turma na lista: o ano à esquerda, como a turma se chama entre os formandos ("a turma de 2028"), e o
 * resto em linha, no ritmo das listas do app — sem caixa nem pílula. A curso e a instituição são o que
 * separa duas turmas de nome parecido; escolher a errada abre o caixa de outra formatura.
 *
 * A turma de onde a pessoa foi desligada continua na lista (o extrato é a prova do que ela pagou), mas
 * apagada e dizendo desde quando.
 */
function LinhaDaTurma({
  formatura,
  desabilitada,
  aoEscolher,
}: {
  formatura: FormaturaDoUsuario
  desabilitada: boolean
  aoEscolher: () => void
}) {
  const desligada = Boolean(formatura.desligado_em)
  const ondeEstuda = [formatura.curso, formatura.instituicao].filter(Boolean).join(' · ')
  const papel = desligada
    ? `Desligado em ${formatarData(formatura.desligado_em)}`
    : ROTULOS_DE_PAPEL[formatura.papel]

  return (
    <button
      type="button"
      disabled={desabilitada}
      onClick={aoEscolher}
      className="group hover:bg-brand-wash focus-visible:bg-brand-wash grid w-full cursor-pointer grid-cols-[3.5rem_1fr_auto] items-center gap-4 px-2 py-4 text-left outline-none disabled:cursor-wait"
    >
      <span className={`grid leading-none ${desligada ? 'text-texto-muted' : ''}`}>
        <span className="text-xl font-extrabold tracking-[-0.02em] tabular-nums">{formatura.ano || '—'}</span>
        {formatura.semestre ? (
          <span className="text-muted-foreground mt-1 text-xs">{formatura.semestre}º sem.</span>
        ) : null}
      </span>

      <span className="grid min-w-0 gap-0.5">
        <span className={`truncate font-semibold ${desligada ? 'text-muted-foreground' : ''}`}>
          {formatura.nome}
        </span>
        {ondeEstuda ? <span className="text-muted-foreground truncate text-[13px]">{ondeEstuda}</span> : null}
        <span className={`text-xs ${desligada ? 'text-texto-muted' : 'text-brand-text font-medium'}`}>
          {papel}
        </span>
      </span>

      <ArrowRight
        aria-hidden
        className="text-texto-muted group-hover:text-brand-text size-4 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  )
}
