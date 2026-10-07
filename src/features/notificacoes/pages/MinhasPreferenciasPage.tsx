import { BellRing, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { AcaoDeUpgrade } from '@/components/AcaoDeUpgrade'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { PAPEIS } from '@/config/perfis'
import { MODULOS } from '@/config/planos'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePlanoDaTurma, usePlanoQueLibera } from '@/hooks/usePlanoDaTurma'
import { usePapel } from '@/hooks/useSessao'
import { avisarErro } from '@/lib/http/erros'
import { usePreferencias, useSalvarPreferencias } from '../hooks/usePreferencias'
import { DICAS_DE_TIPO, type Preferencia, ROTULOS_DE_TIPO } from '../types/notificacoes.types'

/**
 * O que o próprio membro recebe por e-mail.
 *
 * Lembrete de assembleia e aviso do mural, ele desliga. Cobrança de parcela vencida, não — é
 * comunicação contratual, prevista no termo de adesão, e o cadeado diz isso na tela em vez de deixar
 * a pessoa tentar e levar um erro.
 *
 * Grava a cada clique, sem botão "Salvar": é uma chave por assunto, e um rodapé de formulário aqui
 * só faria a pessoa marcar e esquecer de confirmar.
 *
 * Os avisos são módulo do plano (`avisos`). Fora dele o cartão não consulta nada: a Gestão vê em que plano
 * isso existe e o caminho para contratar, como nas outras áreas trancadas; o formando não vê o cartão — ele
 * não contrata, e um cadeado ali só diria que falta algo que não depende dele (06/10/2026).
 */
export default function MinhasPreferenciasPage() {
  const { inclui, bloqueia } = usePlanoDaTurma()
  const planoQueLibera = usePlanoQueLibera(MODULOS.avisos)
  const daGestao = usePapel().tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const preferencias = usePreferencias(inclui(MODULOS.avisos))
  const salvar = useSalvarPreferencias()
  const editavel = useEscritaLiberada()
  const trancado = bloqueia(MODULOS.avisos)

  if (trancado && !daGestao) return null

  const alternar = (preferencia: Preferencia) =>
    salvar.mutate([{ tipo: preferencia.tipo, ativa: !preferencia.ativa }], {
      onSuccess: () => toast.success('Preferência salva.'),
      onError: avisarErro,
    })

  return (
    <Cartao
      titulo="Notificações"
      icone={BellRing}
      descricao="O que a Kapa manda para o seu e-mail. A cobrança de parcela faz parte do termo de adesão e chega sempre."
    >
      {trancado ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-brand-tint text-brand-text inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
            <Lock className="size-3" aria-hidden />
            {planoQueLibera ? `Disponível no plano ${planoQueLibera.nome}` : 'Fora do plano da turma'}
          </span>
          <AcaoDeUpgrade />
        </div>
      ) : null}

      {!trancado && preferencias.isPending ? <EsqueletoDeTexto linhas={4} /> : null}
      {preferencias.isError ? (
        <ErroDaConsulta erro={preferencias.error} aoTentarDeNovo={() => void preferencias.refetch()} />
      ) : null}

      {preferencias.data ? (
        <ul className="divide-border -mt-2 divide-y">
          {preferencias.data.map((preferencia) => (
            <li key={preferencia.tipo} className="flex items-start gap-3 py-3">
              <input
                id={`notificacao-${preferencia.tipo}`}
                type="checkbox"
                checked={preferencia.ativa}
                disabled={preferencia.obrigatoria || !editavel || salvar.isPending}
                onChange={() => alternar(preferencia)}
                className="mt-0.5 size-4"
              />
              <div className="grid min-w-0 gap-0.5">
                <label
                  htmlFor={`notificacao-${preferencia.tipo}`}
                  className="text-foreground flex items-center gap-1.5 text-sm font-medium"
                >
                  {ROTULOS_DE_TIPO[preferencia.tipo]}
                  {preferencia.obrigatoria ? (
                    <>
                      <Lock className="text-texto-muted size-3.5" aria-hidden />
                      <span className="sr-only">Não pode ser desligada.</span>
                    </>
                  ) : null}
                </label>
                <p className="text-muted-foreground text-sm">{DICAS_DE_TIPO[preferencia.tipo]}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Cartao>
  )
}
