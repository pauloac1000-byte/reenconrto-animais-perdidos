import { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Sparkles,
  Loader2,
  MapPin,
  Calendar,
  PawPrint,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import type {
  AnimalCadastro,
  AnimalCompativelItem,
  AnaliseCompatibilidadeResultado,
} from '@/types/animal'
import { analisarCompatibilidadeAnimal, buscarAnimalPorId } from '@/services/animalService'
import { usePets } from '@/context/PetContext'

export default function PossiveisCorrespondencias() {
  const location = useLocation()
  const navigate = useNavigate()
  const { animais } = usePets()

  const stateData = location.state as
    | {
        animalPublicado?: AnimalCadastro
        animalId?: string
        resultadoCompatibilidade?: AnaliseCompatibilidadeResultado
      }
    | undefined

  const [animalPublicado, setAnimalPublicado] = useState<AnimalCadastro | null>(
    stateData?.animalPublicado || null,
  )
  const [carregandoAnimal, setCarregandoAnimal] = useState<boolean>(!stateData?.animalPublicado)
  const [carregandoAnalise, setCarregandoAnalise] = useState<boolean>(
    !stateData?.resultadoCompatibilidade,
  )
  const [resultado, setResultado] = useState<AnaliseCompatibilidadeResultado | null>(
    stateData?.resultadoCompatibilidade || null,
  )
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  // 1. Obter o animal de referência (do state ou buscando pelo ID vindo no state/query)
  const animalIdParam =
    stateData?.animalId ||
    stateData?.animalPublicado?.id ||
    new URLSearchParams(location.search).get('id')

  useEffect(() => {
    let ativo = true

    async function carregarAnimalEResultado() {
      if (!animalIdParam) {
        setErroCarregamento('Nenhum cadastro de animal informado para verificar correspondências.')
        setCarregandoAnimal(false)
        setCarregandoAnalise(false)
        return
      }

      let animalAtual = animalPublicado

      if (!animalAtual) {
        setCarregandoAnimal(true)
        try {
          // Tenta pegar do contexto primeiro
          const encontradoNoContexto = animais.find((a) => a.id === animalIdParam)
          if (encontradoNoContexto) {
            animalAtual = encontradoNoContexto
          } else {
            animalAtual = await buscarAnimalPorId(animalIdParam)
          }

          if (ativo) {
            setAnimalPublicado(animalAtual)
          }
        } catch (err) {
          console.error('Erro ao buscar animal:', err)
          if (ativo) {
            setErroCarregamento('Não foi possível carregar as informações do animal cadastrado.')
          }
        } finally {
          if (ativo) setCarregandoAnimal(false)
        }
      } else {
        setCarregandoAnimal(false)
      }

      if (!animalAtual) {
        if (ativo) {
          setErroCarregamento('Animal não encontrado para análise.')
          setCarregandoAnalise(false)
        }
        return
      }

      // Se já temos a análise enviada pelo state, não precisa chamar novamente
      if (stateData?.resultadoCompatibilidade) {
        if (ativo) {
          setResultado(stateData.resultadoCompatibilidade)
          setCarregandoAnalise(false)
        }
        return
      }

      // Dispara chamada da IA
      setCarregandoAnalise(true)
      try {
        const res = await analisarCompatibilidadeAnimal(animalAtual.id)
        if (ativo) {
          setResultado(res)
        }
      } catch (errAnalise) {
        console.error('Erro ao analisar compatibilidade:', errAnalise)
        if (ativo) {
          setResultado({
            analisado: false,
            totalCandidatos: 0,
            compatibilidades: [],
            erro: 'Não foi possível carregar a análise de compatibilidade no momento.',
          })
        }
      } finally {
        if (ativo) setCarregandoAnalise(false)
      }
    }

    carregarAnimalEResultado()

    return () => {
      ativo = false
    }
  }, [animalIdParam, stateData, animais, animalPublicado])

  // Filtragem rigorosa conforme especificação:
  // - Caminho oposto (perdido x procura-se o dono / encontrado)
  // - Mesma espécie
  // - Mesma UF (se preenchida)
  // - Excluir status reunido ("reunido")
  // - Ordenados pela porcentagem de compatibilidade da IA (decrescente)
  // - Até 5 animais
  const correspondenciasFiltradas = useMemo<AnimalCompativelItem[]>(() => {
    if (!resultado || !animalPublicado) return []

    const tipoOposto = animalPublicado.tipo === 'perdido' ? 'encontrado' : 'perdido'
    const especieRef = animalPublicado.especie
    const ufRef = animalPublicado.uf?.trim().toUpperCase()

    const lista = resultado.compatibilidades.filter((item) => {
      const cand = item.animal
      if (!cand) return false
      // Restrição: animais com status Reunido com a família não entram
      if (cand.tipo === 'reunido') return false
      // Caminho oposto
      if (cand.tipo !== tipoOposto) return false
      // Mesma espécie
      if (cand.especie !== especieRef) return false
      // Mesma UF (quando o animal de referência possui UF)
      if (ufRef && cand.uf) {
        if (cand.uf.trim().toUpperCase() !== ufRef) return false
      }
      return true
    })

    // Ordena decrescente por porcentagem de compatibilidade
    lista.sort((a, b) => b.porcentagem - a.porcentagem)

    // Até 5 animais
    return lista.slice(0, 5)
  }, [resultado, animalPublicado])

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

  const isPerdido = animalPublicado?.tipo === 'perdido'

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-fade-in space-y-8">
      {/* Banner de Confirmação de Cadastro */}
      <div className="bg-white rounded-[20px] border border-[#28a745]/30 p-6 sm:p-8 shadow-[0_4px_20px_rgba(40,167,69,0.08)] text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#e8f5e9] text-[#28a745] flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] text-[#28a745] text-xs font-bold uppercase tracking-wider">
          <span>Cadastro publicado com sucesso</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2b2b2b]">
          Possíveis correspondências
        </h1>
        <p className="text-sm text-[#6b6b6b] max-w-xl mx-auto leading-relaxed">
          {animalPublicado ? (
            <>
              Analisamos cruzamentos de animais{' '}
              <strong>{isPerdido ? 'encontrados (procura-se o dono)' : 'perdidos'}</strong> da mesma
              espécie ({animalPublicado.especie})
              {animalPublicado.uf ? ` no estado de ${animalPublicado.uf}` : ''} usando Inteligência
              Artificial.
            </>
          ) : (
            'Verificando possíveis animais parecidos cadastrados no sistema.'
          )}
        </p>
      </div>

      {/* Seção Principal de Possíveis Correspondências */}
      <div className="space-y-4">
        {/* Cabeçalho informativo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-[16px] border border-[#e5e0d8]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2d8f6f]">
              <Sparkles className="w-4 h-4 text-[#2d8f6f]" />
              <span>Análise de Compatibilidade por IA</span>
            </div>
            <h2 className="text-xl font-bold text-[#2b2b2b]">
              {isPerdido
                ? 'Animais em busca do dono com características parecidas'
                : 'Animais perdidos com características parecidas'}
            </h2>
            <p className="text-xs text-[#6b6b6b]">
              Cruzamento automático de foto, espécie, características e proximidade geográfica.
            </p>
          </div>

          {!carregandoAnalise && !carregandoAnimal && (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-[#faf7f2] border border-[#e5e0d8] text-xs font-bold text-[#2b2b2b]">
                {correspondenciasFiltradas.length}{' '}
                {correspondenciasFiltradas.length === 1 ? 'correspondência' : 'correspondências'}
              </span>
            </div>
          )}
        </div>

        {/* Estado de Carregamento */}
        {(carregandoAnimal || carregandoAnalise) && (
          <div className="bg-white rounded-[20px] border border-[#e5e0d8] p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
            <Loader2 className="w-8 h-8 text-[#2d8f6f] animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#2b2b2b]">
                Buscando possíveis correspondências com IA…
              </p>
              <p className="text-xs text-[#6b6b6b]">
                Comparando fotos, características e localização do seu cadastro
              </p>
            </div>
          </div>
        )}

        {/* Estado de Erro de Carga */}
        {erroCarregamento && !carregandoAnimal && (
          <div className="bg-white rounded-[16px] border border-[#f49b4f]/40 p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#f49b4f] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#2b2b2b]">Aviso</h3>
              <p className="text-xs text-[#6b6b6b] max-w-md mx-auto">{erroCarregamento}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/animais')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#2d8f6f] text-white text-xs font-semibold hover:bg-[#237a5e] transition-colors"
              >
                <span>Ver mural de animais</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Estado Vazio — Conforme Especificação estrita:
            "Sem nenhum resultado, mostre: 'Ainda não há um animal parecido. Vamos continuar procurando por você.'" */}
        {!carregandoAnimal &&
          !carregandoAnalise &&
          !erroCarregamento &&
          correspondenciasFiltradas.length === 0 && (
            <div className="bg-white rounded-[20px] border border-[#e5e0d8] p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#faf7f2] border border-[#e5e0d8] flex items-center justify-center text-[#2d8f6f]">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#2b2b2b]">
                  Ainda não há um animal parecido. Vamos continuar procurando por você.
                </h3>
                <p className="text-xs sm:text-sm text-[#6b6b6b] leading-relaxed max-w-md mx-auto">
                  Seu cadastro já foi gravado e está visível para a comunidade no mural público. Se
                  alguém cadastrar um animal com as mesmas características, ele poderá ser
                  localizado.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/animais"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <span>Ir para o mural de animais</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {animalPublicado && (
                  <Link
                    to={`/animal/${animalPublicado.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] border border-[#e5e0d8] text-[#2b2b2b] hover:bg-[#faf7f2] text-sm font-semibold transition-all"
                  >
                    <span>Ver meu cadastro publicado</span>
                  </Link>
                )}
              </div>
            </div>
          )}

        {/* Lista com até 5 animais correspondentes */}
        {!carregandoAnimal && !carregandoAnalise && correspondenciasFiltradas.length > 0 && (
          <div className="space-y-4">
            {correspondenciasFiltradas.map((item) => {
              const cand = item.animal
              const badgeStyle = getBadgeColor(item.porcentagem)
              const isCandPerdido = cand.tipo === 'perdido'

              return (
                <div
                  key={cand.id}
                  className="bg-white rounded-[16px] border border-[#e5e0d8] shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden flex flex-col md:flex-row"
                >
                  {/* 1. Foto com badges */}
                  <div className="relative w-full md:w-56 lg:w-64 aspect-[4/3] md:aspect-auto shrink-0 bg-[#faf7f2] overflow-hidden border-b md:border-b-0 md:border-r border-[#e5e0d8]">
                    {cand.fotoUrl ? (
                      <img
                        src={cand.fotoUrl}
                        alt={`${cand.especie} - ${cand.tipo}`}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center text-[#6b6b6b] p-4 bg-[#f2ede4]">
                        <PawPrint className="w-10 h-10 text-[#2d8f6f]/40 mb-1" />
                        <span className="text-xs font-medium">Foto indisponível</span>
                      </div>
                    )}

                    {/* Badge do Tipo */}
                    <div className="absolute top-3 left-3">
                      {isCandPerdido ? (
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
                        {cand.especie}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo com Especificações:
                        2. Cada item mostra foto, porcentagem com barra, bairro e cidade, data e o botão 'Ver detalhes' */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Header com Porcentagem e Classificação */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#e5e0d8]/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
                              Compatibilidade
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                            >
                              {badgeStyle.label}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-[#2b2b2b] mt-0.5">
                            {cand.nomePet ? `${cand.nomePet} • ` : ''}
                            {cand.especie} • Porte {cand.porte} • {cand.cor}
                          </h3>
                        </div>

                        {/* Porcentagem */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-2xl sm:text-3xl font-extrabold ${badgeStyle.text}`}
                          >
                            {item.porcentagem}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="w-full h-2.5 bg-[#f0ede6] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${badgeStyle.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(5, item.porcentagem)}%` }}
                        />
                      </div>

                      {/* Explicação da IA citando Foto, Características e Localização */}
                      {item.explicacao && (
                        <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8] space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d8f6f]">
                            <Sparkles className="w-3.5 h-3.5 text-[#2d8f6f]" />
                            <span>Análise da IA</span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#2b2b2b] leading-relaxed">
                            {item.explicacao}
                          </p>
                        </div>
                      )}

                      {/* Bairro e Cidade, Data */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6b6b6b] pt-1">
                        <span className="inline-flex items-center gap-1.5 font-medium text-[#2b2b2b]">
                          <MapPin className="w-3.5 h-3.5 text-[#2d8f6f] shrink-0" />
                          <span>
                            Bairro: <strong>{cand.bairro}</strong> • Cidade:{' '}
                            <strong>
                              {cand.cidade}
                              {cand.uf ? `, ${cand.uf}` : ''}
                            </strong>
                          </span>
                        </span>

                        <span className="hidden sm:inline text-[#e5e0d8]">•</span>

                        <span className="inline-flex items-center gap-1.5 text-[#6b6b6b]">
                          <Calendar className="w-3.5 h-3.5 text-[#6b6b6b] shrink-0" />
                          <span>
                            {isCandPerdido ? 'Perdido em:' : 'Registrado em:'}{' '}
                            <strong className="text-[#2b2b2b]">{formatarData(cand.data)}</strong>
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Rodapé do Item: Botão 'Ver detalhes' */}
                    <div className="pt-3 border-t border-[#e5e0d8] flex items-center justify-end">
                      <Link
                        to={`/animal/${cand.id}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all"
                      >
                        <span>Ver detalhes</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rodapé de Navegação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e5e0d8]">
          <Link
            to="/cadastro"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] border border-[#e5e0d8] text-[#2b2b2b] hover:bg-[#faf7f2] font-semibold text-xs sm:text-sm transition-all"
          >
            <PawPrint className="w-4 h-4 text-[#2d8f6f]" />
            <span>Cadastrar outro animal</span>
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {animalPublicado && (
              <Link
                to={`/animal/${animalPublicado.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] border border-[#2d8f6f] text-[#2d8f6f] hover:bg-[#2d8f6f] hover:text-white font-semibold text-xs sm:text-sm transition-all"
              >
                <span>Ver meu pet cadastrado</span>
              </Link>
            )}

            <Link
              to="/animais"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white font-semibold text-sm shadow-md transition-all"
            >
              <span>Ver todos os animais cadastrados</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
