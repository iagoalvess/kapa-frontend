import { EXEMPLO, renderizar } from '../schemas/notificacoes.schema'

/**
 * Como a mensagem chega, com dados de exemplo no lugar das variáveis.
 *
 * Texto puro dentro de uma caixa, e não o HTML do e-mail: o corpo real é montado pelo backend (é
 * ele que escapa o que veio do usuário), e renderizar HTML aqui abriria a tela do template a um
 * `<script>` colado no campo.
 *
 * @param assunto O assunto como está sendo escrito.
 * @param template O corpo como está sendo escrito.
 */
export function PreviaDaMensagem({ assunto, template }: { assunto: string; template: string }) {
  const vazio = !assunto.trim() && !template.trim()

  return (
    <section aria-label="Prévia da mensagem" className="grid min-w-0 content-start gap-2">
      <p className="flex h-9 items-center text-sm font-medium">Como a pessoa vai receber</p>

      <div className="grid min-h-56 content-start gap-3 rounded-xl border px-5 py-4">
        {vazio ? (
          <p className="text-texto-muted text-sm">A prévia aparece aqui enquanto você escreve.</p>
        ) : (
          <>
            <p className="text-foreground font-medium break-words">{renderizar(assunto, EXEMPLO)}</p>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {renderizar(template, EXEMPLO)}
            </p>
            <p className="text-texto-muted text-xs">
              Dados de exemplo. No envio, cada pessoa recebe o nome, o valor e o vencimento dela.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
