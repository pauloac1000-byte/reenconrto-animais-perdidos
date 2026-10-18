import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'

interface AdminUser {
  id: string
  email: string
  name?: string
}

interface AdminAuthContextType {
  admin: AdminUser | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Verifica se o token salvo pertence à coleção admins
  const checkAuth = useCallback(() => {
    try {
      const model = pb.authStore.record as {
        id: string
        collectionName?: string
        email?: string
        name?: string
      } | null
      const isValid = pb.authStore.isValid
      // Verifica se o model é da coleção 'admins'
      if (isValid && model && model.collectionName === 'admins') {
        setAdmin({
          id: model.id,
          email: model.email || '',
          name: model.name || 'Administrador',
        })
      } else {
        setAdmin(null)
      }
    } catch {
      setAdmin(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    const unsubscribe = pb.authStore.onChange(() => {
      checkAuth()
    })
    return () => {
      unsubscribe()
    }
  }, [checkAuth])

  const login = async (email: string, pass: string) => {
    try {
      const authData = await pb.collection('admins').authWithPassword(email.trim(), pass)
      if (authData.record) {
        setAdmin({
          id: authData.record.id,
          email: authData.record.email || '',
          name: (authData.record as { name?: string }).name || 'Administrador',
        })
      }
    } catch (err) {
      console.error('Falha no login de administrador:', err)
      throw err
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAdmin: Boolean(admin),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth deve ser utilizado dentro de um AdminAuthProvider')
  }
  return context
}
