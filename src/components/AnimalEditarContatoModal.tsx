import React, { useState, useEffect } from 'react'
import { X, Phone, MessageSquare, Mail, Save, Loader2, ShieldCheck, Check } from 'lucide-react'
import { aplicarMascaraTelefone, apenasDigitos } from '@/lib/phoneUtils'

interface AnimalEditarContatoModalProps {
  isOpen: boolean
  onClose: () => void
  telefoneAtual?: string
  whatsappAtual?: string
  emailAlertasAtual?: string
  salvando: boolean
  onSalvar: (dados: { telefone: string; whatsapp: string; emailAlertas: string }) => Promise<void>
}

export const AnimalEditarContatoModal: React.FC<AnimalEditarContatoModalProps> = ({
  isOpen,
  onClose,
  telefoneAtual = '',
  whatsappAtual = '',
  emailAlertasAtual = '',
  salvando,
  onSalvar,
}) => {
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [emailAlertas, setEmailAlertas] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [erroTelefone, setErroTelefone] = useState<string | null>(null)
  const [erroWhatsapp, setErroWhatsapp] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTelefone(telefoneAtual ? aplicarMascaraTelefone(telefoneAtual) : '')
      setWhatsapp(whatsappAtual ? aplicarMascaraTelefone(whatsappAtual) : '')
      setEmailAlertas(emailAlertasAtual || '')
      setErro(null)
      setErroTelefone(null)
      setErroWhatsapp(null)
    }
  }, [isOpen, telefoneAtual, whatsappAtual, emailAlertasAtual])

  if (!isOpen) return null

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setErroTelefone(null)
    setErroWhatsapp(null)

    const digitosTel = apenasDigitos(telefone)
    const digitosWhats = apenasDigitos(whatsapp)

    if (!digitosTel && !digitosWhats) {
      setErro('Preencha ao menos uma forma de contato telefônico (Telefone ou WhatsApp).')
      return
    }

    if (digitosTel && digitosTel.length < 10) {
      setErroTelefone('Número incompleto. Inclua o DDD. Exemplo: (11) 98765-4321')
      return
    }

    if (digitosWhats && digitosWhats.length < 10) {
      setErroWhatsapp('Número incompleto. Inclua o DDD. Exemplo: (11) 98765-4321')
      return
    }

    try {
      await onSalvar({
        telefone: telefone.trim(),
        whatsapp: whatsapp.trim(),
        emailAlertas: emailAlertas.trim(),
      })
      onClose()
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Erro ao atualizar dados de contato.'
      setErro(msg)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-editar-contato-titulo"
    >
      <div className="relative w-full max-w-lg bg-white rounded-[24px] border border-[#e5e0d8] shadow-2xl overflow-hidden my-6">
        {/* Cabeçalho */}
        <div className="bg-[#faf7f2] px-6 py-5 border-b border-[#e5e0d8] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2d8f6f] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d8f6f] block">
                Gestão do anúncio
              </span>
              <h2
                id="modal-editar-contato-titulo"
                className="text-lg sm:text-xl font-bold text-[#2b2b2b]"
              >
                Editar contato
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar"
            className="p-2 rounded-xl text-[#6b6b6b] hover:text-[#2b2b2b] hover:bg-white border border-transparent hover:border-[#e5e0d8] transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="p-6 sm:p-8 space-y-5" noValidate>
          <p className="text-xs text-[#6b6b6b] leading-relaxed">
            Atualize seus dados de contato para que outras pessoas e quem encontrar o animal
            consigam falar com você com facilidade.
          </p>

          {erro && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {erro}
            </div>
          )}

          {/* Telefone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2b2b2b]">
              Telefone para ligações
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(aplicarMascaraTelefone(e.target.value))}
                placeholder="(11) 98765-4321"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:ring-2 focus:ring-[#2d8f6f] focus:border-transparent transition-all"
              />
            </div>
            {erroTelefone && <p className="text-xs text-red-600 font-medium">{erroTelefone}</p>}
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2b2b2b]">
              WhatsApp
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-[#28a745] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(aplicarMascaraTelefone(e.target.value))}
                placeholder="(11) 98765-4321"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:border-transparent transition-all"
              />
            </div>
            {erroWhatsapp && <p className="text-xs text-red-600 font-medium">{erroWhatsapp}</p>}
          </div>

          {/* E-mail de alertas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2b2b2b]">
              E-mail de alertas (privado)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#2d8f6f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={emailAlertas}
                onChange={(e) => setEmailAlertas(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:ring-2 focus:ring-[#2d8f6f] focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[11px] text-[#6b6b6b]">
              Seu e-mail nunca é exibido publicamente. Usado apenas para avisar quando houver pets
              compatíveis.
            </p>
          </div>

          {/* Rodapé do Modal */}
          <div className="pt-4 border-t border-[#e5e0d8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2.5 rounded-xl border border-[#e5e0d8] text-xs font-bold text-[#6b6b6b] hover:bg-[#faf7f2] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2d8f6f] hover:bg-[#237a5e] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar contato</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
