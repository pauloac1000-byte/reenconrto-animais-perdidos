export type TipoAnimal = 'perdido' | 'encontrado' | 'reunido'

export type EspecieAnimal = 'Cão' | 'Gato' | 'Ave' | 'Coelho' | 'Outro'

export type PorteAnimal = 'Pequeno' | 'Médio' | 'Grande'

export type CorAnimal = 'Preto' | 'Branco' | 'Caramelo' | 'Marrom' | 'Cinza' | 'Mesclado' | 'Outro'

export interface AnimalCadastro {
  id: string
  tipo: TipoAnimal
  fotoUrl: string
  fotoArquivo?: File | null
  especie: EspecieAnimal
  porte: PorteAnimal
  cor: CorAnimal
  uf?: string
  cidade: string
  bairro: string
  data: string // YYYY-MM-DD
  caracteristicas?: string
  descricao?: string
  telefone?: string
  whatsapp?: string
  nomePessoa?: string
  nomePet?: string
  emailAlertas?: string
  codigoSecreto?: string
  dataReencontro?: string
  detalheConfirmacao?: string
  createdAt?: string
}

export interface ValidacaoCodigoGestao {
  valido: boolean
  telefone?: string
  whatsapp?: string
  emailAlertas?: string
  tipo?: TipoAnimal
  dataReencontro?: string
  detalheConfirmacao?: string
}

export interface AnimalCompativelItem {
  animal: AnimalCadastro
  porcentagem: number
  explicacao: string
}

export interface AnaliseCompatibilidadeResultado {
  analisado: boolean
  totalCandidatos: number
  compatibilidades: AnimalCompativelItem[]
  erro?: string
  aviso?: string
}
