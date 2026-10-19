import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PawPrint,
  AlertTriangle,
} from 'lucide-react'
import { useAdminAuth } from '@/context/AdminAuthContext'
import {
  formatarTelefoneExibicao,
  gerarLinkWhatsApp,
  gerarLinkLigacao,
  isNumeroIncompleto,
} from '@/lib/phoneUtils'
import type { AnimalCompativelItem } from '@/types/animal'

interface AnimalCompativelCardProps {
  item: AnimalCompativelItem
}

export const AnimalCompativelCard: React.FC<AnimalCompativelCardProps> = ({ item }) => {
  const { animal, porcentagem, explicacao } = item
  const { isAdmin } = useAdminAuth()
  const [imgError, setImgError] = useState(false)
  const [expandido, setExpandido] = useState(false)

  const isPerdido = animal.tipo === 'perdido'

  // Determina cor de destaque da porcentagem
  const getBadgeColor = (pct: number) => {
    if (pct >= 80) {
      return {
        bg: 'bg-[#e8f5e9]',
        border: 'border-[#28a745]/30',
        text: 'text-[#28a745]',
        bar: 'bg-[#28a745]',
        label: 'Alta compatibilidade',
      }
    }
    if (pct >= 50) {
      return {
        bg: 'bg-[#fff3e0]',
        border: 'border-[#f49b4f]/40',
        text: 'text-[#d97706]',
        bar: 'bg-[#f49b4f]',
        label: 'Média compatibilidade',
      }
    }
    return {
      bg: 'bg-[#f5f5f5]',
      border: 'border-[#e5e0d8]',
      text: 'text-[#6b6b6b]',
      bar: 'bg-[#9ca3af]',
      label: 'Baixa compatibilidade',
    }
  }

  const badgeStyle = getBadgeColor(porcentagem)

  // Formatar data para padrão brasileiro
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
    <div className="bg-white rounded-[16px] border border-[#e5e0d8] shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden flex flex-col md:flex-row">
      {/* Imagem do animal com badges */}
      <div className="relative w-full md:w-56 lg:w-64 aspect-[4/3] md:aspect-auto shrink-0 bg-[#faf7f2] overflow-hidden border-b md:border-b-0 md:border-r border-[#e5e0d8]">
        {!imgError && animal.fotoUrl ? (
          <img
            src={animal.fotoUrl}
            alt={`${animal.especie} - ${animal.tipo}`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center text-[#6b6b6b] p-4 bg-[#f2ede4]">
            <PawPrint className="w-10 h-10 text-[#2d8f6f]/40 mb-1" />
            <span className="text-xs font-medium">Foto indisponível</span>
          </div>
        )}

        {/* Badge do Tipo (Perdido / Procura-se o dono / Reunido) */}
        <div className="absolute top-3 left-3">
          {animal.tipo === 'reunido' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-white border border-amber-600 shadow-2xs">
              Reunido com a família
            </span>
          ) : isPerdido ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fdecea] text-[#d9534f] border border-[#d9534f]/30 shadow-2xs">
              Perdido
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#28a745] border border-[#28a745]/30 shadow-2xs">
              Procura-se o dono
            </span>
          )}
        </div>

        {/* Badge de Espécie */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/95 text-[#2b2b2b] shadow-2xs border border-[#e5e0d8]">
            {animal.especie}
          </span>
        </div>
      </div>

      {/* Conteúdo da compatibilidade */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Header com Porcentagem e Barra de Progresso */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#e5e0d8]/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
                  Grau de Compatibilidade
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                >
                  {badgeStyle.label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#2b2b2b] mt-0.5">
                {animal.especie} • Porte {animal.porte} • {animal.cor}
              </h3>
            </div>

            {/* Destaque da porcentagem em % */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`text-2xl sm:text-3xl font-extrabold ${badgeStyle.text}`}>
                  {porcentagem}%
                </span>
              </div>
            </div>
          </div>

          {/* Barra visual de compatibilidade */}
          <div className="w-full h-2 bg-[#f0ede6] rounded-full overflow-hidden">
            <div
              className={`h-full ${badgeStyle.bar} rounded-full transition-all duration-500`}
              style={{ width: `${Math.max(5, porcentagem)}%` }}
            />
          </div>

          {/* Explicação da IA citando Foto, Características e Localização */}
          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d8f6f]">
              <Sparkles className="w-3.5 h-3.5 text-[#2d8f6f]" />
              <span>Análise da IA (Foto, Características e Localização)</span>
            </div>
            <p className="text-xs sm:text-sm text-[#2b2b2b] leading-relaxed">{explicacao}</p>
          </div>

          {/* Dados resumidos de localização e data */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6b6b6b]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#2d8f6f]" />
              <strong className="text-[#2b2b2b]">
                {animal.bairro}, {animal.cidade}
                {animal.uf ? `, ${animal.uf}` : ''}
              </strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#6b6b6b]" />
              <span>
                {isPerdido ? 'Perdido em:' : 'Acolhido em:'} {formatarData(animal.data)}
              </span>
            </span>
          </div>

          {/* Detalhes extras expansíveis */}
          {(animal.caracteristicas || animal.descricao) && (
            <div>
              <button
                type="button"
                onClick={() => setExpandido(!expandido)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2d8f6f] hover:text-[#237a5e] transition-colors"
              >
                <span>
                  {expandido ? 'Ocultar detalhes adicionais' : 'Ver detalhes do cadastro'}
                </span>
                {expandido ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {expandido && (
                <div className="mt-2 text-xs text-[#6b6b6b] space-y-1.5 p-3 rounded-lg bg-white border border-[#e5e0d8]">
                  {animal.caracteristicas && (
                    <p>
                      <strong className="text-[#2b2b2b]">Características:</strong>{' '}
                      {animal.caracteristicas}
                    </p>
                  )}
                  {animal.descricao && (
                    <p>
                      <strong className="text-[#2b2b2b]">Descrição:</strong> {animal.descricao}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé do Card com Contato e Link para o Mural */}
        <div className="pt-3 border-t border-[#e5e0d8] flex flex-wrap items-center justify-between gap-3">
          {/* Contatos */}
          <div className="flex flex-wrap items-center gap-2">
            {animal.whatsapp &&
              (() => {
                const textoMsg =
                  'Olá! Vi seu animal no Reencontro e houve compatibilidade com meu cadastro.'
                const link = gerarLinkWhatsApp(animal.whatsapp, encodeURIComponent(textoMsg))
                const formatado = formatarTelefoneExibicao(animal.whatsapp)
                const incompleto = isNumeroIncompleto(animal.whatsapp)

                return (
                  <div className="inline-flex items-center gap-1.5">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#28a745] hover:text-[#237a5e] bg-white border border-[#28a745]/30 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-[#e8f5e9] transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Conversar no WhatsApp ({formatado})</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b6b6b] bg-white border border-[#e5e0d8] px-3 py-1.5 rounded-lg">
                        <MessageSquare className="w-3.5 h-3.5 text-[#28a745]" />
                        <span>WhatsApp: {formatado}</span>
                      </span>
                    )}
                    {isAdmin && incompleto && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                        title="Aviso visível apenas para o administrador: o número cadastrado tem menos de 10 dígitos."
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        <span>número incompleto</span>
                      </span>
                    )}
                  </div>
                )
              })()}

            {!animal.whatsapp &&
              animal.telefone &&
              (() => {
                const link = gerarLinkLigacao(animal.telefone)
                const formatado = formatarTelefoneExibicao(animal.telefone)
                const incompleto = isNumeroIncompleto(animal.telefone)

                return (
                  <div className="inline-flex items-center gap-1.5">
                    {link ? (
                      <a
                        href={link}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2d8f6f] hover:text-[#237a5e] bg-white border border-[#2d8f6f]/30 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-[#e8f5e9] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ligar ({formatado})</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b6b6b] bg-white border border-[#e5e0d8] px-3 py-1.5 rounded-lg">
                        <Phone className="w-3.5 h-3.5 text-[#2d8f6f]" />
                        <span>Telefone: {formatado}</span>
                      </span>
                    )}
                    {isAdmin && incompleto && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                        title="Aviso visível apenas para o administrador: o número cadastrado tem menos de 10 dígitos."
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        <span>número incompleto</span>
                      </span>
                    )}
                  </div>
                )
              })()}

            {!animal.whatsapp && !animal.telefone && (
              <span className="text-xs text-[#6b6b6b] italic">
                Contato não informado no cadastro
              </span>
            )}
          </div>

          {/* Link para /animal/:id */}
          <Link
            to={`/animal/${animal.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2d8f6f] hover:text-[#237a5e] hover:underline transition-colors"
          >
            <span>Ver detalhes completos</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
