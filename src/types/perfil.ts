/*
  As seções do cadastro como o **portal de privacidade** as recebe: anuláveis, e não opcionais —
  a API escreve o nulo (ver `backend/docs/contrato.md`).

  Moram em `types/` porque quem os lê é a feature `privacidade`, e uma feature não importa de outra.
*/

/** Endereço do formando, como o portal de privacidade o lê. */
export interface EnderecoDoTitular {
  /** Só os 8 dígitos. */
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
}

/** Contato de emergência, como o portal de privacidade o lê. */
export interface EmergenciaDoTitular {
  nome: string | null
  /** Em E.164: `+5541998765432`. */
  telefone: string | null
  parentesco: string | null
}
