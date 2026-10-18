import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Edit3, Send, MapPin, Calendar, Phone, MessageSquare, Sparkles } from 'lucide-react'
import type { AnimalCadastro } from '@/types/animal'
import { usePets } from '@/context/PetContext'
import { useToast } from '@/hooks/use-toast'

export default function Resumo() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { adicionarAnimal, setCadastroEmAndamento } = usePets()

  // Dados recebidos via estado de navegação (location.state.animal)
  const animal = (location.state as { animal?: AnimalCadastro })?.animal

  useEffect(() => {
    // Se acessado sem dados (ex: refresh direto em /resumo sem estado), redirecionar para /cadastro
    if (!animal) {
      toast({
        title: 'Nenhum cadastro em andamento.',
        description: 'Preencha o formulário para visualizar o resumo.',
        variant: 'destructive',
      })
      navigate('/cadastro', { replace: true })
    }
  }, [animal, navigate, toast])

  if (!animal) {
    return null
  }

  const isPerdido = animal.tipo === 'perdido'

  // Formatar data para exibição amigável
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

  // Ação 1: Voltar para /cadastro com os dados pré-preenchidos
  const handleEditar = () => {
    navigate(`/cadastro?perdido=${animal.tipo === 'perdido' ? 'true' : 'false'}`, {
      state: { animalParaEditar: animal },
    })
  }

  // Ação 2: Confirmar e publicar
  const handleConfirmar = () => {
    // Adiciona à lista em memória global
    adicionarAnimal({
      tipo: animal.tipo,
      fotoUrl: animal.fotoUrl,
      especie: animal.especie,
      porte: animal.porte,
      cor: animal.cor,
      cidade: animal.cidade,
      bairro: animal.bairro,
      data: animal.data,
      caracteristicas: animal.caracteristicas,
      descricao: animal.descricao,
      telefone: animal.telefone,
      whatsapp: animal.whatsapp,
    })

    // Limpa o rascunho
    setCadastroEmAndamento(null)

    // Dispara toast verde de sucesso conforme especificação
    toast({
      title: 'Cadastro publicado com sucesso!',
      description: isPerdido
        ? 'Seu pet já está visível na lista pública para ajudar nas buscas.'
        : 'O animal já está visível para que o tutor possa encontrá-lo.',
      className: 'bg-[#28a745] text-white border-0 shadow-lg',
      duration: 4000,
    })

    // Redireciona para /animais
    navigate('/animais')
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fade-in-up">
      {/* Título da tela */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] text-[#2d8f6f] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quase lá! Revise os dados antes de publicar</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2b2b2b]">Resumo do cadastro</h1>
        <p className="text-sm text-[#6b6b6b]">
          Confira se as informações abaixo estão corretas para facilitar o contato.
        </p>
      </div>

      {/* Card de Confirmação */}
      <div className="bg-white rounded-[20px] border border-[#e5e0d8] shadow-[0_6px_20px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Topo com Foto Grande Circular e Badge */}
        <div className="bg-gradient-to-b from-[#faf7f2] to-white p-6 sm:p-8 flex flex-col items-center border-b border-[#e5e0d8] text-center">
          {/* Badge de caminho */}
          <div className="mb-4">
            {isPerdido ? (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fdecea] text-[#d9534f] border border-[#d9534f]/30 shadow-2xs">
                Animal Perdido
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#28a745] border border-[#28a745]/30 shadow-2xs">
                Animal Encontrado
              </span>
            )}
          </div>

          {/* Foto Grande Circular */}
          <div className="relative">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#faf7f2]">
              <img
                src={animal.fotoUrl}
                alt={`${animal.especie} cadastrado`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-2 right-2 bg-white px-3 py-1 rounded-full border border-[#e5e0d8] text-xs font-bold text-[#2d8f6f] shadow-sm">
              {animal.especie}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#2b2b2b] mt-4">
            {animal.especie} • Porte {animal.porte}
          </h2>
          <p className="text-sm text-[#6b6b6b] mt-0.5">
            {animal.bairro}, {animal.cidade}
          </p>
        </div>

        {/* Grade com todas as informações */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Espécie */}
            <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block">
                Espécie
              </span>
              <span className="text-sm font-semibold text-[#2b2b2b] mt-0.5 block">
                {animal.especie}
              </span>
            </div>

            {/* Porte */}
            <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block">
                Porte
              </span>
              <span className="text-sm font-semibold text-[#2b2b2b] mt-0.5 block">
                {animal.porte}
              </span>
            </div>

            {/* Cor Predominante */}
            <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block">
                Cor predominante
              </span>
              <span className="text-sm font-semibold text-[#2b2b2b] mt-0.5 block">
                {animal.cor}
              </span>
            </div>

            {/* Cidade & Bairro */}
            <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]/80 sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#2d8f6f]" />
                Localização
              </span>
              <span className="text-sm font-semibold text-[#2b2b2b] mt-0.5 block">
                {animal.bairro}, {animal.cidade}
              </span>
            </div>

            {/* Data */}
            <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#6b6b6b]" />
                Data
              </span>
              <span className="text-sm font-semibold text-[#2b2b2b] mt-0.5 block">
                {formatarData(animal.data)}
              </span>
            </div>
          </div>

          {/* Características Marcantes */}
          {animal.caracteristicas && (
            <div className="p-4 rounded-xl bg-white border border-[#e5e0d8] space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block">
                Características marcantes
              </span>
              <p className="text-sm text-[#2b2b2b] leading-relaxed">{animal.caracteristicas}</p>
            </div>
          )}

          {/* Descrição Livre */}
          {animal.descricao && (
            <div className="p-4 rounded-xl bg-white border border-[#e5e0d8] space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block">
                Descrição do ocorrido
              </span>
              <p className="text-sm text-[#2b2b2b] leading-relaxed">{animal.descricao}</p>
            </div>
          )}

          {/* Formas de Contato */}
          <div className="p-4 rounded-xl bg-[#e8f5e9]/50 border border-[#2d8f6f]/20 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d8f6f] block">
              Formas de contato cadastradas
            </span>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              {animal.telefone && (
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2b2b2b]">
                  <Phone className="w-4 h-4 text-[#2d8f6f]" />
                  <span>Telefone: {animal.telefone}</span>
                </div>
              )}
              {animal.whatsapp && (
                <div className="flex items-center gap-2 text-sm font-semibold text-[#28a745]">
                  <MessageSquare className="w-4 h-4 text-[#28a745]" />
                  <span>WhatsApp: {animal.whatsapp}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé de Ações: Editar Cadastro vs Confirmar e Publicar */}
        <div className="bg-[#faf7f2] p-5 sm:p-6 border-t border-[#e5e0d8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleEditar}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] border-2 border-[#2d8f6f] text-[#2d8f6f] hover:bg-[#2d8f6f] hover:text-white font-semibold text-sm transition-all duration-200"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar cadastro</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Confirmar e publicar</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
