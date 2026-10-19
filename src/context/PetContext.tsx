import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { AnimalCadastro } from '@/types/animal'
import {
  listarAnimais,
  criarAnimal,
  marcarAnimalComoReunido,
  atualizarAnimal as atualizarAnimalService,
  apagarAnimal as apagarAnimalService,
} from '@/services/animalService'

interface PetContextType {
  animais: AnimalCadastro[]
  isLoading: boolean
  error: string | null
  adicionarAnimal: (animal: Omit<AnimalCadastro, 'id' | 'createdAt'>) => Promise<AnimalCadastro>
  editarAnimal: (
    id: string,
    dados: Partial<Omit<AnimalCadastro, 'id' | 'createdAt'>>,
  ) => Promise<AnimalCadastro>
  removerAnimal: (id: string) => Promise<void>
  recarregarAnimais: () => Promise<void>
  marcarReunido: (id: string) => Promise<AnimalCadastro>
  atualizarAnimalNaLista: (id: string, parciais: Partial<AnimalCadastro>) => void
  cadastroEmAndamento: AnimalCadastro | null
  setCadastroEmAndamento: (animal: AnimalCadastro | null) => void
}

const PetContext = createContext<PetContextType | undefined>(undefined)

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [animais, setAnimais] = useState<AnimalCadastro[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [cadastroEmAndamento, setCadastroEmAndamento] = useState<AnimalCadastro | null>(null)

  const recarregarAnimais = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await listarAnimais()
      setAnimais(data)
    } catch (err) {
      console.error('Erro ao carregar animais do banco:', err)
      setError('Não foi possível carregar os animais cadastrados.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregarAnimais()
  }, [recarregarAnimais])

  const adicionarAnimal = async (
    novo: Omit<AnimalCadastro, 'id' | 'createdAt'>,
  ): Promise<AnimalCadastro> => {
    const animalCriado = await criarAnimal(novo)
    // O novo animal entra no topo da lista em tempo real
    setAnimais((prev) => [animalCriado, ...prev.filter((a) => a.id !== animalCriado.id)])
    return animalCriado
  }

  const marcarReunido = async (id: string): Promise<AnimalCadastro> => {
    const atualizado = await marcarAnimalComoReunido(id)
    setAnimais((prev) => prev.map((a) => (a.id === id ? { ...a, tipo: 'reunido' } : a)))
    return atualizado
  }

  const editarAnimal = async (
    id: string,
    dados: Partial<Omit<AnimalCadastro, 'id' | 'createdAt'>>,
  ): Promise<AnimalCadastro> => {
    const atualizado = await atualizarAnimalService(id, dados)
    setAnimais((prev) => prev.map((a) => (a.id === id ? atualizado : a)))
    return atualizado
  }

  const removerAnimal = async (id: string): Promise<void> => {
    await apagarAnimalService(id)
    setAnimais((prev) => prev.filter((a) => a.id !== id))
  }

  const atualizarAnimalNaLista = (id: string, parciais: Partial<AnimalCadastro>) => {
    setAnimais((prev) => prev.map((a) => (a.id === id ? { ...a, ...parciais } : a)))
  }

  return (
    <PetContext.Provider
      value={{
        animais,
        isLoading,
        error,
        adicionarAnimal,
        editarAnimal,
        removerAnimal,
        recarregarAnimais,
        marcarReunido,
        atualizarAnimalNaLista,
        cadastroEmAndamento,
        setCadastroEmAndamento,
      }}
    >
      {children}
    </PetContext.Provider>
  )
}

export const usePets = (): PetContextType => {
  const context = useContext(PetContext)
  if (!context) {
    throw new Error('usePets deve ser utilizado dentro de um PetProvider')
  }
  return context
}
