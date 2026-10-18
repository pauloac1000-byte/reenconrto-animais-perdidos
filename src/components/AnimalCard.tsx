import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AnimalCadastro } from '@/types/animal'
import {
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  PawPrint,
  Heart,
  User,
  ChevronRight,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { usePets } from '@/context/PetContext'

interface AnimalCardProps {
  animal: AnimalCadastro
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal }) => {
  const { isAdmin } = useAdminAuth()
  const { marcarReunido } = usePets()

  const [imgError, setImgError] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [salvandoStatus, setSalvandoStatus] = useState(false)

  const isPerdido = animal.tipo === 'perdido'
  const isReunido = animal.tipo === 'reunido'

  const handleMarcarReunido = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirmando) {
      setConfirmando(true)
      return
    }

    try {
      setSalvandoStatus(true)
      await marcarReunido(animal.id)
      setConfirmando(false)
    } catch (err) {
      console.error('Erro ao atualizar status para reunido:', err)
      alert('Não foi possível atualizar o status. Tente novamente.')
    } finally {
      setSalvandoStatus(false)
    }
  }

  const handleCancelarConfirmacao = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmando(false)
  }

  // Formata data brasileira (ex: 12/05/2025)
  const formatarData = (dataStr: string) => {
    try {
      const [ano, mes, dia] = dataStr.split('-')
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`
      }
      return dataStr
    } catch {
      return dataStr
    }
  }

  return (
    <article className="group bg-white rounded-[16px] border border-[#e5e0d8] shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Link de cobertura em todo o card para navegação para /animal/:id */}
      <Link
        to={`/animal/${animal.id}`}
        aria-label={`Ver detalhes de ${animal.nomePet || animal.especie}`}
        className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d8f6f] focus:ring-offset-2 rounded-[16px]"
      />

      {/* Imagem do animal com fallback */}
      <div className="relative w-full aspect-[4/3] bg-[#faf7f2] overflow-hidden border-b border-[#e5e0d8]">
        {!imgError && animal.fotoUrl ? (
          <img
            src={animal.fotoUrl}
            alt={`${animal.especie} - ${animal.tipo === 'reunido' ? 'Reunido com a família' : isPerdido ? 'Perdido' : 'Procura-se o dono'}`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#6b6b6b] p-4 bg-[#f2ede4]">
            <PawPrint className="w-12 h-12 text-[#2d8f6f]/40 mb-2" />
            <span className="text-xs font-medium text-center">Foto indisponível</span>
          </div>
        )}

        {/* Badge do Tipo (Perdido / Procura-se o dono / Reunido) */}
        <div className="absolute top-3 left-3">
          {animal.tipo === 'reunido' ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-600 shadow-md">
              Reunido com a família
            </span>
          ) : isPerdido ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fdecea] text-[#d9534f] border border-[#d9534f]/30 shadow-sm">
              Perdido
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#28a745] border border-[#28a745]/30 shadow-sm">
              Procura-se o dono
            </span>
          )}
        </div>

        {/* Badge de Espécie */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-[#2b2b2b] shadow-sm border border-[#e5e0d8]">
            {animal.especie}
          </span>
        </div>

        {/* Sobreposição na parte inferior da foto: Nome do pet e Nome da pessoa (quando existirem) */}
        {(animal.nomePet || animal.nomePessoa) && (
          <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/75 via-black/45 to-transparent flex flex-wrap items-center gap-1.5 pointer-events-none">
            {animal.nomePet && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f49b4f] text-white shadow-sm max-w-full truncate"
                title={`Nome do pet: ${animal.nomePet}`}
              >
                <Heart className="w-3 h-3 shrink-0 fill-current" />
                <span className="truncate">{animal.nomePet}</span>
              </span>
            )}
            {animal.nomePessoa && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/55 backdrop-blur-md text-white border border-white/20 shadow-sm max-w-full truncate"
                title={`${isPerdido ? 'Quem perdeu' : 'Quem acolheu'}: ${animal.nomePessoa}`}
              >
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">{animal.nomePessoa}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* Características principais */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6b6b6b]">
            <span className="font-semibold text-[#2b2b2b]">Porte:</span> {animal.porte}
            <span className="text-[#e5e0d8]">•</span>
            <span className="font-semibold text-[#2b2b2b]">Cor:</span> {animal.cor}
          </div>

          {/* Localização */}
          <div className="flex items-start gap-1.5 text-sm text-[#2b2b2b]">
            <MapPin className="w-4 h-4 text-[#2d8f6f] shrink-0 mt-0.5" />
            <span className="font-medium leading-tight">
              {animal.bairro}, {animal.cidade}
            </span>
          </div>

          {/* Data */}
          <div className="flex items-center gap-1.5 text-xs text-[#6b6b6b]">
            <Calendar className="w-3.5 h-3.5 text-[#6b6b6b]" />
            <span>
              {isPerdido ? 'Visto pela última vez:' : 'Data do resgate:'}{' '}
              <strong className="text-[#2b2b2b]">{formatarData(animal.data)}</strong>
            </span>
          </div>

          {/* Características marcantes ou descrição curta truncada */}
          {(animal.caracteristicas || animal.descricao) && (
            <p className="text-xs text-[#6b6b6b] line-clamp-2 leading-relaxed pt-1 border-t border-[#e5e0d8]/60">
              {animal.caracteristicas || animal.descricao}
            </p>
          )}
        </div>

        {/* Bloco de Contato em Destaque e Ver detalhes */}
        <div className="mt-4 pt-3 border-t border-[#e5e0d8] bg-[#faf7f2] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2d8f6f] group-hover:text-[#237a5e] transition-colors">
            <span>Ver detalhes</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>

          <div className="relative z-20 flex items-center gap-2">
            {animal.whatsapp && (
              <a
                href={`https://wa.me/55${animal.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#28a745] hover:text-[#237a5e] bg-white border border-[#28a745]/30 px-2.5 py-1 rounded-md shadow-2xs hover:bg-[#e8f5e9] transition-colors"
                title={`WhatsApp: ${animal.whatsapp}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{animal.whatsapp}</span>
              </a>
            )}
            {!animal.whatsapp && animal.telefone && (
              <a
                href={`tel:${animal.telefone.replace(/\D/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2d8f6f] hover:text-[#237a5e] bg-white border border-[#2d8f6f]/30 px-2.5 py-1 rounded-md shadow-2xs hover:bg-[#e8f5e9] transition-colors"
                title={`Ligar: ${animal.telefone}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{animal.telefone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Botão administrativo para marcar como reunido com a família (apenas para Admin logado) */}
        {isAdmin && !isReunido && (
          <div className="relative z-20 -mx-4 sm:-mx-5 border-t border-amber-200 bg-amber-50/90 px-3 py-2 flex items-center justify-between gap-2">
            {!confirmando ? (
              <button
                type="button"
                onClick={handleMarcarReunido}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-colors"
                title="Admin: Atualizar o status do animal para Reunido com a família"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Marcar como reunido com a família</span>
              </button>
            ) : (
              <div className="w-full flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-amber-900 truncate">
                  Confirmar status reunido?
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={salvandoStatus}
                    onClick={handleMarcarReunido}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {salvandoStatus ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    <span>Sim</span>
                  </button>
                  <button
                    type="button"
                    disabled={salvandoStatus}
                    onClick={handleCancelarConfirmacao}
                    className="px-2 py-1 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    Não
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
