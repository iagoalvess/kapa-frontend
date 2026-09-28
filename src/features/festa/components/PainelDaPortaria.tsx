import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSessao } from '@/hooks/useSessao'
import { formatarDataHora } from '@/lib/formato'
import { useConsultaNaPortaria, useDesfazerEntrada, useValidarEntrada } from '../hooks/useConvitesDaFesta'
import { type ResultadoDaValidacao as Resultado, resultadoDaValidacao } from '../lib/resultadoDaValidacao'
import { ROTULOS_DE_SITUACAO } from '../types/convites.types'
import { ResultadoDaValidacao } from './ResultadoDaValidacao'

/**
 * A portaria dentro da página do convite: o que a Gestão vê quando a câmera do celular abre o QR.
 *
 * A câmera nativa é o leitor (decisão 3): o QR carrega a URL da página, e quem está logado como
 * Gestão da turma do convite vê "Validar entrada". Convite de outra turma responde 404 aqui, e o
 * painel simplesmente não aparece — a página continua sendo o convite. Fora da janela (P7), o botão
 * dá lugar ao horário em que a validação abre.
 *
 * @param token O token do QR.
 */
export function PainelDaPortaria({ token }: { token: string }) {
  const { usuario } = useSessao()
  const consulta = useConsultaNaPortaria(token, true)
  const validar = useValidarEntrada()
  const desfazer = useDesfazerEntrada()
  const [resultado, definirResultado] = useState<Resultado | null>(null)

  if (!consulta.data) return null

  const { convite, evento, janela_aberta } = consulta.data
  const aoResponder = (resposta: Parameters<typeof resultadoDaValidacao>[0]) =>
    definirResultado(resultadoDaValidacao(resposta, usuario?.id ?? null))

  return (
    <section aria-label="Portaria" className="grid gap-3 border-t pt-6 text-left">
      <p className="text-muted-foreground text-sm">
        Portaria · {evento.titulo} · {ROTULOS_DE_SITUACAO[convite.situacao]}
        {convite.convidado_de ? ` · convidado de ${convite.convidado_de}` : ' · cortesia da turma'}
      </p>

      {resultado ? <ResultadoDaValidacao resultado={resultado} /> : null}

      {!resultado && convite.situacao === 'Revogado' ? (
        <ResultadoDaValidacao
          resultado={{
            tom: 'barrado',
            titulo: 'Convite revogado',
            detalhe: convite.motivo_da_revogacao,
            entrada: null,
            semRede: false,
          }}
        />
      ) : null}

      {janela_aberta ? (
        resultado?.entrada ? (
          <Button
            variant="outline"
            size="lg"
            disabled={desfazer.isPending}
            onClick={() => {
              if (resultado.entrada)
                desfazer.mutate(resultado.entrada.check_in_id, { onSuccess: () => definirResultado(null) })
            }}
          >
            Desfazer entrada
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-14 text-lg"
            disabled={validar.isPending}
            onClick={() =>
              validar.mutate(
                { codigo: token },
                {
                  onSuccess: (entrada) => aoResponder({ entrada }),
                  onError: (erro) => aoResponder({ erro }),
                },
              )
            }
          >
            {validar.isPending ? 'Validando…' : 'Validar entrada'}
          </Button>
        )
      ) : (
        <p className="bg-warning-bg text-warning-text rounded-xl p-3 text-sm">
          {new Date(evento.janela_abre_em) > new Date()
            ? `A validação abre em ${formatarDataHora(evento.janela_abre_em)}.`
            : 'A validação deste evento já fechou.'}
        </p>
      )}
    </section>
  )
}
