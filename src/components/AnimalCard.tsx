import React, { useState } from 'react'
import type { AnimalCadastro } from '@/types/animal'
import { MapPin, Calendar, Phone, MessageSquare, PawPrint, Heart, User } from 'lucide-react'

interface AnimalCardProps {
  animal: AnimalCadastro
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal }) => {
  const [imgError, setImgError] = useState(false)

  const isPerdido = animal.tipo === 'perdido'

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
    <article className="group bg-white rounded-[16px] border border-[#e5e0d8] shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Imagem do animal com fallback */}
      <div className="relative w-full aspect-[4/3] bg-[#faf7f2] overflow-hidden border-b border-[#e5e0d8]">
        {!imgError && animal.fotoUrl ? (
          <img
            src={animal.fotoUrl}
            alt={`${animal.especie} - ${isPerdido ? 'Perdido' : 'Encontrado'}`}
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

        {/* Badge do Tipo (Perdido / Encontrado) */}
        <div className="absolute top-3 left-3">
          {isPerdido ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fdecea] text-[#d9534f] border border-[#d9534f]/30 shadow-sm">
              Perdido
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#28a745] border border-[#28a745]/30 shadow-sm">
              Encontrado
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
                title={`${isPerdido ? 'Quem perdeu' : 'Quem encontrou'}: ${animal.nomePessoa}`}
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
              {isPerdido ? 'Visto pela última vez:' : 'Encontrado em:'}{' '}
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

        {/* Bloco de Contato em Destaque */}
        <div className="mt-4 pt-3 border-t border-[#e5e0d8] bg-[#faf7f2] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#6b6b6b]">
            Contato:
          </span>
          <div className="flex items-center gap-2">
            {animal.whatsapp && (
              <a
                href={`https://wa.me/55${animal.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2d8f6f] hover:text-[#237a5e] bg-white border border-[#2d8f6f]/30 px-2.5 py-1 rounded-md shadow-2xs hover:bg-[#e8f5e9] transition-colors"
                title={`Ligar: ${animal.telefone}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{animal.telefone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
