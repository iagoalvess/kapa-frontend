import { BellRing, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { mensagemDoErro } from '@/lib/http/erros'
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
 */
export default function MinhasPreferenciasPage() {
  const preferencias = usePreferencias()
  const salvar = useSalvarPreferencias()
  const editavel = useEscritaLiberada()

  const alternar = (preferencia: Preferencia) =>
    salvar.mutate([{ tipo: preferencia.tipo, ativa: !preferencia.ativa }], {
      onSuccess: () => toast.success('Preferência salva.'),
      onError: (erro) => toast.error(mensagemDoErro(erro)),
    })

  return (
    <Cartao
      titulo="Notificações"
      icone={BellRing}
      descricao="O que a Kapa manda para o seu e-mail. A cobrança de parcela faz parte do termo de adesão e chega sempre."
    >
      {preferencias.isPending ? <EsqueletoDeTexto linhas={4} /> : null}
      {preferencias.isError ? <ErroDaConsulta erro={preferencias.error} /> : null}

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
                className="accent-primary mt-0.5 size-4 disabled:opacity-60"
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
