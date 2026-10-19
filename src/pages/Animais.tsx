import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PawPrint,
  Filter,
  RotateCcw,
  PlusCircle,
  Frown,
  MapPin,
  Tag,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { usePets } from '@/context/PetContext'
import { AnimalCard } from '@/components/AnimalCard'
import { ESTADOS_BRASIL, buscarMunicipiosPorUf } from '@/services/ibgeService'

export default function Animais() {
  const { animais, isLoading, error, recarregarAnimais } = usePets()

  // Garante sincronização fresca com o banco sempre que a tela de lista for montada/acessada
  useEffect(() => {
    recarregarAnimais()
  }, [recarregarAnimais])

  // Filtros:
  // 1. Tipo: "todos" | "perdido" | "encontrado" | "reunido"
  // 2. Espécie: "todas" | EspecieAnimal
  // 3. UF: "todas" | string (ex.: "SP")
  // 4. Cidade: "todas" | string (filtrada dentro da UF selecionada pelo IBGE)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroEspecie, setFiltroEspecie] = useState<string>('todas')
  const [filtroUf, setFiltroUf] = useState<string>('todas')
  const [filtroCidade, setFiltroCidade] = useState<string>('todas')
  const [municipiosFiltro, setMunicipiosFiltro] = useState<string[]>([])
  const [carregandoMunicipios, setCarregandoMunicipios] = useState<boolean>(false)

  // Quando seleciona UF no filtro, carrega os municípios daquela UF pelo IBGE
  useEffect(() => {
    let ativo = true
    if (filtroUf === 'todas') {
      setMunicipiosFiltro([])
      setCarregandoMunicipios(false)
      return
    }

    setCarregandoMunicipios(true)
    buscarMunicipiosPorUf(filtroUf)
      .then((lista) => {
        if (!ativo) return
        setMunicipiosFiltro(lista)
      })
      .finally(() => {
        if (ativo) setCarregandoMunicipios(false)
      })

    return () => {
      ativo = false
    }
  }, [filtroUf])

  // Filtragem combinada em tempo real sobre os novos campos uf e cidade do banco
  const animaisFiltrados = useMemo(() => {
    const filtrados = animais.filter((animal) => {
      // Filtro Tipo
      if (filtroTipo !== 'todos' && animal.tipo !== filtroTipo) {
        return false
      }
      // Filtro Espécie
      if (filtroEspecie !== 'todas' && animal.especie !== filtroEspecie) {
        return false
      }
      // Filtro UF
      if (filtroUf !== 'todas') {
        const ufAnimal = (animal.uf || '').toUpperCase()
        if (ufAnimal !== filtroUf.toUpperCase()) {
          return false
        }
      }
      // Filtro Cidade
      if (filtroCidade !== 'todas') {
        const cidadeAnimal = (animal.cidade || '').trim().toLowerCase()
        if (cidadeAnimal !== filtroCidade.trim().toLowerCase()) {
          return false
        }
      }
      return true
    })

    // Se o filtro for "todos", prioriza os ativos primeiro e põe os reunidos no final
    if (filtroTipo === 'todos') {
      return [...filtrados].sort((a, b) => {
        if (a.tipo === 'reunido' && b.tipo !== 'reunido') return 1
        if (a.tipo !== 'reunido' && b.tipo === 'reunido') return -1
        return 0
      })
    }

    return filtrados
  }, [animais, filtroTipo, filtroEspecie, filtroUf, filtroCidade])

  const totalPerdidos = useMemo(() => animais.filter((a) => a.tipo === 'perdido').length, [animais])
  const totalEncontrados = useMemo(
    () => animais.filter((a) => a.tipo === 'encontrado').length,
    [animais],
  )
  const totalReunidos = useMemo(() => animais.filter((a) => a.tipo === 'reunido').length, [animais])

  const limparFiltros = () => {
    setFiltroTipo('todos')
    setFiltroEspecie('todas')
    setFiltroUf('todas')
    setFiltroCidade('todas')
  }

  const temFiltroAtivo =
    filtroTipo !== 'todos' ||
    filtroEspecie !== 'todas' ||
    filtroUf !== 'todas' ||
    filtroCidade !== 'todas'

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
            Acompanhe os animais perdidos, em busca do tutor ou reunidos com a família.
          </p>
        </div>

        {/* Resumo rápido de contagem */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-full bg-[#fdecea] border border-[#d9534f]/30 text-xs font-semibold text-[#d9534f]">
            {totalPerdidos} Perdidos
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#e8f5e9] border border-[#28a745]/30 text-xs font-semibold text-[#28a745]">
            {totalEncontrados} Procura-se o dono
          </div>
          {totalReunidos > 0 && (
            <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-800">
              {totalReunidos} Reunidos com a família
            </div>
          )}
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

        {/* Dropdowns combináveis com os novos campos UF e Cidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              <option value="encontrado">Procura-se o dono</option>
              <option value="reunido">Reunidos com a família</option>
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

          {/* Dropdown 3: UF */}
          <div className="space-y-1.5">
            <label
              htmlFor="filtro-uf"
              className="text-xs font-semibold text-[#6b6b6b] flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2d8f6f]" />
              UF (Estado)
            </label>
            <select
              id="filtro-uf"
              value={filtroUf}
              onChange={(e) => {
                const novaUf = e.target.value
                setFiltroUf(novaUf)
                setFiltroCidade('todas') // Limpa a cidade ao trocar de UF
              }}
              className="w-full h-11 px-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all"
            >
              <option value="todas">Todos os estados</option>
              {ESTADOS_BRASIL.map((est) => (
                <option key={est.sigla} value={est.sigla}>
                  {est.sigla} — {est.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 4: Cidade (filtrada pela UF do IBGE) */}
          <div className="space-y-1.5">
            <label
              htmlFor="filtro-cidade"
              className="text-xs font-semibold text-[#6b6b6b] flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2d8f6f]" />
              Cidade{' '}
              {carregandoMunicipios && (
                <span className="text-[10px] text-[#2d8f6f]">(carregando…)</span>
              )}
            </label>
            <select
              id="filtro-cidade"
              disabled={filtroUf === 'todas'}
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
              className="w-full h-11 px-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all disabled:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:text-[#9e9e9e]"
            >
              <option value="todas">
                {filtroUf === 'todas'
                  ? 'Selecione uma UF antes'
                  : carregandoMunicipios
                    ? 'Carregando cidades do IBGE…'
                    : 'Todas as cidades'}
              </option>
              {municipiosFiltro.map((cidade) => (
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

      {/* Estado de Carregamento Discreto */}
      {isLoading ? (
        <div className="bg-white rounded-[20px] border border-[#e5e0d8] p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <Loader2 className="w-8 h-8 text-[#2d8f6f] animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#2b2b2b]">Carregando cadastros do banco…</p>
            <p className="text-xs text-[#6b6b6b]">Buscando dados em tempo real</p>
          </div>
        </div>
      ) : error ? (
        /* Estado de Erro Discreto */
        <div className="bg-white rounded-[20px] border border-[#e03e3e]/30 p-8 text-center max-w-md mx-auto shadow-sm space-y-4">
          <AlertCircle className="w-8 h-8 text-[#e03e3e] mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#2b2b2b]">{error}</p>
            <p className="text-xs text-[#6b6b6b]">Verifique sua conexão e tente novamente.</p>
          </div>
          <button
            type="button"
            onClick={() => recarregarAnimais()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#2d8f6f] text-white text-xs font-semibold hover:bg-[#237a5e] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        </div>
      ) : animaisFiltrados.length > 0 ? (
        /* Grid Responsivo de Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {animaisFiltrados.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      ) : (
        /* Estado Vazio Amigável */
        <div className="bg-white rounded-[20px] border border-[#e5e0d8] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-5 animate-fade-in">
          <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-[#faf7f2] shadow-inner bg-[#faf7f2] flex items-center justify-center">
            <img
              src="https://img.usecurling.com/p/300/300?q=sad+dog"
              alt="Nenhum animal encontrado"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <Frown className="w-14 h-14 text-[#6b6b6b]/50 absolute" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#2b2b2b]">
              {animais.length === 0 ? 'Nenhum animal cadastrado ainda' : 'Nenhum animal encontrado'}
            </h3>
            <p className="text-sm text-[#6b6b6b] leading-relaxed">
              {animais.length === 0
                ? 'Seja o primeiro a cadastrar um animal perdido ou acolhido para ajudar na busca!'
                : 'Nenhum animal corresponde aos filtros selecionados. Experimente ajustar os filtros ou cadastre um novo animal.'}
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
