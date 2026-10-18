export type TipoAnimal = 'perdido' | 'encontrado'

export type EspecieAnimal = 'Cão' | 'Gato' | 'Ave' | 'Coelho' | 'Outro'

export type PorteAnimal = 'Pequeno' | 'Médio' | 'Grande'

export type CorAnimal = 'Preto' | 'Branco' | 'Caramelo' | 'Marrom' | 'Cinza' | 'Mesclado' | 'Outro'

export interface AnimalCadastro {
  id: string
  tipo: TipoAnimal
  fotoUrl: string
  especie: EspecieAnimal
  porte: PorteAnimal
  cor: CorAnimal
  cidade: string
  bairro: string
  data: string // YYYY-MM-DD
  caracteristicas?: string
  descricao?: string
  telefone?: string
  whatsapp?: string
  createdAt?: string
}
