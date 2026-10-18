import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint, Filter, RotateCcw, PlusCircle, Frown, MapPin, Tag } from 'lucide-react'
import { usePets } from '@/context/PetContext'
import { AnimalCard } from '@/components/AnimalCard'
import type { EspecieAnimal } from '@/types/animal'

export default function Animais() {
  const { animais } = usePets()

  // Filtros:
  // 1. Tipo: "todos" | "perdido" | "encontrado"
  // 2. Espécie: "todas" | EspecieAnimal
  // 3. Cidade: "todas" | string
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroEspecie, setFiltroEspecie] = useState<string>('todas')
  const [filtroCidade, setFiltroCidade] = useState<string>('todas')

  // Lista única de cidades existentes nos animais para popular o dropdown
  const cidadesDisponiveis = useMemo(() => {
    const set = new Set<string>()
    animais.forEach((a) => {
      if (a.cidade) set.add(a.cidade)
    })
    return Array.from(set).sort()
  }, [animais])

  // Filtragem combinada em tempo real
  const animaisFiltrados = useMemo(() => {
    return animais.filter((animal) => {
      // Filtro Tipo
      if (filtroTipo !== 'todos' && animal.tipo !== filtroTipo) {
        return false
      }
      // Filtro Espécie
      if (filtroEspecie !== 'todas' && animal.especie !== filtroEspecie) {
        return false
      }
      // Filtro Cidade
      if (filtroCidade !== 'todas' && animal.cidade !== filtroCidade) {
        return false
      }
      return true
    })
  }, [animais, filtroTipo, filtroEspecie, filtroCidade])

  const totalPerdidos = useMemo(() => animais.filter((a) => a.tipo === 'perdido').length, [animais])
  const totalEncontrados = useMemo(
    () => animais.filter((a) => a.tipo === 'encontrado').length,
    [animais],
  )

  const limparFiltros = () => {
    setFiltroTipo('todos')
    setFiltroEspecie('todas')
    setFiltroCidade('todas')
  }

  const temFiltroAtivo =
    filtroTipo !== 'todos' || filtroEspecie !== 'todas' || filtroCidade !== 'todas'

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2d8f6f]">
            <PawPrint className="w-4 h-4" />
            <span>Mural Comunitário</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2b2b2b] mt-1">
            Animais cadastrados
          </h1>
          <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
            Acompanhe os animais perdidos e encontrados na sua região.
          </p>
        </div>

        {/* Resumo rápido de contagem */}
        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-full bg-[#fdecea] border border-[#d9534f]/30 text-xs font-semibold text-[#d9534f]">
            {totalPerdidos} Perdidos
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#e8f5e9] border border-[#28a745]/30 text-xs font-semibold text-[#28a745]">
            {totalEncontrados} Encontrados
          </div>
        </div>
      </div>

      {/* Barra de Filtros Combináveis */}
      <div className="bg-white rounded-[16px] border border-[#e5e0d8] p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e0d8]/70">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2b2b2b]">
            <Filter className="w-4 h-4 text-[#2d8f6f]" />
            <span>Filtrar resultados</span>
          </div>

          {temFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b6b6b] hover:text-[#d9534f] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {/* 3 Dropdowns combináveis */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Dropdown 1: Tipo */}
          <div className="space-y-1.5">
            <label
              htmlFor="filtro-tipo"
              className="text-xs font-semibold text-[#6b6b6b] flex items-center gap-1"
            >
              <Tag className="w-3.5 h-3.5 text-[#2d8f6f]" />
              Tipo de publicação
            </label>
            <select
              id="filtro-tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full h-11 px-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all"
            >
              <option value="todos">Todos os tipos</option>
              <option value="perdido">Apenas Perdidos</option>
              <option value="encontrado">Apenas Encontrados</option>
            </select>
          </div>

          {/* Dropdown 2: Espécie */}
          <div className="space-y-1.5">
            <label
              htmlFor="filtro-especie"
              className="text-xs font-semibold text-[#6b6b6b] flex items-center gap-1"
            >
              <PawPrint className="w-3.5 h-3.5 text-[#2d8f6f]" />
              Espécie
            </label>
            <select
              id="filtro-especie"
              value={filtroEspecie}
              onChange={(e) => setFiltroEspecie(e.target.value)}
              className="w-full h-11 px-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all"
            >
              <option value="todas">Todas as espécies</option>
              <option value="Cão">Cão</option>
              <option value="Gato">Gato</option>
              <option value="Ave">Ave</option>
              <option value="Coelho">Coelho</option>
              <option value="Outro">Outro animal</option>
            </select>
          </div>

          {/* Dropdown 3: Cidade */}
          <div className="space-y-1.5">
            <label
              htmlFor="filtro-cidade"
              className="text-xs font-semibold text-[#6b6b6b] flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2d8f6f]" />
              Cidade
            </label>
            <select
              id="filtro-cidade"
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
              className="w-full h-11 px-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all"
            >
              <option value="todas">Todas as cidades</option>
              {cidadesDisponiveis.map((cidade) => (
                <option key={cidade} value={cidade}>
                  {cidade}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Informação sobre resultados encontrados */}
        <div className="text-xs text-[#6b6b6b] pt-1">
          Exibindo <strong className="text-[#2b2b2b]">{animaisFiltrados.length}</strong>{' '}
          {animaisFiltrados.length === 1 ? 'animal' : 'animais'}
          {temFiltroAtivo ? ' de acordo com os filtros selecionados' : ' cadastrados'}
        </div>
      </div>

      {/* Grid Responsivo de Cards */}
      {animaisFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {animaisFiltrados.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      ) : (
        /* Estado Vazio Amigável com imagem / cachorro triste */
        <div className="bg-white rounded-[20px] border border-[#e5e0d8] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-5 animate-fade-in">
          <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-[#faf7f2] shadow-inner bg-[#faf7f2] flex items-center justify-center">
            <img
              src="https://img.usecurling.com/p/300/300?q=sad+dog"
              alt="Nenhum animal encontrado"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Se falhar o carregamento, troca por ícone
                e.currentTarget.style.display = 'none'
              }}
            />
            <Frown className="w-14 h-14 text-[#6b6b6b]/50 absolute" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#2b2b2b]">Nenhum animal encontrado</h3>
            <p className="text-sm text-[#6b6b6b] leading-relaxed">
              Nenhum animal corresponde aos filtros selecionados. Experimente ajustar os filtros ou
              cadastre um novo animal.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="w-full sm:w-auto px-4 py-2.5 rounded-[10px] border border-[#e5e0d8] text-xs font-semibold text-[#2b2b2b] hover:bg-[#faf7f2] transition-colors"
              >
                Limpar filtros
              </button>
            )}
            <Link
              to="/cadastro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2d8f6f] hover:bg-[#237a5e] text-white px-5 py-2.5 rounded-[10px] text-xs font-semibold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar animal</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
