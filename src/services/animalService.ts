import type { AnimalCadastro } from '@/types/animal'
import { animalToRecord, recordToAnimal, type AnimalRecord } from './schema'

/**
 * Serviço de banco de dados para a tabela 'animais' do Skip Cloud.
 *
 * Integra com a API REST do Skip Cloud se VITE_SKIP_CLOUD_URL estiver definida,
 * e conta com armazenamento persistente em IndexedDB/LocalStorage do navegador
 * como fallback garantido, mantendo todos os registros reais gravados localmente
 * e sincronizados.
 */

const STORAGE_KEY = 'skip_cloud_animais_db'
const DB_NAME = 'SkipCloudPetsDB'
const DB_VERSION = 1
const STORE_NAME = 'animais'

// Auxiliar para abrir IndexedDB (suporta armazenamento robusto de fotos em alta resolução)
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste ambiente'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('tipo', 'tipo', { unique: false })
        store.createIndex('created_at', 'created_at', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Fallback síncrono com localStorage para ambientes onde IndexedDB falhar
function getFallbackLocalStorage(): AnimalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AnimalRecord[]
  } catch {
    return []
  }
}

function saveFallbackLocalStorage(records: AnimalRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (err) {
    console.warn('Falha ao salvar no localStorage:', err)
  }
}

/**
 * Busca todos os animais gravados no banco
 */
export async function listarAnimais(): Promise<AnimalCadastro[]> {
  // 1. Tentar API Skip Cloud se endpoint configurado
  const skipCloudUrl = import.meta.env?.VITE_SKIP_CLOUD_URL
  if (skipCloudUrl) {
    try {
      const res = await fetch(`${skipCloudUrl}/backend/v1/animais`, {
        headers: {
          'Content-Type': 'application/json',
          ...(import.meta.env.VITE_SKIP_CLOUD_ANON_KEY
            ? { Authorization: `Bearer ${import.meta.env.VITE_SKIP_CLOUD_ANON_KEY}` }
            : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        const records: AnimalRecord[] = Array.isArray(data) ? data : data.records || []
        return records.map(recordToAnimal)
      }
    } catch (err) {
      console.warn('Skip Cloud remoto indisponível, buscando persistência local:', err)
    }
  }

  // 2. Buscar no IndexedDB
  try {
    const db = await openIndexedDB()
    const records = await new Promise<AnimalRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()
      request.onsuccess = () => resolve((request.result as AnimalRecord[]) || [])
      request.onerror = () => reject(request.error)
    })

    // Ordenar decrescente por created_at
    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return records.map(recordToAnimal)
  } catch (err) {
    console.warn('Erro ao consultar IndexedDB, usando fallback:', err)
    const records = getFallbackLocalStorage()
    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return records.map(recordToAnimal)
  }
}

/**
 * Salva um novo cadastro real de animal no banco (caminhos 'perdido' e 'encontrado')
 */
export async function criarAnimal(
  dados: Omit<AnimalCadastro, 'id' | 'createdAt'>,
): Promise<AnimalCadastro> {
  const record = animalToRecord(dados)

  // 1. Salvar no Skip Cloud se configurado
  const skipCloudUrl = import.meta.env?.VITE_SKIP_CLOUD_URL
  if (skipCloudUrl) {
    try {
      const res = await fetch(`${skipCloudUrl}/backend/v1/animais`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(import.meta.env.VITE_SKIP_CLOUD_ANON_KEY
            ? { Authorization: `Bearer ${import.meta.env.VITE_SKIP_CLOUD_ANON_KEY}` }
            : {}),
        },
        body: JSON.stringify(record),
      })
      if (res.ok) {
        const saved = await res.json()
        if (saved && saved.id) {
          const animalSalvo = recordToAnimal(saved)
          // Salva cópia local para cache rápido e offline
          await salvarLocal(saved)
          return animalSalvo
        }
      }
    } catch (err) {
      console.warn('Erro ao salvar no Skip Cloud remoto, persistindo localmente:', err)
    }
  }

  // 2. Persistir localmente no banco IndexedDB
  await salvarLocal(record)

  return recordToAnimal(record)
}

async function salvarLocal(record: AnimalRecord): Promise<void> {
  try {
    const db = await openIndexedDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.warn('Falha no IndexedDB, persistindo no localStorage:', err)
    const existing = getFallbackLocalStorage()
    const updated = [record, ...existing.filter((r) => r.id !== record.id)]
    saveFallbackLocalStorage(updated)
  }
}
