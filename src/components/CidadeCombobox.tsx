import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MapPin, Search, ChevronDown, Loader2, X } from 'lucide-react'
import { buscarMunicipiosPorUf } from '@/services/ibgeService'

interface CidadeComboboxProps {
  id?: string
  uf: string
  value: string
  onChange: (cidade: string) => void
  disabled?: boolean
  error?: boolean
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export const CidadeCombobox: React.FC<CidadeComboboxProps> = ({
  id,
  uf,
  value,
  onChange,
  disabled = false,
  error = false,
  placeholder = 'Digite ou selecione a cidade…',
  className = '',
  autoFocus = false,
}) => {
  const [municipios, setMunicipios] = useState<string[]>([])
  const [carregando, setCarregando] = useState<boolean>(false)
  const [aberto, setAberto] = useState<boolean>(false)
  const [busca, setBusca] = useState<string>(value || '')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sempre que a UF mudar, carrega a lista do IBGE
  useEffect(() => {
    let ativo = true
    if (!uf) {
      setMunicipios([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    buscarMunicipiosPorUf(uf)
      .then((lista) => {
        if (!ativo) return
        setMunicipios(lista)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [uf])

  // Sincroniza busca com o valor externo quando value mudar
  useEffect(() => {
    setBusca(value || '')
  }, [value])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false)
        // Se o usuário digitou mas não selecionou um município exato e tem valor selecionado antes,
        // restaura o valor confirmado para evitar inconsistência
        if (value && busca !== value) {
          setBusca(value)
        }
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => {
      document.removeEventListener('mousedown', handleClickFora)
    }
  }, [busca, value])

  // Filtra municípios com base no termo digitado (busca insensível a acentos e maiúsculas)
  const municipiosFiltrados = useMemo(() => {
    if (!busca.trim()) {
      return municipios.slice(0, 80) // Limite inicial de opções para performance suave
    }
    const buscaNorm = normalizarTexto(busca)
    return municipios.filter((m) => normalizarTexto(m).includes(buscaNorm)).slice(0, 80)
  }, [municipios, busca])

  const desabilitadoEfetivo = disabled || !uf

  const handleSelecionar = (cidadeSelecionada: string) => {
    setBusca(cidadeSelecionada)
    onChange(cidadeSelecionada)
    setAberto(false)
  }

  const handleLimpar = (e: React.MouseEvent) => {
    e.stopPropagation()
    setBusca('')
    onChange('')
    setAberto(true)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <MapPin className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

        <input
          id={id}
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          disabled={desabilitadoEfetivo}
          value={busca}
          placeholder={
            !uf
              ? 'Selecione a UF primeiro…'
              : carregando
                ? 'Carregando cidades do IBGE…'
                : placeholder
          }
          onFocus={() => {
            if (!desabilitadoEfetivo) {
              setAberto(true)
            }
          }}
          onChange={(e) => {
            const novoValor = e.target.value
            setBusca(novoValor)
            setAberto(true)
            // Se o usuário digitou exatamente o nome de uma cidade existente, atualiza
            const exato = municipios.find((m) => m.toLowerCase() === novoValor.trim().toLowerCase())
            if (exato) {
              onChange(exato)
            } else if (!novoValor) {
              onChange('')
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setAberto(false)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (municipiosFiltrados.length > 0) {
                handleSelecionar(municipiosFiltrados[0])
              }
            }
          }}
          className={`w-full h-11 pl-10 pr-14 bg-white rounded-xl border text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all disabled:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:text-[#9e9e9e] ${
            error ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
          }`}
          autoComplete="off"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {carregando && <Loader2 className="w-4 h-4 text-[#2d8f6f] animate-spin" />}

          {!carregando && busca && !desabilitadoEfetivo && (
            <button
              type="button"
              onClick={handleLimpar}
              aria-label="Limpar cidade"
              className="p-1 rounded-md text-[#6b6b6b] hover:text-[#2b2b2b] hover:bg-[#faf7f2] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={desabilitadoEfetivo}
            onClick={() => {
              if (!desabilitadoEfetivo) {
                setAberto((prev) => !prev)
                inputRef.current?.focus()
              }
            }}
            tabIndex={-1}
            aria-label="Abrir lista de cidades"
            className="p-1 text-[#6b6b6b] hover:text-[#2b2b2b] transition-colors disabled:opacity-40"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown com a lista de municípios */}
      {aberto && !desabilitadoEfetivo && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#e5e0d8] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto animate-fade-in divide-y divide-[#e5e0d8]/40">
          <div className="p-2 text-[11px] font-semibold text-[#6b6b6b] bg-[#faf7f2] flex items-center justify-between sticky top-0 border-b border-[#e5e0d8]/60 z-10">
            <span>
              {municipiosFiltrados.length}{' '}
              {municipiosFiltrados.length === 1 ? 'município' : 'municípios'}{' '}
              {busca ? 'encontrados' : `em ${uf}`}
            </span>
            <span className="text-[10px] text-[#2d8f6f] font-normal">IBGE</span>
          </div>

          {municipiosFiltrados.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#6b6b6b]">
              <Search className="w-4 h-4 mx-auto mb-1 text-[#6b6b6b]/60" />
              Nenhum município encontrado para &quot;{busca}&quot; em {uf}.
            </div>
          ) : (
            municipiosFiltrados.map((m) => {
              const selecionado = value === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelecionar(m)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                    selecionado
                      ? 'bg-[#e8f5e9] text-[#2d8f6f] font-semibold'
                      : 'text-[#2b2b2b] hover:bg-[#faf7f2]'
                  }`}
                >
                  <span>{m}</span>
                  {selecionado && (
                    <span className="text-[10px] font-bold text-[#2d8f6f] uppercase tracking-wider">
                      Selecionada
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
