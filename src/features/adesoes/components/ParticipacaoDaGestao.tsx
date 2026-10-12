import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { avisarErro } from '@/lib/http/erros'
import { useApenasGestao } from '../hooks/useAderir'

/**
 * A pergunta que só a comissão responde (Sprint 54, P1), numa linha acima do termo: vai participar da formatura, ou só
 * ajudar a organizar? Direto no fundo da tela, sem cartão — é uma pergunta de passagem, não uma seção.
 *
 * "Apenas gestão" não é isenção: a pessoa não contrata pacote, não gera parcela nem convite de participante, e sai da
 * conta de quem falta aderir. O termo continua na tela — ela volta atrás quando quiser, e aderir desmarca sozinho.
 *
 * @param apenasGestao O que a pessoa já indicou.
 */
export function ParticipacaoDaGestao({ apenasGestao }: { apenasGestao: boolean }) {
  const definir = useApenasGestao()
  const escritaLiberada = useEscritaLiberada()

  const mudar = () =>
    definir.mutate(!apenasGestao, {
      onSuccess: () =>
        toast.success(
          apenasGestao
            ? 'Pronto: monte a sua cesta para aderir.'
            : 'Anotado: você vai apenas ajudar na gestão.',
        ),
      onError: avisarErro,
    })

  return (
    <p className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
      <span>
        {apenasGestao
          ? 'Você indicou que vai apenas ajudar na gestão: sem pacote, parcela nem convite no seu nome.'
          : 'É da comissão e vai só ajudar a organizar, sem participar da formatura?'}
      </span>
      <Button size="xs" disabled={!escritaLiberada || definir.isPending} onClick={mudar}>
        {definir.isPending ? 'Salvando…' : apenasGestao ? 'Quero participar' : 'Vou apenas ajudar na gestão'}
      </Button>
    </p>
  )
}
