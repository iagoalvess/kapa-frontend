import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatarDataHora, jaChegou } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useDesfazerEntrada } from '../hooks/useConvitesDaFesta'
import type { ResultadoDaValidacao as Resultado } from '../lib/resultadoDaValidacao'
import { ResultadoDaValidacao } from './ResultadoDaValidacao'

interface Props {
  /** O que está no campo; fica na página para sobreviver à troca de evento. */
  codigo: string
  aoDigitar: (codigo: string) => void
  janelaAberta: boolean
  /** Quando a validação abre — 6 horas antes do evento. */
  janelaAbreEm: string
  /** O prefixo da turma no exemplo do campo (`MED27-XXXX`). */
  prefixoDoCodigo: string
  resultado: (Resultado & { codigo: string }) | null
  validando: boolean
  aoValidar: (codigo: string) => void
  aoMarcarSemRede: (codigo: string) => void
  /** A entrada foi desfeita: o resultado já não vale. */
  aoDesfazer: () => void
}

/**
 * O código ditado pelo convidado com o print apagado — o fallback da câmera — e o resultado, grande.
 *
 * O resultado é da página, e não daqui: validar pela lista cai no mesmo lugar, e trocar de evento o
 * apaga.
 */
export function ValidacaoNaPortaria({
  codigo,
  aoDigitar,
  janelaAberta,
  janelaAbreEm,
  prefixoDoCodigo,
  resultado,
  validando,
  aoValidar,
  aoMarcarSemRede,
  aoDesfazer,
}: Props) {
  const desfazer = useDesfazerEntrada()

  const enviarCodigo = (evento: FormEvent) => {
    evento.preventDefault()
    const limpo = codigo.trim().toUpperCase()
    if (limpo) aoValidar(limpo)
  }

  return (
    <Cartao titulo="Validar entrada" descricao="Digite o código que o convidado ditar.">
      {!janelaAberta ? (
        <p className="text-muted-foreground -mt-1 text-sm">
          {!jaChegou(janelaAbreEm)
            ? `A validação abre em ${formatarDataHora(janelaAbreEm)} — 6 horas antes do evento.`
            : 'A validação deste evento já fechou.'}
        </p>
      ) : null}

      <form onSubmit={enviarCodigo} className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
        <Input
          aria-label="Código do convite"
          value={codigo}
          onChange={(mudanca) => aoDigitar(mudanca.target.value)}
          placeholder={`${prefixoDoCodigo}-XXXX`}
          autoCapitalize="characters"
          autoComplete="off"
          className="h-12 font-mono text-lg uppercase"
        />
        <Button type="submit" size="lg" className="h-12" disabled={validando || !janelaAberta}>
          {validando ? 'Validando…' : 'Validar código'}
        </Button>
      </form>

      {resultado ? (
        <div className="mt-4 grid gap-2">
          <ResultadoDaValidacao resultado={resultado} />
          {resultado.semRede ? (
            <Button size="lg" variant="outline" onClick={() => aoMarcarSemRede(resultado.codigo)}>
              Marcar entrada sem rede
            </Button>
          ) : null}
          {resultado.entrada ? (
            <Button
              size="sm"
              variant="outline"
              className="justify-self-center"
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
        </div>
      ) : null}
    </Cartao>
  )
}
