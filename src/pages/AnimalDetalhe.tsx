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
} from 'lucide-react'
import type { AnimalCadastro, AnimalCompativelItem } from '@/types/animal'
import { usePets } from '@/context/PetContext'
import { buscarAnimalPorId, analisarCompatibilidadeAnimal } from '@/services/animalService'
import { AnimalCompativelCard } from '@/components/AnimalCompativelCard'

export default function AnimalDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { animais } = usePets()

  const [animal, setAnimal] = useState<AnimalCadastro | null>(null)
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [imgError, setImgError] = useState<boolean>(false)
  const [copiado, setCopiado] = useState<boolean>(false)

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

  // Mensagem pré-formatada para WhatsApp
  const mensagemWhatsApp = encodeURIComponent(
    isPerdido
      ? `Olá! Vi o cadastro do pet ${animal.nomePet || animal.especie} (${animal.bairro}, ${animal.cidade}) no site Reencontro e gostaria de informações!`
      : `Olá! Vi o animal encontrado (${animal.especie}, ${animal.bairro}, ${animal.cidade}) no site Reencontro e gostaria de falar com você!`,
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

      {/* Cartão Principal do Animal */}
      <article className="bg-white rounded-[24px] border border-[#e5e0d8] shadow-[0_6px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Foto Ampliada no Topo (destaque grande) */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[500px] bg-[#faf7f2] overflow-hidden border-b border-[#e5e0d8]">
          {!imgError && animal.fotoUrl ? (
            <img
              src={animal.fotoUrl}
              alt={`${animal.especie} - ${isPerdido ? 'Perdido' : 'Encontrado'}`}
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
            {/* Situação: perdido/encontrado */}
            {isPerdido ? (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#fdecea] text-[#d9534f] border border-[#d9534f]/30 shadow-md">
                Animal Perdido
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#28a745] border border-[#28a745]/30 shadow-md">
                Animal Encontrado
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
                    {isPerdido ? 'Tutor(a)' : 'Quem encontrou'}: {animal.nomePessoa}
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
                      {isPerdido ? 'Nome do Tutor / Responsável' : 'Quem encontrou o pet'}
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
                  {isPerdido ? 'Visto em' : 'Encontrado em'}
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#2b2b2b] mt-0.5 block">
                  {formatarData(animal.data)}
                </span>
              </div>

              {/* Cidade */}
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2d8f6f]" />
                  Cidade
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#2b2b2b] mt-0.5 block">
                  {animal.cidade}
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
                {isPerdido
                  ? 'Tem informações sobre este animal? Entre em contato:'
                  : 'Este animal é seu ou você conhece o tutor? Entre em contato:'}
              </h3>
            </div>

            {temContatos ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {animal.whatsapp && (
                  <a
                    href={`https://wa.me/55${animal.whatsapp.replace(/\D/g, '')}?text=${mensagemWhatsApp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-[#28a745] hover:bg-[#218838] text-white px-5 py-3 rounded-[12px] font-semibold text-sm shadow-sm hover:shadow transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Conversar no WhatsApp ({animal.whatsapp})</span>
                  </a>
                )}

                {animal.telefone && (
                  <a
                    href={`tel:${animal.telefone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-2 bg-white hover:bg-[#e8f5e9] text-[#2d8f6f] border-2 border-[#2d8f6f] px-5 py-2.5 rounded-[12px] font-semibold text-sm shadow-2xs hover:shadow transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Ligar ({animal.telefone})</span>
                  </a>
                )}
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
                  ? 'Animais achados compatíveis com este pet'
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
    </div>
  )
}
