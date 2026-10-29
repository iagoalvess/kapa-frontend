import { Ban, Copy, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { AcaoComConfirmacao, AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { DialogoDeTexto } from '@/components/DialogoDeTexto'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { rotaDoAcessoDaPortaria } from '@/config/rotas'
import { copiar } from '@/lib/copiar'
import { formatarDataHora } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import {
  useAcessosDaPortaria,
  useCortarAcessoDaPortaria,
  useLiberarAcessoDaPortaria,
  useNovoLinkDaPortaria,
} from '../hooks/useConvitesDaFesta'
import type { AcessoDaPortaria, SituacaoDoAcesso } from '../types/convites.types'

const esquemaDoNome = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(60, 'Use até 60 caracteres.'),
})

const SITUACOES: Record<SituacaoDoAcesso, { rotulo: string; tom: TomDoSelo }> = {
  Aguardando: { rotulo: 'Aguardando abrir', tom: 'alerta' },
  Ativo: { rotulo: 'Ativo no celular', tom: 'sucesso' },
}

/** O link inteiro, com o domínio — é o que vai no WhatsApp. */
const linkDe = (acesso: AcessoDaPortaria) =>
  `${window.location.origin}${rotaDoAcessoDaPortaria(acesso.token ?? '')}`

async function copiarLink(acesso: AcessoDaPortaria) {
  if (await copiar(linkDe(acesso))) toast.success(`Link de ${acesso.nome} copiado.`)
  else toast.error('Não deu para copiar. Toque e segure o link para copiar à mão.')
}

/**
 * Quem fica na porta sem ser da turma — o segurança, o cerimonial (15/10/2026).
 *
 * A Gestão cadastra o nome e manda o link. O primeiro celular que abre vira portaria do evento, sem conta e sem
 * vaga no plano, até 12 h depois do horário. O link vale uma vez: se a pessoa trocar de celular, "Gerar outro
 * link" corta o antigo e cria um novo.
 *
 * @param eventoId O evento aberto na portaria.
 */
export function PessoasNaPortaria({ eventoId }: { eventoId: string }) {
  const acessos = useAcessosDaPortaria(eventoId)
  const liberar = useLiberarAcessoDaPortaria()
  const novoLink = useNovoLinkDaPortaria()
  const cortar = useCortarAcessoDaPortaria()

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-sm">
        Mande um link para quem vai ficar na porta. A pessoa abre no celular dela e passa a validar os
        convites deste evento, sem conta no Kapa. O acesso vale até 12 h depois do horário do evento, e cada
        link funciona em um celular só.
      </p>

      {acessos.isPending ? <EsqueletoDeTexto linhas={2} /> : null}
      {acessos.isError ? (
        <ErroDaConsulta erro={acessos.error} aoTentarDeNovo={() => void acessos.refetch()} />
      ) : null}
      {acessos.data && acessos.data.length > 0 ? (
        <ul className="grid gap-2" aria-label="Pessoas na portaria">
          {acessos.data.map((acesso) => (
            <li key={acesso.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="grid min-w-0 gap-1">
                <span className="truncate font-medium">{acesso.nome}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <Selo tom={SITUACOES[acesso.situacao].tom}>{SITUACOES[acesso.situacao].rotulo}</Selo>
                  {acesso.ativado_em ? (
                    <span className="text-muted-foreground text-xs">
                      desde {formatarDataHora(acesso.ativado_em)}
                    </span>
                  ) : null}
                </span>
              </div>

              <AcoesDaLinha rotulo={`Ações de ${acesso.nome}`}>
                {acesso.situacao === 'Aguardando' ? (
                  <AcaoDaLinha
                    rotulo="Copiar link"
                    descricaoAcessivel={`Copiar o link de ${acesso.nome}`}
                    icone={Copy}
                    onClick={() => void copiarLink(acesso)}
                  />
                ) : null}
                <AcaoComConfirmacao
                  rotulo="Gerar outro link"
                  descricaoAcessivel={`Gerar outro link para ${acesso.nome}`}
                  icone={RefreshCw}
                  tom="neutra"
                  confirmacao={{
                    titulo: `Gerar outro link para ${acesso.nome}?`,
                    descricao:
                      'O link e o celular de agora param de valer. Use quando a pessoa trocou de celular ou o link foi parar com quem não devia.',
                    rotulo: 'Gerar',
                    aoConfirmar: () =>
                      novoLink.mutate(acesso.id, {
                        onSuccess: (novo) => void copiarLink(novo),
                        onError: avisarErro,
                      }),
                  }}
                />
                <AcaoComConfirmacao
                  rotulo="Cortar acesso"
                  descricaoAcessivel={`Cortar o acesso de ${acesso.nome}`}
                  icone={Ban}
                  confirmacao={{
                    titulo: `Cortar o acesso de ${acesso.nome}?`,
                    descricao: 'O celular dela para de validar entradas na hora.',
                    rotulo: 'Cortar',
                    aoConfirmar: () =>
                      cortar.mutate(acesso.id, {
                        onSuccess: () => toast.info(`Acesso de ${acesso.nome} cortado.`),
                        onError: avisarErro,
                      }),
                  }}
                />
              </AcoesDaLinha>
            </li>
          ))}
        </ul>
      ) : null}

      <DialogoDeTexto
        gatilho="Nova pessoa"
        gatilhoPrincipal={Plus}
        titulo="Nova pessoa na portaria"
        descricao="O Kapa gera um link para você mandar a ela. Quem abrir primeiro passa a validar os convites deste evento."
        campo="nome"
        rotulo="Nome"
        linhaUnica
        esquema={esquemaDoNome}
        confirmar="Liberar"
        confirmarOcupado="Liberando…"
        ocupado={liberar.isPending}
        aoEnviar={(nome, concluir, falhar) =>
          liberar.mutate(
            { evento_id: eventoId, nome },
            {
              onSuccess: (acesso) => {
                concluir()
                void copiarLink(acesso)
              },
              onError: falhar,
            },
          )
        }
      />
    </div>
  )
}
