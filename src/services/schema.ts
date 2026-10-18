import type { AnimalCadastro } from '@/types/animal'
import pb from '@/lib/pocketbase/client'

/**
 * Esquema do registro na coleção 'animais' do PocketBase / Skip Cloud:
 *
 * Coleção: animais
 * - id: string
 * - tipo: 'perdido' | 'encontrado'
 * - foto: string (nome do arquivo salvo no storage do PocketBase)
 * - especie: 'Cão' | 'Gato' | 'Ave' | 'Coelho' | 'Outro'
 * - porte: 'Pequeno' | 'Médio' | 'Grande'
 * - cor: string
 * - caracteristicas: string
 * - cidade: string
 * - bairro: string
 * - data: string
 * - descricao: string
 * - telefone: string
 * - whatsapp: string
 * - created: string (ISO date)
 * - updated: string (ISO date)
 */

export interface AnimalRecord {
  id: string
  tipo: 'perdido' | 'encontrado' | 'reunido'
  foto?: string
  especie: string
  porte: string
  cor: string
  caracteristicas?: string
  cidade: string
  bairro: string
  data: string
  descricao?: string
  telefone?: string
  whatsapp?: string
  nome_pessoa?: string
  nome_pet?: string
  created: string
  updated: string
  collectionId: string
  collectionName: string
}

export function recordToAnimal(record: AnimalRecord): AnimalCadastro {
  let fotoUrl = ''
  if (record.foto) {
    fotoUrl = pb.files.getURL(record, record.foto)
  }

  return {
    id: record.id,
    tipo: record.tipo as AnimalCadastro['tipo'],
    fotoUrl,
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
    nomePessoa: record.nome_pessoa || undefined,
    nomePet: record.nome_pet || undefined,
    createdAt: record.created,
  }
}
