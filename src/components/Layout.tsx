import React, { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  PawPrint,
  Heart,
  PlusCircle,
  Menu,
  X,
  Instagram,
  Facebook,
  MessageCircle,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { useAdminAuth } from '@/context/AdminAuthContext'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { admin, isAdmin, logout } = useAdminAuth()

  // Fecha o menu mobile ao trocar de rota
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2] text-[#2b2b2b] font-sans">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e5e0d8] shadow-sm transition-all duration-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d8f6f] rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2d8f6f] flex items-center justify-center text-white shadow-sm group-hover:bg-[#237a5e] transition-colors">
              <PawPrint className="w-6 h-6 transform -rotate-12 transition-transform group-hover:rotate-0" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-xl tracking-tight text-[#2b2b2b] flex items-center gap-1">
                Reencontro
                <Heart className="w-3.5 h-3.5 fill-[#f49b4f] text-[#f49b4f] inline-block" />
              </span>
              <span className="text-[11px] font-medium text-[#6b6b6b] tracking-wider uppercase">
                Perdidos & Achados
              </span>
            </div>
          </Link>

          {/* Navegação Central - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/animais"
              className={({ isActive }) =>
                `text-[15px] font-semibold transition-colors px-3 py-2 rounded-lg ${
                  isActive
                    ? 'text-[#2d8f6f] bg-[#e8f5e9]'
                    : 'text-[#2b2b2b] hover:text-[#2d8f6f] hover:bg-[#faf7f2]'
                }`
              }
            >
              Ver animais cadastrados
            </NavLink>
          </nav>

          {/* Botão Primário e Indicador Admin - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-amber-50 border border-amber-300 text-xs shadow-2xs">
                <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin</span>
                </span>
                <span className="text-amber-400">•</span>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-amber-900 hover:bg-amber-100 hover:text-red-700 transition-colors"
                  title={`Conectado como ${admin?.email}. Clique para sair.`}
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sair</span>
                </button>
              </div>
            )}

            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 bg-[#2d8f6f] hover:bg-[#237a5e] text-white text-[15px] font-semibold px-5 py-2.5 rounded-[10px] shadow-sm hover:shadow transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar animal</span>
            </Link>
          </div>

          {/* Menu Hambúrguer - Mobile */}
          <div className="flex md:hidden items-center gap-2">
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-xs font-bold text-amber-800">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="p-2 rounded-lg text-[#2b2b2b] hover:bg-[#faf7f2] border border-[#e5e0d8] focus:outline-none focus:ring-2 focus:ring-[#2d8f6f]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu Colapsável Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#e5e0d8] bg-white px-4 py-4 space-y-3 animate-fade-in-down shadow-lg">
            {isAdmin && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Admin ({admin?.email})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="text-red-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            )}
            <Link
              to="/animais"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-semibold text-[#2b2b2b] hover:bg-[#faf7f2] hover:text-[#2d8f6f]"
            >
              Ver animais cadastrados
            </Link>
            <Link
              to="/cadastro"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-[#2d8f6f] text-white font-semibold py-3 px-4 rounded-[10px] shadow-sm active:scale-[0.98]"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Cadastrar animal</span>
            </Link>
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Botão flutuante mobile (FAB) para cadastrar rápido */}
      <div className="md:hidden fixed bottom-6 right-5 z-30">
        <Link
          to="/cadastro"
          className="flex items-center gap-2 bg-[#2d8f6f] hover:bg-[#237a5e] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-transform active:scale-95 font-semibold text-sm border-2 border-white"
          aria-label="Cadastrar novo animal"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Cadastrar</span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e5e0d8] py-8 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-2 font-bold text-lg text-[#2b2b2b]">
                <PawPrint className="w-5 h-5 text-[#2d8f6f]" />
                <span>Reencontro</span>
              </div>
              <p className="text-sm text-[#6b6b6b] mt-1">
                Reencontro — Conectando quem perdeu com quem encontrou.
              </p>
            </div>

            {/* Ícones sociais fictícios */}
            <div className="flex items-center gap-4 text-[#6b6b6b]">
              <a
                href="https://instagram.com/reencontroanimaisperdidos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram do Reencontro"
                className="w-9 h-9 rounded-full bg-[#faf7f2] border border-[#e5e0d8] flex items-center justify-center hover:text-[#2d8f6f] hover:border-[#2d8f6f] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#facebook"
                onClick={(e) => e.preventDefault()}
                aria-label="Facebook do Reencontro"
                className="w-9 h-9 rounded-full bg-[#faf7f2] border border-[#e5e0d8] flex items-center justify-center hover:text-[#2d8f6f] hover:border-[#2d8f6f] transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#whatsapp"
                onClick={(e) => e.preventDefault()}
                aria-label="WhatsApp de contato"
                className="w-9 h-9 rounded-full bg-[#faf7f2] border border-[#e5e0d8] flex items-center justify-center hover:text-[#2d8f6f] hover:border-[#2d8f6f] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#e5e0d8]/60 text-center text-xs text-[#6b6b6b]">
            <p>
              Banco de dados integrado ao Skip Cloud — cadastros salvos em tempo real com fotos e
              contatos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
