import { z } from 'zod'
import type { CanalDeNotificacao, DadosDaRegra, Regra, Regua } from '../types/notificacoes.types'

/*
  Validação de **forma**. Quem decide de verdade é a API, que recusa a variável desconhecida na
  gravação (`validacao.invalido`, 400) — mas ela é conferida aqui também porque é o erro que a
  pessoa comete enquanto digita, e apontá-lo só depois de "Salvar" é deixar um `{vencimeto}` passar
  despercebido até o dia do disparo.
*/

const MARCADORES = /\{([^{}]*)\}/g

/**
 * As variáveis citadas num texto que não existem — a mesma regra do `TemplateDeNotificacao` do backend.
 *
 * @param texto Assunto ou corpo, como a tesouraria escreveu.
 * @param variaveis As que a API aceita, sem as chaves.
 */
export function variaveisDesconhecidas(texto: string, variaveis: string[]) {
  return [...texto.matchAll(MARCADORES)]
    .map((achado) => achado[1] ?? '')
    .filter((nome) => !variaveis.includes(nome))
}

/** Troca as variáveis pelos valores de exemplo — o que a prévia mostra. */
export function renderizar(texto: string, valores: Record<string, string>) {
  return texto.replaceAll(MARCADORES, (_, nome: string) => valores[nome] ?? '')
}

/** Os valores de exemplo da prévia, os mesmos que o botão "Enviar teste" usa. */
export const EXEMPLO: Record<string, string> = {
  nome: 'Ana Souza',
  valor: 'R$ 350,00',
  vencimento: '10/09/2026',
  link: 'https://kapa.app/extrato',
  formatura: 'Medicina 2027',
  quantidade: '3',
}

/**
 * A forma de um degrau no editor.
 *
 * @param regua A régua vigente — dela saem as variáveis aceitas e os tetos de caracteres.
 */
export const esquemaDoDegrau = (regua: Regua) => {
  const texto = (maximo: number, vazio: string) =>
    z
      .string()
      .trim()
      .min(1, vazio)
      .max(maximo, `No máximo ${maximo.toLocaleString('pt-BR')} caracteres.`)
      .superRefine((valor, contexto) => {
        const erradas = variaveisDesconhecidas(valor, regua.variaveis)

        if (erradas.length > 0)
          contexto.addIssue({
            code: 'custom',
            message: `Variável desconhecida: ${erradas.map((nome) => `{${nome}}`).join(', ')}. As disponíveis são ${regua.variaveis.map((nome) => `{${nome}}`).join(', ')}.`,
          })
      })

  return z.object({
    assunto: texto(regua.tamanho_maximo_do_assunto, 'Escreva o assunto.'),
    template: texto(regua.tamanho_maximo, 'Escreva a mensagem.'),
    canal: z.string(),
    ativa: z.boolean(),
    avisar_tesouraria: z.boolean(),
  })
}

export type FormularioDoDegrau = z.infer<ReturnType<typeof esquemaDoDegrau>>

/** O degrau como o editor o recebe. */
export const paraFormularioDoDegrau = (regra: Regra): FormularioDoDegrau => ({
  assunto: regra.assunto,
  template: regra.template,
  canal: regra.canal,
  ativa: regra.ativa,
  avisar_tesouraria: regra.avisar_tesouraria,
})

/**
 * A régua inteira com um degrau reescrito — o corpo do `PUT`.
 *
 * A gravação é da régua toda (a API casa cada degrau pelo par gatilho + deslocamento), então o
 * editor manda os irmãos como estão e só troca o que mexeu.
 *
 * @param regua Régua vigente.
 * @param id Degrau editado.
 * @param valores O formulário já validado.
 */
export const paraDadosDaRegua = (regua: Regua, id: string, valores: FormularioDoDegrau): DadosDaRegra[] =>
  regua.regras.map(({ id: atual, ...regra }) =>
    atual === id ? { ...regra, ...valores, canal: valores.canal as CanalDeNotificacao } : regra,
  )
