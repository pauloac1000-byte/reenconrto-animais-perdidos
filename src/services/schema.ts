import type { AnimalCadastro } from '@/types/animal'

/**
 * Esquema da tabela 'animais' no Skip Cloud:
 *
 * Tabela: animais
 * Colunas:
 * - id: TEXT PRIMARY KEY (UUID / nanoid gerado)
 * - tipo: TEXT NOT NULL CHECK(tipo IN ('perdido', 'encontrado'))
 * - foto_url: TEXT NOT NULL (data URL base64 ou URL de storage)
 * - especie: TEXT NOT NULL ('Cão', 'Gato', 'Ave', 'Coelho', 'Outro')
 * - porte: TEXT NOT NULL ('Pequeno', 'Médio', 'Grande')
 * - cor: TEXT NOT NULL ('Preto', 'Branco', 'Caramelo', 'Marrom', 'Cinza', 'Mesclado', 'Outro')
 * - cidade: TEXT NOT NULL
 * - bairro: TEXT NOT NULL
 * - data: TEXT NOT NULL (YYYY-MM-DD)
 * - caracteristicas: TEXT
 * - descricao: TEXT
 * - telefone: TEXT
 * - whatsapp: TEXT
 * - created_at: TEXT NOT NULL (ISO-8601 timestamp)
 */

export interface AnimalRecord {
  id: string
  tipo: 'perdido' | 'encontrado'
  foto_url: string
  especie: string
  porte: string
  cor: string
  cidade: string
  bairro: string
  data: string
  caracteristicas?: string | null
  descricao?: string | null
  telefone?: string | null
  whatsapp?: string | null
  created_at: string
}

export function recordToAnimal(record: AnimalRecord): AnimalCadastro {
  return {
    id: record.id,
    tipo: record.tipo as AnimalCadastro['tipo'],
    fotoUrl: record.foto_url,
    especie: record.especie as AnimalCadastro['especie'],
    porte: record.porte as AnimalCadastro['porte'],
    cor: record.cor as AnimalCadastro['cor'],
    cidade: record.cidade,
    bairro: record.bairro,
    data: record.data,
    caracteristicas: record.caracteristicas || undefined,
    descricao: record.descricao || undefined,
    telefone: record.telefone || undefined,
    whatsapp: record.whatsapp || undefined,
    createdAt: record.created_at,
  }
}

export function animalToRecord(
  animal: Omit<AnimalCadastro, 'id' | 'createdAt'> & { id?: string },
): AnimalRecord {
  return {
    id:
      animal.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `pet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    tipo: animal.tipo,
    foto_url: animal.fotoUrl,
    especie: animal.especie,
    porte: animal.porte,
    cor: animal.cor,
    cidade: animal.cidade,
    bairro: animal.bairro,
    data: animal.data,
    caracteristicas: animal.caracteristicas || null,
    descricao: animal.descricao || null,
    telefone: animal.telefone || null,
    whatsapp: animal.whatsapp || null,
    created_at: new Date().toISOString(),
  }
}
