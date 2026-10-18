/* 404 Page - Displays when a user attempts to access a non-existent route - translate to the language of the user */
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] p-4 text-[#2b2b2b]">
      <div className="text-center bg-white p-8 rounded-[20px] border border-[#e5e0d8] shadow-sm max-w-md w-full space-y-4">
        <div className="text-5xl font-bold text-[#2d8f6f]">404</div>
        <h1 className="text-2xl font-bold text-[#2b2b2b]">Página não encontrada</h1>
        <p className="text-sm text-[#6b6b6b]">
          A página que você está procurando não existe ou foi movida.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-[10px] bg-[#2d8f6f] text-white font-semibold text-sm hover:bg-[#237a5e] transition-colors"
        >
          Voltar para o início
        </a>
      </div>
    </div>
  )
}

export default NotFound
