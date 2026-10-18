import React, { createContext, useContext, useState } from 'react'
import type { AnimalCadastro } from '@/types/animal'
import { DADOS_EXEMPLO_ANIMAIS } from '@/data/animais'

interface PetContextType {
  animais: AnimalCadastro[]
  adicionarAnimal: (animal: Omit<AnimalCadastro, 'id' | 'createdAt'>) => AnimalCadastro
  cadastroEmAndamento: AnimalCadastro | null
  setCadastroEmAndamento: (animal: AnimalCadastro | null) => void
}

const PetContext = createContext<PetContextType | undefined>(undefined)

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [animais, setAnimais] = useState<AnimalCadastro[]>(DADOS_EXEMPLO_ANIMAIS)
  const [cadastroEmAndamento, setCadastroEmAndamento] = useState<AnimalCadastro | null>(null)

  const adicionarAnimal = (novo: Omit<AnimalCadastro, 'id' | 'createdAt'>) => {
    const animalCriado: AnimalCadastro = {
      ...novo,
      id: `sessao-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    }
    // O novo animal entra no topo da lista
    setAnimais((prev) => [animalCriado, ...prev])
    return animalCriado
  }

  return (
    <PetContext.Provider
      value={{
        animais,
        adicionarAnimal,
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
