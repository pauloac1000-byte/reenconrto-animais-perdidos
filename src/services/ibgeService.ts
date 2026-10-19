export interface EstadoIBGE {
  sigla: string
  nome: string
}

export interface MunicipioIBGE {
  id: number
  nome: string
}

export const ESTADOS_BRASIL: EstadoIBGE[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

// Cache em memória para evitar requisições repetidas ao trocar de telas/componentes
const cacheMunicipiosPorUf = new Map<string, string[]>()

/**
 * Busca a lista de municípios para a UF informada na API pública do IBGE.
 * Retorna os nomes dos municípios ordenados alfabeticamente.
 */
export async function buscarMunicipiosPorUf(uf: string): Promise<string[]> {
  const ufNormalizada = (uf || '').trim().toUpperCase()
  if (!ufNormalizada || ufNormalizada.length !== 2) {
    return []
  }

  if (cacheMunicipiosPorUf.has(ufNormalizada)) {
    return cacheMunicipiosPorUf.get(ufNormalizada)!
  }

  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufNormalizada}/municipios`,
    )
    if (!res.ok) {
      throw new Error(`Falha ao consultar IBGE (${res.status})`)
    }
    const dados = (await res.json()) as MunicipioIBGE[]
    const nomes = dados
      .map((m) => m.nome)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))

    cacheMunicipiosPorUf.set(ufNormalizada, nomes)
    return nomes
  } catch (err) {
    console.error(`Erro ao carregar municípios para ${ufNormalizada} do IBGE:`, err)
    return []
  }
}
