import { toast } from 'sonner'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Button } from '@/components/ui/button'
import { avisarErro } from '@/lib/http/erros'
import { useDesfazerEntrada } from '../hooks/useConvitesDaFesta'
import type { ResultadoDaValidacao as Resultado } from '../lib/resultadoDaValidacao'
import { ResultadoDaValidacao } from './ResultadoDaValidacao'

interface Props {
  /** O que a validação pela linha da lista devolveu; fechado, é `null`. */
  resultado: (Resultado & { codigo: string }) | null
  aoFechar: () => void
  /** Marca a entrada neste celular, quando a falha foi de internet (decisões 7 e 16). */
  aoMarcarSemRede: (codigo: string) => void
  /** A entrada foi desfeita: o resultado já não vale. */
  aoDesfazer: () => void
}

/**
 * O resultado da validação pela linha da lista, num diálogo — grande, para quem está em pé, no
 * escuro e com fila na frente ler de relance.
 *
 * A validação sai da linha, e o resultado não caberia nela; a lista da porta fica enxuta.
 */
export function DialogoDaValidacao({ resultado, aoFechar, aoMarcarSemRede, aoDesfazer }: Props) {
  const desfazer = useDesfazerEntrada()

  return (
    <DialogoDeFormulario
      aberto={!!resultado}
      aoFechar={aoFechar}
      titulo="Validar entrada"
      descricao={resultado ? `Convite ${resultado.codigo}` : ''}
      largura="estreito"
    >
      {resultado ? (
        <div className="grid gap-3">
          <ResultadoDaValidacao resultado={resultado} />

          {resultado.semRede ? (
            <Button size="lg" variant="outline" onClick={() => aoMarcarSemRede(resultado.codigo)}>
              Registrar entrada no celular
            </Button>
          ) : null}

          {resultado.entrada ? (
            <Button
              variant="outline"
              disabled={desfazer.isPending}
              onClick={() => {
                if (resultado.entrada)
                  desfazer.mutate(resultado.entrada.check_in_id, {
                    onSuccess: () => {
                      toast.info('Entrada desfeita.')
                      aoDesfazer()
                    },
                    onError: avisarErro,
                  })
              }}
            >
              Desfazer entrada
            </Button>
          ) : null}

          <Button variant="outline" onClick={aoFechar}>
            Fechar
          </Button>
        </div>
      ) : null}
    </DialogoDeFormulario>
  )
}
