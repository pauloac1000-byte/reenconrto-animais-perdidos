import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  Sparkles,
  PawPrint,
  Heart,
  User,
  Loader2,
  AlertCircle,
  HelpCircle,
  Share2,
  Check,
  ShieldCheck,
  CheckCircle,
  Edit3,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { AnimalCadastro, AnimalCompativelItem } from '@/types/animal'
import {
  formatarTelefoneExibicao,
  gerarLinkWhatsApp,
  gerarLinkLigacao,
  isNumeroIncompleto,
} from '@/lib/phoneUtils'
import { usePets } from '@/context/PetContext'
import { useAdminAuth } from '@/context/AdminAuthContext'
import {
  buscarAnimalPorId,
  analisarCompatibilidadeAnimal,
  validarCodigoGestao,
  marcarReunidoComGestao,
  editarContatoComGestao,
} from '@/services/animalService'
import { AnimalCompativelCard } from '@/components/AnimalCompativelCard'
import { AnimalEditarModal } from '@/components/AnimalEditarModal'
import { AnimalEditarContatoModal } from '@/components/AnimalEditarContatoModal'

export default function AnimalDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { animais, marcarReunido, editarAnimal, removerAnimal, atualizarAnimalNaLista } = usePets()
  const { isAdmin } = useAdminAuth()

  const [animal, setAnimal] = useState<AnimalCadastro | null>(null)
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [imgError, setImgError] = useState<boolean>(false)
  const [copiado, setCopiado] = useState<boolean>(false)
  const [confirmandoReunido, setConfirmandoReunido] = useState<boolean>(false)
  const [salvandoReunido, setSalvandoReunido] = useState<boolean>(false)

  // Gestão sem conta via ?gestao=<codigo>
  const [codigoGestao, setCodigoGestao] = useState<string>('')
  const [gestaoValida, setGestaoValida] = useState<boolean>(false)
  const [dadosGestao, setDadosGestao] = useState<{
    telefone?: string
    whatsapp?: string
    emailAlertas?: string
  }>({})
  const [modalEditarContatoAberto, setModalEditarContatoAberto] = useState<boolean>(false)
  const [salvandoContatoGestao, setSalvandoContatoGestao] = useState<boolean>(false)
  const [confirmandoReunidoGestao, setConfirmandoReunidoGestao] = useState<boolean>(false)
  const [salvandoReunidoGestao, setSalvandoReunidoGestao] = useState<boolean>(false)

  // Funções administrativas: Edição e Exclusão
  const [modalEditarAberto, setModalEditarAberto] = useState<boolean>(false)
  const [confirmandoApagar, setConfirmandoApagar] = useState<boolean>(false)
  const [apagando, setApagando] = useState<boolean>(false)
  const [sucessoMensagem, setSucessoMensagem] = useState<string | null>(null)

  // Compatibilidade opcional calculada com IA (quando houver candidatos)
  const [carregandoCompat, setCarregandoCompat] = useState<boolean>(false)
  const [compatibilidades, setCompatibilidades] = useState<AnimalCompativelItem[]>([])

  // Carrega os dados do animal (usa cache de context se existir, senão busca no banco)
  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!id) {
        setErro('Identificador do animal não informado.')
        setCarregando(false)
        return
      }

      setCarregando(true)
      setErro(null)

      // 1. Tenta encontrar no contexto primeiro para resposta imediata
      const emMemoria = animais.find((a) => a.id === id)
      if (emMemoria) {
        if (ativo) {
          setAnimal(emMemoria)
          setCarregando(false)
        }
      }

      // 2. Sempre valida/busca a versão mais recente do banco
      try {
        const doBanco = await buscarAnimalPorId(id)
        if (!ativo) return

        if (!doBanco && !emMemoria) {
          setErro('Animal não encontrado ou o cadastro foi removido.')
          setAnimal(null)
        } else if (doBanco) {
          setAnimal(doBanco)
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes do animal:', err)
        if (!emMemoria && ativo) {
          setErro('Não foi possível carregar os dados deste animal. Tente novamente mais tarde.')
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [id, animais])

  // Validação do código de gestão via ?gestao=<codigo>
  useEffect(() => {
    let ativo = true
    const searchParams = new URLSearchParams(window.location.search)
    const cod = (searchParams.get('gestao') || '').trim()

    if (!cod || !id) {
      setGestaoValida(false)
      setCodigoGestao('')
      return
    }

    setCodigoGestao(cod)

    async function validar() {
      try {
        const res = await validarCodigoGestao(id!, cod)
        if (!ativo) return
        if (res && res.valido) {
          setGestaoValida(true)
          setDadosGestao({
            telefone: res.telefone,
            whatsapp: res.whatsapp,
            emailAlertas: res.emailAlertas,
          })
        } else {
          setGestaoValida(false)
        }
      } catch (e) {
        console.error('Erro na validação do link de gestão:', e)
        if (ativo) setGestaoValida(false)
      }
    }

    validar()

    return () => {
      ativo = false
    }
  }, [id])

  // Busca compatibilidade de forma transparente e não-bloqueante
  useEffect(() => {
    let ativo = true

    async function buscarCompat() {
      if (!animal?.id) {
        setCompatibilidades([])
        return
      }

      try {
        setCarregandoCompat(true)
        const resultado = await analisarCompatibilidadeAnimal(animal.id)
        if (!ativo) return
        if (resultado?.compatibilidades && Array.isArray(resultado.compatibilidades)) {
          setCompatibilidades(resultado.compatibilidades)
        } else {
          setCompatibilidades([])
        }
      } catch (e) {
        console.warn('Compatibilidade não disponível para este animal:', e)
        if (ativo) setCompatibilidades([])
      } finally {
        if (ativo) setCarregandoCompat(false)
      }
    }

    buscarCompat()

    return () => {
      ativo = false
    }
  }, [animal?.id])

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

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Fallback
    }
  }

  // Estado 1: Carregando
  if (carregando) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/animais')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2d8f6f] hover:text-[#237a5e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à lista de animais</span>
          </button>
        </div>

        <div className="bg-white rounded-[24px] border border-[#e5e0d8] p-12 text-center shadow-sm space-y-4">
          <Loader2 className="w-10 h-10 text-[#2d8f6f] animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#2b2b2b]">Carregando detalhes do animal…</h2>
            <p className="text-xs text-[#6b6b6b]">Buscando dados atualizados do cadastro</p>
          </div>
        </div>
      </div>
    )
  }

  // Estado 2: Animal inexistente ou erro
  if (erro || !animal) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
        <div className="bg-white rounded-[24px] border border-[#e5e0d8] p-8 sm:p-12 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#fdecea] border border-[#d9534f]/30 flex items-center justify-center text-[#d9534f]">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#2b2b2b]">{erro || 'Animal não encontrado'}</h1>
            <p className="text-sm text-[#6b6b6b] max-w-md mx-auto leading-relaxed">
              O cadastro que você está procurando pode ter sido removido, o link pode estar
              incorreto ou ainda não ter sido publicado no mural.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/animais"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2d8f6f] hover:bg-[#237a5e] text-white px-6 py-3 rounded-[10px] text-sm font-semibold shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à lista de animais</span>
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] border border-[#e5e0d8] text-sm font-semibold text-[#2b2b2b] hover:bg-[#faf7f2] transition-colors"
            >
              Ir para o início
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isPerdido = animal.tipo === 'perdido'
  const isReunido = animal.tipo === 'reunido'

  // Ações de gestão sem conta via ?gestao=<codigo>
  const handleMarcarComoReunidoGestao = async () => {
    if (!animal || !codigoGestao) return
    if (!confirmandoReunidoGestao) {
      setConfirmandoReunidoGestao(true)
      return
    }

    try {
      setSalvandoReunidoGestao(true)
      const res = await marcarReunidoComGestao(animal.id, codigoGestao)
      setAnimal((prev) =>
        prev
          ? {
              ...prev,
              tipo: 'reunido',
              dataReencontro: res.data_reencontro,
            }
          : null,
      )
      atualizarAnimalNaLista(animal.id, {
        tipo: 'reunido',
        dataReencontro: res.data_reencontro,
      })
      setConfirmandoReunidoGestao(false)
      setSucessoMensagem('Que notícia maravilhosa! Animal marcado como reunido com a família.')
      setTimeout(() => setSucessoMensagem(null), 5000)
    } catch (err) {
      console.error('Erro ao marcar reunido com gestão:', err)
      alert('Não foi possível marcar como reunido. Verifique sua conexão e tente novamente.')
    } finally {
      setSalvandoReunidoGestao(false)
    }
  }

  const handleSalvarContatoGestao = async (novosContatos: {
    telefone: string
    whatsapp: string
    emailAlertas: string
  }) => {
    if (!animal || !codigoGestao) return
    setSalvandoContatoGestao(true)
    try {
      const res = await editarContatoComGestao(animal.id, codigoGestao, novosContatos)
      setAnimal((prev) =>
        prev
          ? {
              ...prev,
              telefone: res.telefone,
              whatsapp: res.whatsapp,
            }
          : null,
      )
      atualizarAnimalNaLista(animal.id, {
        telefone: res.telefone,
        whatsapp: res.whatsapp,
      })
      setDadosGestao({
        telefone: res.telefone,
        whatsapp: res.whatsapp,
        emailAlertas: res.emailAlertas,
      })
      setSucessoMensagem('Dados de contato atualizados com sucesso!')
      setTimeout(() => setSucessoMensagem(null), 4000)
    } catch (err) {
      console.error('Erro ao atualizar contato com gestão:', err)
      throw new Error('Falha ao atualizar dados de contato. Tente novamente.')
    } finally {
      setSalvandoContatoGestao(false)
    }
  }

  const handleMarcarComoReunido = async () => {
    if (!animal) return
    if (!confirmandoReunido) {
      setConfirmandoReunido(true)
      setConfirmandoApagar(false)
      return
    }

    try {
      setSalvandoReunido(true)
      const atualizado = await marcarReunido(animal.id)
      setAnimal(atualizado)
      setConfirmandoReunido(false)
      setSucessoMensagem('Status atualizado para: Reunido com a família!')
      setTimeout(() => setSucessoMensagem(null), 4000)
    } catch (err) {
      console.error('Erro ao marcar animal como reunido:', err)
      alert('Não foi possível marcar como reunido. Tente novamente.')
    } finally {
      setSalvandoReunido(false)
    }
  }

  const handleApagarCadastro = async () => {
    if (!animal) return
    if (!confirmandoApagar) {
      setConfirmandoApagar(true)
      setConfirmandoReunido(false)
      return
    }

    try {
      setApagando(true)
      await removerAnimal(animal.id)
      setConfirmandoApagar(false)
      setSucessoMensagem('Cadastro removido com sucesso. Redirecionando para a lista de animais…')
      // Redireciona para a lista após confirmação
      setTimeout(() => {
        navigate('/animais', { replace: true })
      }, 1200)
    } catch (err) {
      console.error('Erro ao apagar cadastro do animal:', err)
      alert('Não foi possível apagar o cadastro. Tente novamente.')
      setApagando(false)
    }
  }

  const handleAnimalSalvo = (animalAtualizado: AnimalCadastro) => {
    setAnimal(animalAtualizado)
    setImgError(false)
    setSucessoMensagem('Cadastro atualizado com sucesso no banco!')
    setTimeout(() => setSucessoMensagem(null), 4000)
  }

  const localFormatado = animal.uf ? `${animal.cidade}, ${animal.uf}` : animal.cidade

  // Mensagem pré-formatada para WhatsApp
  const mensagemWhatsApp = encodeURIComponent(
    isPerdido
      ? `Olá! Vi o cadastro do pet ${animal.nomePet || animal.especie} (${animal.bairro}, ${localFormatado}) no site Reencontro e gostaria de informações!`
      : `Olá! Vi o animal cadastrado em busca do dono (${animal.especie}, ${animal.bairro}, ${localFormatado}) no site Reencontro e gostaria de falar com você!`,
  )

  const temContatos = Boolean(animal.whatsapp || animal.telefone)

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-fade-in">
      {/* Botão claro e evidente para voltar à lista + Compartilhar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/animais"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-white border border-[#e5e0d8] text-sm font-semibold text-[#2d8f6f] hover:text-[#237a5e] hover:border-[#2d8f6f] shadow-2xs hover:shadow-sm transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar à lista de animais</span>
        </Link>

        <button
          type="button"
          onClick={handleCopiarLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white border border-[#e5e0d8] text-xs font-semibold text-[#6b6b6b] hover:text-[#2b2b2b] hover:border-[#2d8f6f] shadow-2xs transition-all"
          title="Compartilhar link deste animal"
        >
          {copiado ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#28a745]" />
              <span className="text-[#28a745]">Link copiado!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartilhar</span>
            </>
          )}
        </button>
      </div>

      {/* Alerta de Feedback de Sucesso */}
      {sucessoMensagem && (
        <div className="bg-[#e8f5e9] border border-[#28a745]/40 rounded-[14px] p-3.5 flex items-center gap-2.5 text-[#28a745] animate-fade-in shadow-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{sucessoMensagem}</span>
        </div>
      )}

      {/* Requisito 2: Se acessado com link de gestão válido (?gestao=<codigo>),
          mostrar exatamente os dois botões especificados:
          "Marcar como reunido com a família" e "Editar contato" */}
      {gestaoValida && (
        <div className="bg-white border-2 border-[#2d8f6f]/40 rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e0d8]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2d8f6f] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#2b2b2b]">Gestão do seu anúncio</h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#2d8f6f] font-bold text-[10px] uppercase">
                    Acesso verificado
                  </span>
                </div>
                <p className="text-xs text-[#6b6b6b]">
                  Você está acessando pelo seu link exclusivo de gestão.
                </p>
              </div>
            </div>

            {isReunido && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                <CheckCircle className="w-3.5 h-3.5 text-amber-800" />
                <span>Status: Reunido com a família</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Botão 1: Marcar como reunido com a família */}
            {!isReunido ? (
              <>
                {!confirmandoReunidoGestao ? (
                  <button
                    type="button"
                    onClick={() => setConfirmandoReunidoGestao(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar como reunido com a família</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-[10px] p-1.5 px-3">
                    <span className="text-xs font-semibold text-amber-950">
                      Confirmar que o pet foi reunido com a família?
                    </span>
                    <button
                      type="button"
                      disabled={salvandoReunidoGestao}
                      onClick={handleMarcarComoReunidoGestao}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50"
                    >
                      {salvandoReunidoGestao ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Sim</span>
                    </button>
                    <button
                      type="button"
                      disabled={salvandoReunidoGestao}
                      onClick={() => setConfirmandoReunidoGestao(false)}
                      className="px-2.5 py-1 rounded-md bg-white border border-[#e5e0d8] text-amber-950 font-semibold text-xs hover:bg-[#faf7f2] transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs font-semibold text-[#28a745] inline-flex items-center gap-1.5 bg-[#e8f5e9] px-3 py-1.5 rounded-lg border border-[#28a745]/30">
                <Check className="w-3.5 h-3.5" />
                <span>Pet marcado como reunido com a família!</span>
              </span>
            )}

            {/* Botão 2: Editar contato */}
            <button
              type="button"
              onClick={() => setModalEditarContatoAberto(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar contato</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra Administrativa Completa (exclusiva para Admin logado) */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-300 rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-amber-950">Painel do Administrador</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-amber-800">
                  Ações de gestão exclusivas para este cadastro de animal.
                </p>
              </div>
            </div>

            {isReunido && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 text-amber-950 text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-amber-800" />
                <span>Status: Reunido com a família</span>
              </div>
            )}
          </div>

          {/* Botões de Ações do Administrador */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Botão 1: Editar Cadastro */}
              <button
                type="button"
                onClick={() => {
                  setConfirmandoApagar(false)
                  setConfirmandoReunido(false)
                  setModalEditarAberto(true)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white font-bold text-xs shadow-sm hover:shadow transition-all"
                title="Editar qualquer informação deste cadastro, incluindo a foto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar cadastro</span>
              </button>

              {/* Botão 2: Marcar como Reunido (se ainda não for) */}
              {!isReunido && (
                <>
                  {!confirmandoReunido ? (
                    <button
                      type="button"
                      onClick={handleMarcarComoReunido}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Marcar como reunido com a família</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-white border border-amber-300 rounded-[10px] p-1 px-2.5">
                      <span className="text-xs font-semibold text-amber-950">
                        Marcar como reunido?
                      </span>
                      <button
                        type="button"
                        disabled={salvandoReunido}
                        onClick={handleMarcarComoReunido}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50"
                      >
                        {salvandoReunido ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Sim</span>
                      </button>
                      <button
                        type="button"
                        disabled={salvandoReunido}
                        onClick={() => setConfirmandoReunido(false)}
                        className="px-2 py-1 rounded-md bg-[#faf7f2] border border-[#e5e0d8] text-amber-950 font-semibold text-xs hover:bg-[#f2ede4] transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Botão 3: Apagar Cadastro (com confirmação segura) */}
            <div>
              {!confirmandoApagar ? (
                <button
                  type="button"
                  onClick={handleApagarCadastro}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white border border-red-300 text-[#d9534f] hover:bg-red-50 hover:border-red-400 font-bold text-xs transition-all"
                  title="Apagar este cadastro do banco de dados permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Apagar cadastro</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-300 rounded-[10px] p-1.5 px-3">
                  <span className="text-xs font-bold text-red-900">
                    Tem certeza que deseja apagar?
                  </span>
                  <button
                    type="button"
                    disabled={apagando}
                    onClick={handleApagarCadastro}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#d9534f] hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {apagando ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    <span>Sim, apagar</span>
                  </button>
                  <button
                    type="button"
                    disabled={apagando}
                    onClick={() => setConfirmandoApagar(false)}
                    className="px-2 py-1 rounded-md bg-white border border-[#e5e0d8] text-[#2b2b2b] font-semibold text-xs hover:bg-[#faf7f2] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cartão Principal do Animal */}
      <article className="bg-white rounded-[24px] border border-[#e5e0d8] shadow-[0_6px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Foto Ampliada no Topo (destaque grande) */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[500px] bg-[#faf7f2] overflow-hidden border-b border-[#e5e0d8]">
          {!imgError && animal.fotoUrl ? (
            <img
              src={animal.fotoUrl}
              alt={`${animal.especie} - ${animal.tipo === 'reunido' ? 'Reunido com a família' : isPerdido ? 'Perdido' : 'Procura-se o dono'}`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#6b6b6b] p-8 bg-[#f2ede4]">
              <PawPrint className="w-16 h-16 text-[#2d8f6f]/40 mb-3" />
              <span className="text-sm font-semibold">Foto indisponível para este animal</span>
            </div>
          )}

          {/* Badges no topo sobre a foto */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            {/* Situação: perdido / procura-se o dono / reunido */}
            {animal.tipo === 'reunido' ? (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-600 shadow-lg">
                Reunido com a família
              </span>
            ) : isPerdido ? (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#fdecea] text-[#d9534f] border border-[#d9534f]/30 shadow-md">
                Animal Perdido
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#28a745] border border-[#28a745]/30 shadow-md">
                Procura-se o dono
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-white/95 backdrop-blur-md text-[#2b2b2b] shadow-md border border-[#e5e0d8]">
              {animal.especie}
            </span>
          </div>

          {/* Destaque do Nome do Pet e da Pessoa sobre a foto quando existirem */}
          {(animal.nomePet || animal.nomePessoa) && (
            <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/85 via-black/55 to-transparent flex flex-wrap items-center gap-2 pointer-events-none">
              {animal.nomePet && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-sm sm:text-base font-bold bg-[#f49b4f] text-white shadow-md">
                  <Heart className="w-4 h-4 shrink-0 fill-current" />
                  <span>{animal.nomePet}</span>
                </span>
              )}
              {animal.nomePessoa && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isPerdido ? 'Tutor(a)' : 'Quem acolheu'}: {animal.nomePessoa}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Informações detalhadas do cadastro */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Título com Nome do Pet / Espécie */}
          <div className="pb-4 border-b border-[#e5e0d8]/80 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2b2b2b]">
                {animal.nomePet || animal.especie}
              </h1>
              {animal.nomePet && (
                <span className="text-base sm:text-lg text-[#6b6b6b] font-medium">
                  • {animal.especie}
                </span>
              )}
            </div>
            <p className="text-sm text-[#6b6b6b] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#2d8f6f] shrink-0" />
              <span>
                {animal.bairro}, {animal.cidade}
                {animal.uf ? `, ${animal.uf}` : ''}
              </span>
            </p>
          </div>

          {/* Destaque do Nome do Pet e da Pessoa no corpo da página quando existirem */}
          {(animal.nomePet || animal.nomePessoa) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {animal.nomePet && (
                <div className="p-4 rounded-xl bg-[#fff3e0] border border-[#f49b4f]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f49b4f] text-white flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#d97706] block">
                      Nome do Pet
                    </span>
                    <span className="text-base font-bold text-[#2b2b2b]">{animal.nomePet}</span>
                  </div>
                </div>
              )}

              {animal.nomePessoa && (
                <div className="p-4 rounded-xl bg-[#e8f5e9] border border-[#2d8f6f]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2d8f6f] text-white flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d8f6f] block">
                      {isPerdido ? 'Nome do Tutor / Responsável' : 'Quem acolheu o pet'}
                    </span>
                    <span className="text-base font-bold text-[#2b2b2b]">{animal.nomePessoa}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grid de Dados Cadastrais: Espécie, Porte, Cor, Localização, Data */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-3">
              Dados do cadastro
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Espécie */}
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block">
                  Espécie
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#2b2b2b] mt-0.5 block">
                  {animal.especie}
                </span>
              </div>

              {/* Porte */}
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block">
                  Porte
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#2b2b2b] mt-0.5 block">
                  {animal.porte}
                </span>
              </div>

              {/* Cor */}
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block">
                  Cor
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#2b2b2b] mt-0.5 block">
                  {animal.cor}
                </span>
              </div>

              {/* Data */}
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#6b6b6b]" />
                  {isPerdido ? 'Visto em' : 'Data do resgate'}
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#2b2b2b] mt-0.5 block">
                  {formatarData(animal.data)}
                </span>
              </div>

              {/* Cidade e UF */}
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2d8f6f]" />
                  Cidade e UF
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#2b2b2b] mt-0.5 block">
                  {animal.cidade}
                  {animal.uf ? `, ${animal.uf}` : ''}
                </span>
              </div>

              {/* Bairro */}
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2d8f6f]" />
                  Bairro
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#2b2b2b] mt-0.5 block">
                  {animal.bairro}
                </span>
              </div>
            </div>
          </div>

          {/* Características marcantes */}
          {animal.caracteristicas && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf7f2] border border-[#e5e0d8] space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2b2b2b] block">
                Características marcantes
              </span>
              <p className="text-sm text-[#2b2b2b] leading-relaxed whitespace-pre-line">
                {animal.caracteristicas}
              </p>
            </div>
          )}

          {/* Descrição */}
          {animal.descricao && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e5e0d8] space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2b2b2b] block">
                Descrição detalhada
              </span>
              <p className="text-sm text-[#6b6b6b] leading-relaxed whitespace-pre-line">
                {animal.descricao}
              </p>
            </div>
          )}

          {/* Forma de Contato (destaque com botões de WhatsApp e telefone) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#faf7f2] border border-[#e5e0d8] space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2d8f6f] block">
                Formas de contato
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#2b2b2b] mt-0.5">
                {animal.tipo === 'reunido'
                  ? 'Histórico de contato deste pet já reunido:'
                  : isPerdido
                    ? 'Tem informações sobre este animal? Entre em contato:'
                    : 'Este animal é seu ou você conhece o tutor? Entre em contato:'}
              </h3>
            </div>

            {temContatos ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {animal.whatsapp &&
                  (() => {
                    const link = gerarLinkWhatsApp(animal.whatsapp, mensagemWhatsApp)
                    const formatado = formatarTelefoneExibicao(animal.whatsapp)
                    const incompleto = isNumeroIncompleto(animal.whatsapp)

                    return (
                      <div className="inline-flex flex-wrap items-center gap-2">
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-[#28a745] hover:bg-[#218838] text-white px-5 py-3 rounded-[12px] font-semibold text-sm shadow-sm hover:shadow transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Conversar no WhatsApp ({formatado})</span>
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-white border border-[#e5e0d8] text-[#2b2b2b] px-4 py-3 rounded-[12px] text-sm">
                            <MessageSquare className="w-4 h-4 text-[#28a745]" />
                            <span>WhatsApp: {formatado}</span>
                          </div>
                        )}
                        {isAdmin && incompleto && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            title="Aviso visível apenas para o administrador: o número cadastrado tem menos de 10 dígitos."
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                            <span>número incompleto</span>
                          </span>
                        )}
                      </div>
                    )
                  })()}

                {animal.telefone &&
                  (() => {
                    const link = gerarLinkLigacao(animal.telefone)
                    const formatado = formatarTelefoneExibicao(animal.telefone)
                    const incompleto = isNumeroIncompleto(animal.telefone)

                    return (
                      <div className="inline-flex flex-wrap items-center gap-2">
                        {link ? (
                          <a
                            href={link}
                            className="inline-flex items-center gap-2 bg-white hover:bg-[#e8f5e9] text-[#2d8f6f] border-2 border-[#2d8f6f] px-5 py-2.5 rounded-[12px] font-semibold text-sm shadow-2xs hover:shadow transition-all"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Ligar ({formatado})</span>
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-white border border-[#e5e0d8] text-[#2b2b2b] px-4 py-2.5 rounded-[12px] text-sm">
                            <Phone className="w-4 h-4 text-[#2d8f6f]" />
                            <span>Telefone: {formatado}</span>
                          </div>
                        )}
                        {isAdmin && incompleto && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            title="Aviso visível apenas para o administrador: o número cadastrado tem menos de 10 dígitos."
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                            <span>número incompleto</span>
                          </span>
                        )}
                      </div>
                    )
                  })()}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white border border-[#e5e0d8] text-xs text-[#6b6b6b] italic">
                Nenhum telefone ou WhatsApp foi cadastrado para este animal.
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Grau de Compatibilidade quando houver (omitido se não houver candidatos) */}
      {carregandoCompat && (
        <div className="bg-white rounded-[20px] border border-[#e5e0d8] p-6 text-center shadow-sm space-y-2">
          <Loader2 className="w-5 h-5 text-[#2d8f6f] animate-spin mx-auto" />
          <p className="text-xs text-[#6b6b6b]">Verificando compatibilidades com IA…</p>
        </div>
      )}

      {!carregandoCompat && compatibilidades.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="bg-white p-5 rounded-[20px] border border-[#e5e0d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2d8f6f]">
                <Sparkles className="w-4 h-4 text-[#2d8f6f]" />
                <span>Grau de Compatibilidade por IA</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#2b2b2b]">
                {isPerdido
                  ? 'Animais em busca do dono compatíveis com este pet'
                  : 'Animais perdidos compatíveis com o encontrado'}
              </h2>
              <p className="text-xs text-[#6b6b6b]">
                Cruzamento inteligente de foto, características e localização com os demais
                cadastros.
              </p>
            </div>

            <div className="shrink-0">
              <span className="px-3.5 py-1.5 rounded-full bg-[#e8f5e9] border border-[#28a745]/30 text-xs font-bold text-[#28a745]">
                {compatibilidades.length}{' '}
                {compatibilidades.length === 1 ? 'compatível' : 'compatíveis'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {compatibilidades.map((item) => (
              <AnimalCompativelCard key={item.animal.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Botão claro e evidente ao final da página para voltar à lista */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/animais"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2d8f6f] hover:bg-[#237a5e] text-white px-6 py-3 rounded-[12px] font-semibold text-sm shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar à lista de animais</span>
        </Link>

        <Link
          to="/cadastro"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[12px] bg-white border border-[#e5e0d8] text-[#2b2b2b] hover:bg-[#faf7f2] font-semibold text-sm transition-all"
        >
          <PawPrint className="w-4 h-4 text-[#2d8f6f]" />
          <span>Cadastrar outro animal</span>
        </Link>
      </div>

      {/* Modal de Edição Completa para Administrador */}
      {isAdmin && animal && (
        <AnimalEditarModal
          animal={animal}
          isOpen={modalEditarAberto}
          onClose={() => setModalEditarAberto(false)}
          onSalvo={handleAnimalSalvo}
          onSalvarDados={editarAnimal}
        />
      )}

      {/* Modal Restrito de Edição de Contato via Código de Gestão */}
      {gestaoValida && animal && (
        <AnimalEditarContatoModal
          isOpen={modalEditarContatoAberto}
          onClose={() => setModalEditarContatoAberto(false)}
          telefoneAtual={dadosGestao.telefone || animal.telefone}
          whatsappAtual={dadosGestao.whatsapp || animal.whatsapp}
          emailAlertasAtual={dadosGestao.emailAlertas}
          salvando={salvandoContatoGestao}
          onSalvar={handleSalvarContatoGestao}
        />
      )}
    </div>
  )
}
