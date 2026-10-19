/**
 * Utilitários para máscara, validação, formatação e geração de links
 * de telefone e WhatsApp no padrão brasileiro.
 */

/**
 * Remove qualquer caractere não numérico da string.
 */
export function apenasDigitos(valor: string | undefined | null): string {
  if (!valor) return ''
  return valor.replace(/\D/g, '')
}

/**
 * Aplica a máscara dinâmica brasileira (DD) 00000-0000 ou (DD) 0000-0000
 * conforme o usuário digita até o limite de 11 dígitos.
 *
 * Exemplos:
 * "1" -> "(1"
 * "19" -> "(19"
 * "199" -> "(19) 9"
 * "199999" -> "(19) 9999"
 * "1999998855" -> "(19) 9999-8855" (10 dígitos: fixo ou celular antigo)
 * "19999988554" -> "(19) 99998-8554" (11 dígitos: celular com 9º dígito)
 */
export function aplicarMascaraTelefone(valor: string): string {
  let digitos = apenasDigitos(valor)

  // Se o usuário digitou o DDI 55 no início e passou de 11 dígitos, remove o 55 inicial
  if (digitos.startsWith('55') && digitos.length > 11) {
    digitos = digitos.slice(2)
  }

  // Limita a 11 dígitos no máximo (2 de DDD + 9 de número)
  digitos = digitos.slice(0, 11)

  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${digitos}`
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`
}

/**
 * Verifica se um número de telefone informado possui no mínimo 10 dígitos (DDD obrigatório + número).
 * Números vazios não são considerados incompletos nesta função (a obrigatoriedade deve ser checada à parte).
 */
export function temMinimoDigitosValidos(valor: string | undefined | null): boolean {
  const digitos = apenasDigitos(valor)
  if (!digitos) return true // Vazio não falha aqui, tratado pela validação de campo
  return digitos.length >= 10 && digitos.length <= 11
}

/**
 * Verifica se o número existe porém é incompleto (menos de 10 dígitos).
 * Usado para cadastros legados ou validação.
 */
export function isNumeroIncompleto(valor: string | undefined | null): boolean {
  if (!valor) return false
  const digitos = apenasDigitos(valor)
  return digitos.length > 0 && digitos.length < 10
}

/**
 * Formata um número para exibição:
 * - Se tiver 10 ou 11 dígitos, aplica a máscara padrão (DD) 0000-0000 ou (DD) 00000-0000.
 * - Se vier com código 55 (12 ou 13 dígitos), remove o 55 e formata.
 * - Se for incompleto (< 10 dígitos) ou outro formato, preserva o valor como está.
 */
export function formatarTelefoneExibicao(valor: string | undefined | null): string {
  if (!valor) return ''
  let digitos = apenasDigitos(valor)

  // Trata números que já vieram salvos com 55 no banco (ex: 5519999899555 -> 13 dígitos ou 12 dígitos)
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2)
  }

  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  }

  // Sem máscara possível: retorna o texto original
  return valor
}

/**
 * Prepara o número para links telefônicos (tel: e wa.me):
 * Retorna no formato 55 + DDD + número (apenas dígitos).
 *
 * Se o número tiver menos de 10 dígitos (incompleto legado), não gera o link válido (retorna null).
 */
export function obterNumeroInternacional55(valor: string | undefined | null): string | null {
  if (!valor) return null
  let digitos = apenasDigitos(valor)

  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2)
  }

  // Bloqueia números com menos de 10 dígitos para links externos
  if (digitos.length < 10) {
    return null
  }

  return `55${digitos}`
}

/**
 * Gera a URL do WhatsApp no formato:
 * https://wa.me/55XXXXXXXXXXX ou https://wa.me/55XXXXXXXXXXX?text=...
 * Retorna null se o número for incompleto (< 10 dígitos).
 */
export function gerarLinkWhatsApp(
  valor: string | undefined | null,
  mensagemTexto?: string,
): string | null {
  const num55 = obterNumeroInternacional55(valor)
  if (!num55) return null

  if (mensagemTexto && mensagemTexto.trim().length > 0) {
    return `https://wa.me/${num55}?text=${mensagemTexto}`
  }
  return `https://wa.me/${num55}`
}

/**
 * Gera a URL de chamada telefônica (tel:) no formato 55 + DDD + número:
 * tel:+5519999988554 ou tel:5519999988554
 * Retorna null se o número for incompleto (< 10 dígitos).
 */
export function gerarLinkLigacao(valor: string | undefined | null): string | null {
  const num55 = obterNumeroInternacional55(valor)
  if (!num55) return null
  return `tel:${num55}`
}
