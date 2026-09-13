/** Endereço que o ViaCEP devolve, já nos nomes do formulário. */
export interface EnderecoDoCep {
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

interface RespostaDoViaCep {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean | string
}

/**
 * Consulta o endereço de um CEP no ViaCEP.
 *
 * `fetch` direto, e não `api`: é serviço de terceiro, sem token nem cookie — mandar a sessão para
 * outra origem seria vazamento. Mora em `lib/http` para continuar valendo "nenhum fetch fora daqui".
 *
 * ponytail: sem lib e sem repetição. Falhou (rede, CEP inexistente), devolve `null` e o usuário
 * digita — o formulário continua editável de qualquer jeito.
 *
 * @param cep CEP com ou sem máscara.
 * @param signal Cancelamento do chamador.
 * @returns O endereço, ou `null` se não deu para descobrir.
 */
export async function consultarCep(cep: string, signal?: AbortSignal): Promise<EnderecoDoCep | null> {
  const digitos = cep.replace(/\D/g, '')
  if (digitos.length !== 8) return null

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),
    })
    if (!resposta.ok) return null

    const dados = (await resposta.json()) as RespostaDoViaCep
    if (dados.erro) return null

    return {
      logradouro: dados.logradouro ?? '',
      bairro: dados.bairro ?? '',
      cidade: dados.localidade ?? '',
      uf: dados.uf ?? '',
    }
  } catch {
    return null
  }
}
