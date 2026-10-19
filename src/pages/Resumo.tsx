import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Check,
  Edit3,
  Send,
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  Sparkles,
  Loader2,
  ArrowRight,
  PawPrint,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User,
  Heart,
  AlertTriangle,
  Copy,
  Key,
} from 'lucide-react'
import type { AnimalCadastro, AnaliseCompatibilidadeResultado } from '@/types/animal'
import { usePets } from '@/context/PetContext'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { formatarTelefoneExibicao, isNumeroIncompleto } from '@/lib/phoneUtils'
import { useToast } from '@/hooks/use-toast'
import { analisarCompatibilidadeAnimal } from '@/services/animalService'
import { AnimalCompativelCard } from '@/components/AnimalCompativelCard'

export default function Resumo() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isAdmin } = useAdminAuth()
  const { adicionarAnimal, setCadastroEmAndamento } = usePets()
  const [salvando, setSalvando] = useState(false)
  const [etapaSalvamento, setEtapaSalvamento] = useState<string>('')
  const [resultadoCompatibilidade, setResultadoCompatibilidade] =
    useState<AnaliseCompatibilidadeResultado | null>(null)
  const [animalPublicado, setAnimalPublicado] = useState<AnimalCadastro | null>(null)
  const [copiadoGestao, setCopiadoGestao] = useState(false)

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
  const handleConfirmar = async () => {
    if (salvando) return
    setSalvando(true)
    setEtapaSalvamento('Salvando no banco…')

    try {
      // Salva de verdade no banco de dados do Skip Cloud (PocketBase) com upload do arquivo
      const animalCriado = await adicionarAnimal({
        tipo: animal.tipo,
        fotoUrl: animal.fotoUrl,
        fotoArquivo: animal.fotoArquivo,
        especie: animal.especie,
        porte: animal.porte,
        cor: animal.cor,
        uf: animal.uf,
        cidade: animal.cidade,
        bairro: animal.bairro,
        data: animal.data,
        caracteristicas: animal.caracteristicas,
        descricao: animal.descricao,
        telefone: animal.telefone,
        whatsapp: animal.whatsapp,
        nomePessoa: animal.nomePessoa,
        nomePet: animal.nomePet,
        emailAlertas: animal.emailAlertas,
      })

      setAnimalPublicado(animalCriado)

      // Limpa o rascunho
      setCadastroEmAndamento(null)

      // Dispara toast verde de sucesso conforme especificação
      toast({
        title: 'Cadastro salvo com sucesso no banco!',
        description: isPerdido
          ? 'Seu pet foi gravado no banco de dados e já está visível na lista pública para ajudar nas buscas.'
          : 'O animal foi gravado no banco de dados e já está visível para que o tutor possa encontrá-lo.',
        className: 'bg-[#28a745] text-white border-0 shadow-lg',
        duration: 4000,
      })

      // Inicia análise de compatibilidade cruzada via IA com o animal criado em segundo plano
      setEtapaSalvamento('Analisando compatibilidade com IA…')
      let analise: AnaliseCompatibilidadeResultado | null = null
      try {
        analise = await analisarCompatibilidadeAnimal(animalCriado.id)
        setResultadoCompatibilidade(analise)
      } catch (errAnalise) {
        console.error('Falha na análise de IA pós-cadastro:', errAnalise)
        analise = {
          analisado: false,
          totalCandidatos: 0,
          compatibilidades: [],
          erro: 'A análise de compatibilidade não pôde ser concluída no momento.',
        }
        setResultadoCompatibilidade(analise)
      }
      setSalvando(false)
      setEtapaSalvamento('')
    } catch (err) {
      console.error('Erro ao salvar cadastro:', err)
      toast({
        title: 'Erro ao salvar cadastro',
        description: 'Houve uma falha ao salvar as informações no banco de dados. Tente novamente.',
        variant: 'destructive',
      })
      setSalvando(false)
      setEtapaSalvamento('')
    }
  }

  // Se o cadastro já foi publicado com sucesso e temos o resultado da IA (ou encerrou a etapa de salvamento)
  if (animalPublicado && resultadoCompatibilidade) {
    const isPerdidoPublicado = animalPublicado.tipo === 'perdido'
    const totalCompatíveis = resultadoCompatibilidade.compatibilidades.length

    // Link de gestão: URL completa da aplicação para gerenciar sem criar conta
    const baseUrlApp =
      window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? window.location.origin
        : 'https://reencontro-pets.goskip.app'
    const linkGestaoCompleto = animalPublicado.codigoSecreto
      ? `${baseUrlApp}/animal/${animalPublicado.id}?gestao=${encodeURIComponent(animalPublicado.codigoSecreto)}`
      : `${baseUrlApp}/animal/${animalPublicado.id}`

    const handleCopiarLinkGestao = async () => {
      try {
        await navigator.clipboard.writeText(linkGestaoCompleto)
        setCopiadoGestao(true)
        toast({
          title: 'Link copiado!',
          description: 'O link de gestão foi copiado para a área de transferência.',
          className: 'bg-[#28a745] text-white border-0 shadow-lg',
          duration: 3000,
        })
        setTimeout(() => setCopiadoGestao(false), 3000)
      } catch {
        // Fallback caso clipboard API falhe
      }
    }

    return (
      <div className="max-w-4xl mx-auto pb-16 animate-fade-in space-y-8">
        {/* Banner de Confirmação de Sucesso */}
        <div className="bg-white rounded-[20px] border border-[#28a745]/30 p-6 sm:p-8 shadow-[0_4px_20px_rgba(40,167,69,0.08)] text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#e8f5e9] text-[#28a745] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] text-[#28a745] text-xs font-bold uppercase tracking-wider">
            <span>Cadastro publicado com sucesso</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2b2b2b]">
            {isPerdidoPublicado
              ? 'Seu pet foi cadastrado e já está no mural público!'
              : 'O animal em busca do dono foi cadastrado com sucesso!'}
          </h1>
          <p className="text-sm text-[#6b6b6b] max-w-xl mx-auto leading-relaxed">
            {isPerdidoPublicado
              ? 'Nossa Inteligência Artificial já analisou os animais cadastrados como procura-se o dono no banco cruzando fotos, características e localização para você.'
              : 'Nossa Inteligência Artificial já analisou os animais perdidos no banco cruzando fotos, características e localização com o pet acolhido.'}
          </p>
        </div>

        {/* Requisito 1: Link de gestão com botão de copiar e aviso verbatim */}
        <div className="bg-white rounded-[20px] border-2 border-[#2d8f6f]/30 p-6 sm:p-7 shadow-[0_4px_20px_rgba(45,143,111,0.08)] space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f5e9] text-[#2d8f6f] flex items-center justify-center shrink-0 mt-0.5">
              <Key className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#2d8f6f] text-xs font-bold uppercase tracking-wider">
                <span>Gestão sem conta</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#2b2b2b]">Link de gestão</h2>
              <p className="text-sm font-semibold text-[#d9534f]">
                Guarde este link. Só ele permite alterar seu anúncio.
              </p>
              <p className="text-xs text-[#6b6b6b] leading-relaxed">
                Com este link você poderá marcar o pet como reunido com a família ou atualizar seus
                contatos a qualquer momento, sem precisar criar senha ou conta.
              </p>
            </div>
          </div>

          <div className="bg-[#faf7f2] border border-[#e5e0d8] rounded-[14px] p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs font-mono text-[#2b2b2b] break-all select-all flex-1 px-1">
              {linkGestaoCompleto}
            </div>
            <button
              type="button"
              onClick={handleCopiarLinkGestao}
              className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all shadow-sm ${
                copiadoGestao
                  ? 'bg-[#28a745] text-white'
                  : 'bg-[#2d8f6f] hover:bg-[#237a5e] text-white hover:shadow-md'
              }`}
            >
              {copiadoGestao ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar link de gestão</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#6b6b6b]">
            <span>
              {animal.emailAlertas ? (
                <span className="text-[#2d8f6f] font-medium">
                  ✓ Enviamos uma cópia deste link também para o seu e-mail cadastrado (
                  {animal.emailAlertas}).
                </span>
              ) : (
                <span>Dica: adicione aos favoritos do seu navegador para não perder.</span>
              )}
            </span>
            <a
              href={linkGestaoCompleto}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#2d8f6f] hover:underline"
            >
              <span>Testar link de gestão agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Seção de Análise de Compatibilidade por IA */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-[16px] border border-[#e5e0d8]">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2d8f6f]">
                <Sparkles className="w-4 h-4" />
                <span>Análise de Compatibilidade por IA</span>
              </div>
              <h2 className="text-xl font-bold text-[#2b2b2b]">
                {isPerdidoPublicado
                  ? 'Animais em busca do dono compatíveis com o seu'
                  : 'Animais perdidos compatíveis com o pet acolhido'}
              </h2>
              <p className="text-xs text-[#6b6b6b]">
                Cruzamento inteligente de <strong>foto</strong>, <strong>características</strong> e{' '}
                <strong>proximidade de localização</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-[#faf7f2] border border-[#e5e0d8] text-xs font-bold text-[#2b2b2b]">
                {totalCompatíveis} {totalCompatíveis === 1 ? 'compatível' : 'compatíveis'}
              </span>
            </div>
          </div>

          {/* Estado de Erro da IA (Discreto) */}
          {resultadoCompatibilidade.erro && totalCompatíveis === 0 && (
            <div className="bg-white rounded-[16px] border border-[#f49b4f]/40 p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-[#f49b4f] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#2b2b2b]">
                  Análise temporariamente indisponível
                </h3>
                <p className="text-xs text-[#6b6b6b] max-w-md mx-auto">
                  Seu cadastro está 100% publicado e salvo com segurança. A análise automática por
                  IA não pôde ser completada agora, mas você já pode conferir todos os cadastros no
                  mural.
                </p>
              </div>
              <Link
                to="/animais"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#2d8f6f] text-white text-xs font-semibold hover:bg-[#237a5e] transition-colors"
              >
                <span>Ver mural público de animais</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Nenhum candidato compatível */}
          {!resultadoCompatibilidade.erro && totalCompatíveis === 0 && (
            <div className="bg-white rounded-[20px] border border-[#e5e0d8] p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#faf7f2] border border-[#e5e0d8] flex items-center justify-center text-[#2d8f6f]">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#2b2b2b]">
                  Nenhum animal compatível localizado por enquanto
                </h3>
                <p className="text-xs sm:text-sm text-[#6b6b6b] leading-relaxed max-w-md mx-auto">
                  {resultadoCompatibilidade.totalCandidatos === 0
                    ? `Ainda não existem animais ${isPerdidoPublicado ? 'em busca do tutor' : 'perdidos'} cadastrados no sistema. Seu cadastro já está público na lista para que outras pessoas vejam!`
                    : `Analisamos os animais ${isPerdidoPublicado ? 'em busca do tutor' : 'perdidos'} existentes, mas nenhum apresentou semelhança suficiente de espécie, porte, cor ou região com o seu pet.`}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/animais"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <span>Ir para o mural de animais</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Lista de animais compatíveis ordenados por porcentagem */}
          {totalCompatíveis > 0 && (
            <div className="space-y-4">
              {resultadoCompatibilidade.compatibilidades.map((item) => (
                <AnimalCompativelCard key={item.animal.id} item={item} />
              ))}
            </div>
          )}

          {/* Ações pós-análise */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e5e0d8]">
            <Link
              to="/cadastro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] border border-[#e5e0d8] text-[#2b2b2b] hover:bg-[#faf7f2] font-semibold text-xs sm:text-sm transition-all"
            >
              <PawPrint className="w-4 h-4 text-[#2d8f6f]" />
              <span>Cadastrar outro animal</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                navigate('/possiveis-correspondencias', {
                  state: {
                    animalPublicado,
                    animalId: animalPublicado.id,
                    resultadoCompatibilidade,
                    linkGestao: linkGestaoCompleto,
                  },
                })
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white font-semibold text-sm shadow-md transition-all"
            >
              <span>Ver possíveis correspondências ({totalCompatíveis})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
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
                Procura-se o dono
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
            {animal.nomePet
              ? `${animal.nomePet} (${animal.especie})`
              : `${animal.especie} • Porte ${animal.porte}`}
          </h2>
          <p className="text-sm text-[#6b6b6b] mt-0.5">
            {animal.nomePet && (
              <span className="font-medium text-[#2b2b2b]">Porte {animal.porte} • </span>
            )}
            {animal.bairro}, {animal.cidade}
            {animal.uf ? `, ${animal.uf}` : ''}
          </p>
        </div>

        {/* Grade com todas as informações */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Nome do Pet (quando preenchido) */}
            {animal.nomePet && (
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-[#f49b4f]" />
                  Nome do pet
                </span>
                <span className="text-sm font-semibold text-[#2b2b2b] mt-0.5 block">
                  {animal.nomePet}
                </span>
              </div>
            )}

            {/* Nome da Pessoa (quando preenchido) */}
            {animal.nomePessoa && (
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e5e0d8]/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6b6b] block flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#2d8f6f]" />
                  {isPerdido ? 'Quem perdeu' : 'Quem acolheu'}
                </span>
                <span className="text-sm font-semibold text-[#2b2b2b] mt-0.5 block">
                  {animal.nomePessoa}
                </span>
              </div>
            )}

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
                {animal.uf ? `, ${animal.uf}` : ''}
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
              {animal.telefone &&
                (() => {
                  const formatado = formatarTelefoneExibicao(animal.telefone)
                  const incompleto = isNumeroIncompleto(animal.telefone)

                  return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#2b2b2b]">
                      <Phone className="w-4 h-4 text-[#2d8f6f]" />
                      <span>Telefone: {formatado}</span>
                      {isAdmin && incompleto && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                          title="Aviso visível apenas para o administrador: o número cadastrado tem menos de 10 dígitos."
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>número incompleto</span>
                        </span>
                      )}
                    </div>
                  )
                })()}
              {animal.whatsapp &&
                (() => {
                  const formatado = formatarTelefoneExibicao(animal.whatsapp)
                  const incompleto = isNumeroIncompleto(animal.whatsapp)

                  return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#28a745]">
                      <MessageSquare className="w-4 h-4 text-[#28a745]" />
                      <span>WhatsApp: {formatado}</span>
                      {isAdmin && incompleto && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                          title="Aviso visível apenas para o administrador: o número cadastrado tem menos de 10 dígitos."
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>número incompleto</span>
                        </span>
                      )}
                    </div>
                  )
                })()}
            </div>
          </div>
        </div>

        {/* Rodapé de Ações: Editar Cadastro vs Confirmar e Publicar */}
        <div className="bg-[#faf7f2] p-5 sm:p-6 border-t border-[#e5e0d8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleEditar}
            disabled={salvando}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] border-2 border-[#2d8f6f] text-[#2d8f6f] hover:bg-[#2d8f6f] hover:text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar cadastro</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={salvando}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{etapaSalvamento || 'Salvando no banco…'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirmar e publicar</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
