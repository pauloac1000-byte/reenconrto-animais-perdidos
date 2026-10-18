import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Upload,
  Image as ImageIcon,
  AlertCircle,
  ArrowRight,
  Dog,
  Cat,
  Bird,
  Rabbit,
  HelpCircle,
  Phone,
  MessageSquare,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  Trash2,
  User,
  Heart,
} from 'lucide-react'
import type {
  AnimalCadastro,
  EspecieAnimal,
  PorteAnimal,
  CorAnimal,
  TipoAnimal,
} from '@/types/animal'
import { usePets } from '@/context/PetContext'

const ESPECIES: { label: EspecieAnimal; icon: React.ElementType }[] = [
  { label: 'Cão', icon: Dog },
  { label: 'Gato', icon: Cat },
  { label: 'Ave', icon: Bird },
  { label: 'Coelho', icon: Rabbit },
  { label: 'Outro', icon: HelpCircle },
]

const PORTES: { label: PorteAnimal; desc: string }[] = [
  { label: 'Pequeno', desc: 'Até 10 kg' },
  { label: 'Médio', desc: '10 a 25 kg' },
  { label: 'Grande', desc: 'Mais de 25 kg' },
]

const CORES: CorAnimal[] = ['Preto', 'Branco', 'Caramelo', 'Marrom', 'Cinza', 'Mesclado', 'Outro']

interface FormErrors {
  foto?: string
  especie?: string
  porte?: string
  cor?: string
  cidade?: string
  bairro?: string
  data?: string
  contato?: string
}

export default function Cadastro() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { setCadastroEmAndamento } = usePets()

  // Determina se é perdido ou achado com base no query param (?perdido=true|false)
  // Caso venha do state (ex: ao voltar de /resumo via "Editar cadastro")
  const dadosIniciaisState = (location.state as { animalParaEditar?: AnimalCadastro })
    ?.animalParaEditar

  const paramPerdido = searchParams.get('perdido')
  const isPerdido =
    dadosIniciaisState?.tipo !== undefined
      ? dadosIniciaisState.tipo === 'perdido'
      : paramPerdido !== 'false' // default para true se não for 'false'

  // Form State
  const [tipo, setTipo] = useState<TipoAnimal>(
    dadosIniciaisState?.tipo || (isPerdido ? 'perdido' : 'encontrado'),
  )
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(
    dadosIniciaisState?.fotoArquivo || null,
  )
  const [fotoUrl, setFotoUrl] = useState<string>(dadosIniciaisState?.fotoUrl || '')
  const [especie, setEspecie] = useState<EspecieAnimal | ''>(dadosIniciaisState?.especie || '')
  const [porte, setPorte] = useState<PorteAnimal | ''>(dadosIniciaisState?.porte || '')
  const [cor, setCor] = useState<CorAnimal | ''>(dadosIniciaisState?.cor || '')
  const [cidade, setCidade] = useState<string>(dadosIniciaisState?.cidade || '')
  const [bairro, setBairro] = useState<string>(dadosIniciaisState?.bairro || '')
  const [data, setData] = useState<string>(
    dadosIniciaisState?.data || new Date().toISOString().split('T')[0],
  )
  const [nomePessoa, setNomePessoa] = useState<string>(dadosIniciaisState?.nomePessoa || '')
  const [nomePet, setNomePet] = useState<string>(dadosIniciaisState?.nomePet || '')
  const [caracteristicas, setCaracteristicas] = useState<string>(
    dadosIniciaisState?.caracteristicas || '',
  )
  const [descricao, setDescricao] = useState<string>(dadosIniciaisState?.descricao || '')
  const [telefone, setTelefone] = useState<string>(dadosIniciaisState?.telefone || '')
  const [whatsapp, setWhatsapp] = useState<string>(dadosIniciaisState?.whatsapp || '')

  const [errors, setErrors] = useState<FormErrors>({})
  const [dragActive, setDragActive] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Atualiza tipo quando o searchParam mudar (se não estiver vindo de edição)
  useEffect(() => {
    if (!dadosIniciaisState) {
      const isPerd = paramPerdido !== 'false'
      setTipo(isPerd ? 'perdido' : 'encontrado')
    }
  }, [paramPerdido, dadosIniciaisState])

  // Processa arquivo de imagem para upload e Base64 preview
  const handleFileProcess = (file: File) => {
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!tiposPermitidos.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        foto: 'Formato inválido. Por favor, selecione uma imagem PNG, JPG, JPEG ou WEBP.',
      }))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        foto: 'O tamanho da imagem não pode ultrapassar 10MB.',
      }))
      return
    }

    setFotoArquivo(file)

    // Leitura em base64 para visualização imediata
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFotoUrl(reader.result)
        setErrors((prev) => ({ ...prev, foto: undefined }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  // Alternar entre Perdido e Procura-se o dono pelo switch no topo da página
  const alternarTipo = (novoTipo: TipoAnimal) => {
    setTipo(novoTipo)
    setSearchParams({ perdido: novoTipo === 'perdido' ? 'true' : 'false' })
  }

  // Validação dos campos
  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {}

    if (!fotoUrl.trim()) {
      newErrors.foto = 'A foto do animal é obrigatória para identificação visual.'
    }
    if (!especie) {
      newErrors.especie = 'Selecione a espécie do animal.'
    }
    if (!porte) {
      newErrors.porte = 'Selecione o porte do animal.'
    }
    if (!cor) {
      newErrors.cor = 'Selecione a cor predominante do animal.'
    }
    if (!cidade.trim()) {
      newErrors.cidade = 'O campo Cidade é obrigatório.'
    }
    if (!bairro.trim()) {
      newErrors.bairro = 'O campo Bairro é obrigatório.'
    }
    if (!data.trim()) {
      newErrors.data = 'A data é obrigatória.'
    }
    if (!telefone.trim() && !whatsapp.trim()) {
      newErrors.contato = 'Preencha pelo menos uma forma de contato (Telefone ou WhatsApp).'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      // Rola para o primeiro erro se houver
      window.scrollTo({ top: 120, behavior: 'smooth' })
      return false
    }

    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarFormulario()) return

    const animalMontado: AnimalCadastro = {
      id: dadosIniciaisState?.id || `temp-${Date.now()}`,
      tipo,
      fotoUrl,
      fotoArquivo,
      especie: especie as EspecieAnimal,
      porte: porte as PorteAnimal,
      cor: cor as CorAnimal,
      cidade: cidade.trim(),
      bairro: bairro.trim(),
      data,
      nomePessoa: nomePessoa.trim() || undefined,
      nomePet: nomePet.trim() || undefined,
      caracteristicas: caracteristicas.trim() || undefined,
      descricao: descricao.trim() || undefined,
      telefone: telefone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
    }

    // Salva no contexto de rascunho em andamento
    setCadastroEmAndamento(animalMontado)

    // Navega para /resumo passando os dados via router state (não pela URL)
    navigate('/resumo', {
      state: { animal: animalMontado },
    })
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fade-in">
      {/* Cabeçalho do Formulário */}
      <div className="text-center space-y-3 mb-8">
        {/* Seletor visual de tipo (Perdido / Procura-se o dono) */}
        <div className="inline-flex items-center p-1 bg-white border border-[#e5e0d8] rounded-full shadow-2xs mb-2">
          <button
            type="button"
            onClick={() => alternarTipo('perdido')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              tipo === 'perdido'
                ? 'bg-[#d9534f] text-white shadow-sm'
                : 'text-[#6b6b6b] hover:text-[#d9534f]'
            }`}
          >
            Animal Perdido
          </button>
          <button
            type="button"
            onClick={() => alternarTipo('encontrado')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              tipo === 'encontrado'
                ? 'bg-[#28a745] text-white shadow-sm'
                : 'text-[#6b6b6b] hover:text-[#28a745]'
            }`}
          >
            Procura-se o dono
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2b2b2b]">
          {tipo === 'perdido'
            ? 'Cadastro de animal perdido'
            : 'Cadastro de animal — Procura-se o dono'}
        </h1>

        <p className="text-sm sm:text-base text-[#6b6b6b] max-w-lg mx-auto">
          {tipo === 'perdido'
            ? 'Descreva seu pet para que quem o encontrou possa identificar e entrar em contato com você.'
            : 'Descreva o animal para que o tutor possa reconhecê-lo e pegá-lo de volta.'}
        </p>
      </div>

      {/* Formulário Principal */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[20px] border border-[#e5e0d8] p-6 sm:p-8 md:p-10 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-8"
        noValidate
      >
        {/* 1. Foto do Animal (Upload com Preview Circular) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]">
            Foto do animal <span className="text-[#e03e3e]">*</span>
          </label>
          <p className="text-xs text-[#6b6b6b]">
            Uma imagem nítida facilita muito a identificação (PNG, JPG, JPEG ou WEBP).
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Preview circular */}
            <div className="relative group shrink-0">
              <div
                className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-sm bg-[#faf7f2] flex items-center justify-center transition-all ${
                  errors.foto
                    ? 'border-[#e03e3e]'
                    : fotoUrl
                      ? 'border-[#2d8f6f]'
                      : 'border-[#e5e0d8]'
                }`}
              >
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt="Preview do animal"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#6b6b6b] p-3 text-center">
                    <ImageIcon className="w-8 h-8 text-[#6b6b6b]/60 mb-1" />
                    <span className="text-[10px] font-medium text-[#6b6b6b]">Sem foto</span>
                  </div>
                )}
              </div>

              {fotoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setFotoUrl('')
                    setFotoArquivo(null)
                  }}
                  aria-label="Remover foto"
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-[#e03e3e] text-white hover:bg-red-700 shadow-md transition-transform hover:scale-110"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Zona de Drop / Botão de Seleção */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#2d8f6f] bg-[#e8f5e9]/40 scale-[1.01]'
                  : errors.foto
                    ? 'border-[#e03e3e] bg-red-50/30'
                    : 'border-[#e5e0d8] hover:border-[#2d8f6f] hover:bg-[#faf7f2]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-[#2d8f6f] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#2b2b2b]">
                Clique para escolher ou arraste a imagem aqui
              </p>
              <p className="text-xs text-[#6b6b6b] mt-1">
                Formatos aceitos: PNG, JPG, JPEG, WEBP (máx. 10MB)
              </p>
            </div>
          </div>

          {errors.foto && (
            <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1.5 animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.foto}</span>
            </div>
          )}
        </div>

        {/* 2. Espécie (Radio cards) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]">
            Espécie <span className="text-[#e03e3e]">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {ESPECIES.map(({ label, icon: Icon }) => {
              const selected = especie === label
              return (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    setEspecie(label)
                    setErrors((prev) => ({ ...prev, especie: undefined }))
                  }}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                    selected
                      ? 'border-2 border-[#2d8f6f] bg-[#e8f5e9] text-[#2d8f6f] font-semibold shadow-2xs'
                      : 'border-[#e5e0d8] bg-white text-[#2b2b2b] hover:border-[#2d8f6f]/50 hover:bg-[#faf7f2]'
                  } ${errors.especie ? 'border-[#e03e3e]' : ''}`}
                >
                  <Icon
                    className={`w-6 h-6 mb-1.5 ${selected ? 'text-[#2d8f6f]' : 'text-[#6b6b6b]'}`}
                  />
                  <span className="text-xs sm:text-sm">{label}</span>
                </button>
              )
            })}
          </div>
          {errors.especie && (
            <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.especie}</span>
            </div>
          )}
        </div>

        {/* 3. Porte & 4. Cor Predominante */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Porte */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]">
              Porte <span className="text-[#e03e3e]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PORTES.map(({ label, desc }) => {
                const selected = porte === label
                return (
                  <button
                    type="button"
                    key={label}
                    onClick={() => {
                      setPorte(label)
                      setErrors((prev) => ({ ...prev, porte: undefined }))
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selected
                        ? 'border-2 border-[#2d8f6f] bg-[#e8f5e9] text-[#2d8f6f] font-semibold shadow-2xs'
                        : 'border-[#e5e0d8] bg-white text-[#2b2b2b] hover:border-[#2d8f6f]/50 hover:bg-[#faf7f2]'
                    } ${errors.porte ? 'border-[#e03e3e]' : ''}`}
                  >
                    <div className="text-xs sm:text-sm font-semibold">{label}</div>
                    <div className="text-[10px] text-[#6b6b6b] mt-0.5">{desc}</div>
                  </button>
                )
              })}
            </div>
            {errors.porte && (
              <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.porte}</span>
              </div>
            )}
          </div>

          {/* Cor Predominante */}
          <div className="space-y-3">
            <label
              htmlFor="cor-select"
              className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
            >
              Cor predominante <span className="text-[#e03e3e]">*</span>
            </label>
            <div className="relative">
              <select
                id="cor-select"
                value={cor}
                onChange={(e) => {
                  setCor(e.target.value as CorAnimal)
                  setErrors((prev) => ({ ...prev, cor: undefined }))
                }}
                className={`w-full h-[52px] px-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all ${
                  errors.cor ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                }`}
              >
                <option value="">Selecione a cor predominante...</option>
                {CORES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {errors.cor && (
              <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.cor}</span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Cidade e Bairro (Lado a lado em desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="cidade-input"
              className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
            >
              Cidade e UF <span className="text-[#e03e3e]">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="cidade-input"
                type="text"
                placeholder="Ex.: São Paulo/SP, Curitiba/PR"
                value={cidade}
                onChange={(e) => {
                  setCidade(e.target.value)
                  setErrors((prev) => ({ ...prev, cidade: undefined }))
                }}
                className={`w-full h-11 pl-10 pr-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all ${
                  errors.cidade ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                }`}
              />
            </div>
            {errors.cidade && (
              <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.cidade}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="bairro-input"
              className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
            >
              Bairro <span className="text-[#e03e3e]">*</span>
            </label>
            <input
              id="bairro-input"
              type="text"
              placeholder="Ex.: Pinheiros, Copacabana, Savassi"
              value={bairro}
              onChange={(e) => {
                setBairro(e.target.value)
                setErrors((prev) => ({ ...prev, bairro: undefined }))
              }}
              className={`w-full h-11 px-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all ${
                errors.bairro ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
              }`}
            />
            {errors.bairro && (
              <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.bairro}</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. Data */}
        <div className="space-y-1.5">
          <label
            htmlFor="data-input"
            className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
          >
            {tipo === 'perdido'
              ? 'Data em que foi visto por último'
              : 'Data do resgate / acolhimento'}{' '}
            <span className="text-[#e03e3e]">*</span>
          </label>
          <div className="relative max-w-xs">
            <CalendarIcon className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="data-input"
              type="date"
              value={data}
              onChange={(e) => {
                setData(e.target.value)
                setErrors((prev) => ({ ...prev, data: undefined }))
              }}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full h-11 pl-10 pr-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all ${
                errors.data ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
              }`}
            />
          </div>
          {errors.data && (
            <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.data}</span>
            </div>
          )}
        </div>

        {/* Campos Opcionais: Nome da pessoa e Nome do pet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e5e0d8]">
          {/* Nome da Pessoa */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="nome-pessoa-input"
                className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
              >
                Nome da pessoa
              </label>
              <span className="text-xs text-[#6b6b6b]">Opcional</span>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="nome-pessoa-input"
                type="text"
                placeholder={
                  tipo === 'perdido'
                    ? 'Quem perdeu o animal (ex.: Maria Silva)'
                    : 'Quem acolheu o animal (ex.: Carlos Souza)'
                }
                value={nomePessoa}
                onChange={(e) => setNomePessoa(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all"
              />
            </div>
            <p className="text-[11px] text-[#6b6b6b]">
              {tipo === 'perdido'
                ? 'Tutor ou responsável que procura pelo pet.'
                : 'Pessoa que resgatou/acolheu e procura o tutor.'}
            </p>
          </div>

          {/* Nome do Pet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="nome-pet-input"
                className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
              >
                Nome do pet
              </label>
              <span className="text-xs text-[#6b6b6b]">Opcional</span>
            </div>
            <div className="relative">
              <Heart className="w-4 h-4 text-[#f49b4f] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="nome-pet-input"
                type="text"
                placeholder="Nome pelo qual o animal atende (ex.: Bob, Mel)"
                value={nomePet}
                onChange={(e) => setNomePet(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all"
              />
            </div>
            <p className="text-[11px] text-[#6b6b6b]">
              Nome pelo qual ele é chamado ou reconhece ao ser chamado.
            </p>
          </div>
        </div>

        {/* 7. Características marcantes (Opcional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="caract-input"
              className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
            >
              Características marcantes
            </label>
            <span className="text-xs text-[#6b6b6b]">Opcional</span>
          </div>
          <textarea
            id="caract-input"
            rows={2}
            placeholder="Ex.: raça aproximada, cor da coleira, cicatrizes, manchas…"
            value={caracteristicas}
            onChange={(e) => setCaracteristicas(e.target.value)}
            className="w-full p-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all resize-y"
          />
        </div>

        {/* 8. Descrição livre (Opcional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="desc-input"
              className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
            >
              Descrição livre
            </label>
            <span className="text-xs text-[#6b6b6b]">Opcional</span>
          </div>
          <textarea
            id="desc-input"
            rows={3}
            placeholder="Conte o que aconteceu, como o animal foi perdido ou resgatado…"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full p-3.5 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all resize-y"
          />
        </div>

        {/* 9. Forma de contato: Telefone e WhatsApp (Pelo menos um obrigatório) */}
        <div className="space-y-3 pt-2 border-t border-[#e5e0d8]">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]">
              Forma de contato <span className="text-[#e03e3e]">*</span>
            </label>
            <span className="text-xs text-[#6b6b6b]">Preencha Telefone, WhatsApp ou ambos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#6b6b6b]">Telefone para ligação</span>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => {
                    setTelefone(e.target.value)
                    setErrors((prev) => ({ ...prev, contato: undefined }))
                  }}
                  className={`w-full h-11 pl-10 pr-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all ${
                    errors.contato ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#6b6b6b]">WhatsApp</span>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-[#28a745] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value)
                    setErrors((prev) => ({ ...prev, contato: undefined }))
                  }}
                  className={`w-full h-11 pl-10 pr-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] placeholder:text-[#6b6b6b]/60 focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all ${
                    errors.contato ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                  }`}
                />
              </div>
            </div>
          </div>

          {errors.contato && (
            <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.contato}</span>
            </div>
          )}
        </div>

        {/* Botão de envio */}
        <div className="pt-4 border-t border-[#e5e0d8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#6b6b6b] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2d8f6f]" />
            <span>Revise na próxima tela antes de publicar</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2d8f6f] hover:bg-[#237a5e] text-white font-semibold text-base px-8 py-3.5 rounded-[10px] shadow-sm hover:shadow transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Cadastrar animal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
