import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  Mail,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAdminAuth } from '@/context/AdminAuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { admin, isAdmin, login, logout } = useAdminAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor, informe e-mail e senha.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/animais')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'E-mail ou senha incorretos.'
      setError(
        msg.includes('Failed to authenticate')
          ? 'Credenciais inválidas. Verifique o e-mail e a senha.'
          : msg,
      )
    } finally {
      setLoading(false)
    }
  }

  // Se já estiver logado como admin
  if (isAdmin && admin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 animate-fade-in">
        <div className="bg-white rounded-[24px] border border-[#e5e0d8] p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#e8f5e9] border border-[#2d8f6f]/30 flex items-center justify-center text-[#2d8f6f]">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] text-[#2d8f6f] text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sessão Ativa</span>
            </div>
            <h1 className="text-2xl font-bold text-[#2b2b2b]">Painel do Administrador</h1>
            <p className="text-sm text-[#6b6b6b]">
              Você está conectado como <strong className="text-[#2b2b2b]">{admin.email}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e5e0d8] text-xs text-[#6b6b6b] text-left space-y-1.5">
            <p className="font-semibold text-[#2b2b2b]">Privilégios de Administrador:</p>
            <p>
              • Botão de mudança de status com 1 clique nos cards de animais em{' '}
              <strong>/animais</strong> e na página de detalhes <strong>/animal/:id</strong>.
            </p>
            <p>• Permissão para marcar animais como "REUNIDO COM A FAMÍLIA".</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/animais"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2d8f6f] hover:bg-[#237a5e] text-white px-5 py-2.5 rounded-[10px] text-sm font-semibold shadow-sm transition-all"
            >
              <span>Gerenciar Animais</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] border border-[#e5e0d8] text-sm font-semibold text-[#d9534f] hover:bg-[#fdecea] hover:border-[#d9534f]/40 transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-fade-in">
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#2d8f6f] hover:text-[#237a5e] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para o início</span>
        </Link>
      </div>

      <div className="bg-white rounded-[24px] border border-[#e5e0d8] p-8 sm:p-10 shadow-[0_6px_24px_rgba(0,0,0,0.06)] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#e8f5e9] text-[#2d8f6f] flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#2b2b2b]">Acesso Administrativo</h1>
          <p className="text-xs sm:text-sm text-[#6b6b6b]">
            Área restrita para gestão e atualização de status dos animais.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#fdecea] border border-[#d9534f]/30 flex items-start gap-2 text-xs text-[#d9534f]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
            >
              E-mail do Administrador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@reencontro.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
            >
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#2d8f6f] hover:bg-[#237a5e] text-white font-semibold py-3 px-4 rounded-[12px] shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entrando…</span>
              </>
            ) : (
              <span>Entrar como Administrador</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
