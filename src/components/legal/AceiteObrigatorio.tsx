import { type ComponentProps, Fragment } from 'react'
import { Link } from 'react-router'
import { DOCUMENTOS, type TipoDeDocumento } from '@/config/legal'

interface Props extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'className'> {
  tipos: TipoDeDocumento[]
  checked: boolean
  onChange: (marcado: boolean) => void
}

/**
 * Checkbox de aceite de um ou mais documentos legais, com um link para cada.
 *
 * Um check só para todos: a prova do aceite é o que vai para a API — tipo e versão de cada
 * documento —, e não quantas caixas o usuário marcou.
 *
 * O link abre em **nova aba**, e não num modal: formulário perdido por ler os termos é cadastro
 * não enviado. Checkbox nativo, sem biblioteca — o `accent-brand` pinta a marca e o navegador
 * cuida de teclado e leitor de tela.
 *
 * Dentro de `<FormControl>` recebe `id` e `aria-*` do formulário e passa para o input.
 *
 * @param tipos Documentos cobertos por este aceite, na ordem em que aparecem no texto.
 * @param checked Se está marcado.
 * @param onChange Recebe o novo estado.
 */
export function AceiteObrigatorio({ tipos, checked, onChange, ...resto }: Props) {
  return (
    <label className="text-muted-foreground flex items-start gap-2.5 text-sm leading-snug">
      <input
        type="checkbox"
        checked={checked}
        onChange={(evento) => onChange(evento.target.checked)}
        className="accent-brand mt-0.5 size-4 shrink-0"
        {...resto}
      />
      <span>
        Li e aceito
        {tipos.map((tipo, i) => {
          const { rotulo, artigo, rota } = DOCUMENTOS[tipo]
          const separador = i === 0 ? ' ' : i === tipos.length - 1 ? ' e ' : ', '

          return (
            // Fragment, e não <span>: o nome acessível do checkbox apara as bordas de cada elemento
            // e engoliria os espaços entre os documentos ("aceitoos Termos").
            <Fragment key={tipo}>
              {separador}
              {artigo}{' '}
              <Link
                to={rota}
                target="_blank"
                rel="noopener"
                className="text-brand-hover hover:text-brand-border font-semibold underline underline-offset-2"
              >
                {rotulo}
              </Link>
            </Fragment>
          )
        })}
        .
      </span>
    </label>
  )
}
