import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Dog,
  Cat,
  Bird,
  Rabbit,
  HelpCircle,
  Phone,
  MessageSquare,
  MapPin,
  Calendar as CalendarIcon,
  User,
  Heart,
  Save,
  Loader2,
  Trash2,
  ShieldCheck,
} from 'lucide-react'
import type {
  AnimalCadastro,
  EspecieAnimal,
  PorteAnimal,
  CorAnimal,
  TipoAnimal,
} from '@/types/animal'
import { ESTADOS_BRASIL } from '@/services/ibgeService'
import { CidadeCombobox } from '@/components/CidadeCombobox'
import { aplicarMascaraTelefone, apenasDigitos } from '@/lib/phoneUtils'

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
  uf?: string
  cidade?: string
  bairro?: string
  data?: string
  contato?: string
  telefone?: string
  whatsapp?: string
}

interface AnimalEditarModalProps {
  animal: AnimalCadastro
  isOpen: boolean
  onClose: () => void
  onSalvo: (animalAtualizado: AnimalCadastro) => void
  onSalvarDados: (
    id: string,
    dados: Partial<Omit<AnimalCadastro, 'id' | 'createdAt'>>,
  ) => Promise<AnimalCadastro>
}

export const AnimalEditarModal: React.FC<AnimalEditarModalProps> = ({
  animal,
  isOpen,
  onClose,
  onSalvo,
  onSalvarDados,
}) => {
  const [tipo, setTipo] = useState<TipoAnimal>(animal.tipo)
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string>(animal.fotoUrl || '')
  const [especie, setEspecie] = useState<EspecieAnimal | ''>(animal.especie)
  const [porte, setPorte] = useState<PorteAnimal | ''>(animal.porte)
  const [cor, setCor] = useState<CorAnimal | ''>(animal.cor)
  const [uf, setUf] = useState<string>(animal.uf || '')
  const [cidade, setCidade] = useState<string>(animal.cidade)
  const [bairro, setBairro] = useState<string>(animal.bairro)
  const [data, setData] = useState<string>(animal.data)
  const [nomePessoa, setNomePessoa] = useState<string>(animal.nomePessoa || '')
  const [nomePet, setNomePet] = useState<string>(animal.nomePet || '')
  const [caracteristicas, setCaracteristicas] = useState<string>(animal.caracteristicas || '')
  const [descricao, setDescricao] = useState<string>(animal.descricao || '')
  const [telefone, setTelefone] = useState<string>(
    animal.telefone ? aplicarMascaraTelefone(animal.telefone) : '',
  )
  const [whatsapp, setWhatsapp] = useState<string>(
    animal.whatsapp ? aplicarMascaraTelefone(animal.whatsapp) : '',
  )

  const [errors, setErrors] = useState<FormErrors>({})
  const [salvando, setSalvando] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincroniza campos quando o modal abre ou o animal muda
  useEffect(() => {
    if (isOpen) {
      setTipo(animal.tipo)
      setFotoArquivo(null)
      setFotoUrl(animal.fotoUrl || '')
      setEspecie(animal.especie)
      setPorte(animal.porte)
      setCor(animal.cor)
      setUf(animal.uf || '')
      setCidade(animal.cidade)
      setBairro(animal.bairro)
      setData(animal.data)
      setNomePessoa(animal.nomePessoa || '')
      setNomePet(animal.nomePet || '')
      setCaracteristicas(animal.caracteristicas || '')
      setDescricao(animal.descricao || '')
      setTelefone(animal.telefone ? aplicarMascaraTelefone(animal.telefone) : '')
      setWhatsapp(animal.whatsapp ? aplicarMascaraTelefone(animal.whatsapp) : '')
      setErrors({})
    }
  }, [isOpen, animal])

  if (!isOpen) return null

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
    if (!uf) {
      newErrors.uf = 'Selecione o estado (UF).'
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
    const digitosTelefone = apenasDigitos(telefone)
    const digitosWhatsapp = apenasDigitos(whatsapp)

    if (!digitosTelefone && !digitosWhatsapp) {
      newErrors.contato = 'Preencha pelo menos uma forma de contato (Telefone ou WhatsApp).'
    }

    if (digitosTelefone && digitosTelefone.length < 10) {
      newErrors.telefone = 'Inclua o DDD. Exemplo: (19) 99999-9999'
    }

    if (digitosWhatsapp && digitosWhatsapp.length < 10) {
      newErrors.whatsapp = 'Inclua o DDD. Exemplo: (19) 99999-9999'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarFormulario()) return

    setSalvando(true)
    try {
      const atualizado = await onSalvarDados(animal.id, {
        tipo,
        fotoUrl: fotoArquivo ? fotoUrl : undefined,
        fotoArquivo: fotoArquivo || undefined,
        especie: especie as EspecieAnimal,
        porte: porte as PorteAnimal,
        cor: cor as CorAnimal,
        uf,
        cidade: cidade.trim(),
        bairro: bairro.trim(),
        data,
        nomePessoa: nomePessoa.trim() || undefined,
        nomePet: nomePet.trim() || undefined,
        caracteristicas: caracteristicas.trim() || undefined,
        descricao: descricao.trim() || undefined,
        telefone: telefone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
      })

      onSalvo(atualizado)
      onClose()
    } catch (err) {
      console.error('Erro ao atualizar animal:', err)
      alert('Erro ao salvar as alterações. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-editar-titulo"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-[24px] border border-[#e5e0d8] shadow-2xl overflow-hidden my-6">
        {/* Cabeçalho do Modal */}
        <div className="bg-[#faf7f2] px-6 py-5 border-b border-[#e5e0d8] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2d8f6f] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d8f6f] block">
                Painel do Administrador
              </span>
              <h2 id="modal-editar-titulo" className="text-lg sm:text-xl font-bold text-[#2b2b2b]">
                Editar cadastro do animal
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar"
            className="p-2 rounded-xl text-[#6b6b6b] hover:text-[#2b2b2b] hover:bg-white border border-transparent hover:border-[#e5e0d8] transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form
          onSubmit={handleSalvar}
          className="p-6 sm:p-8 space-y-7 max-h-[calc(88vh-140px)] overflow-y-auto"
          noValidate
        >
          {/* 1. Situação / Tipo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]">
              Situação do cadastro <span className="text-[#e03e3e]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTipo('perdido')}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                  tipo === 'perdido'
                    ? 'border-[#d9534f] bg-[#fdecea] text-[#d9534f] shadow-2xs'
                    : 'border-[#e5e0d8] bg-white text-[#6b6b6b] hover:bg-[#faf7f2]'
                }`}
              >
                Animal Perdido
              </button>

              <button
                type="button"
                onClick={() => setTipo('encontrado')}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                  tipo === 'encontrado'
                    ? 'border-[#28a745] bg-[#e8f5e9] text-[#28a745] shadow-2xs'
                    : 'border-[#e5e0d8] bg-white text-[#6b6b6b] hover:bg-[#faf7f2]'
                }`}
              >
                Procura-se o dono
              </button>

              <button
                type="button"
                onClick={() => setTipo('reunido')}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                  tipo === 'reunido'
                    ? 'border-amber-500 bg-amber-100 text-amber-900 shadow-2xs'
                    : 'border-[#e5e0d8] bg-white text-[#6b6b6b] hover:bg-[#faf7f2]'
                }`}
              >
                Reunido com a família
              </button>
            </div>
          </div>

          {/* 2. Foto do Animal (Upload + Substituição) */}
          <div className="space-y-3 pt-3 border-t border-[#e5e0d8]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]">
                Foto do animal <span className="text-[#e03e3e]">*</span>
              </label>
              {fotoArquivo && (
                <span className="text-xs font-semibold text-[#2d8f6f]">
                  Nova foto selecionada para envio
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Preview circular */}
              <div className="relative shrink-0">
                <div
                  className={`w-28 h-28 rounded-full overflow-hidden border-4 shadow-sm bg-[#faf7f2] flex items-center justify-center transition-all ${
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
                      alt="Preview da foto do animal"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#6b6b6b] p-2 text-center">
                      <ImageIcon className="w-7 h-7 text-[#6b6b6b]/60 mb-1" />
                      <span className="text-[10px] font-medium">Sem foto</span>
                    </div>
                  )}
                </div>

                {fotoArquivo && (
                  <button
                    type="button"
                    onClick={() => {
                      setFotoArquivo(null)
                      setFotoUrl(animal.fotoUrl || '')
                    }}
                    title="Restaurar foto original"
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#6b6b6b] text-white hover:bg-[#2b2b2b] shadow-md transition-transform hover:scale-110"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Zona de Drop / Seleção */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#2d8f6f] bg-[#e8f5e9]/40'
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
                <Upload className="w-5 h-5 text-[#2d8f6f] mx-auto mb-1.5" />
                <p className="text-xs sm:text-sm font-semibold text-[#2b2b2b]">
                  {fotoArquivo
                    ? 'Clique para trocar por outra foto'
                    : 'Clique ou arraste uma nova imagem para substituir a foto'}
                </p>
                <p className="text-[11px] text-[#6b6b6b] mt-0.5">
                  PNG, JPG, JPEG ou WEBP (máx. 10MB). Se não selecionar, a foto atual será mantida.
                </p>
              </div>
            </div>

            {errors.foto && (
              <div className="flex items-center gap-1.5 text-xs text-[#e03e3e]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.foto}</span>
              </div>
            )}
          </div>

          {/* 3. Espécie (Radio cards) */}
          <div className="space-y-2 pt-2 border-t border-[#e5e0d8]">
            <label className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]">
              Espécie <span className="text-[#e03e3e]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
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
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      selected
                        ? 'border-2 border-[#2d8f6f] bg-[#e8f5e9] text-[#2d8f6f] font-semibold shadow-2xs'
                        : 'border-[#e5e0d8] bg-white text-[#2b2b2b] hover:border-[#2d8f6f]/50 hover:bg-[#faf7f2]'
                    } ${errors.especie ? 'border-[#e03e3e]' : ''}`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-1 ${selected ? 'text-[#2d8f6f]' : 'text-[#6b6b6b]'}`}
                    />
                    <span className="text-xs">{label}</span>
                  </button>
                )
              })}
            </div>
            {errors.especie && (
              <div className="flex items-center gap-1.5 text-xs text-[#e03e3e]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.especie}</span>
              </div>
            )}
          </div>

          {/* 4. Porte e Cor Predominante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Porte */}
            <div className="space-y-2">
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
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selected
                          ? 'border-2 border-[#2d8f6f] bg-[#e8f5e9] text-[#2d8f6f] font-semibold shadow-2xs'
                          : 'border-[#e5e0d8] bg-white text-[#2b2b2b] hover:border-[#2d8f6f]/50 hover:bg-[#faf7f2]'
                      } ${errors.porte ? 'border-[#e03e3e]' : ''}`}
                    >
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-[10px] text-[#6b6b6b] mt-0.5">{desc}</div>
                    </button>
                  )
                })}
              </div>
              {errors.porte && (
                <div className="flex items-center gap-1.5 text-xs text-[#e03e3e]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.porte}</span>
                </div>
              )}
            </div>

            {/* Cor Predominante */}
            <div className="space-y-2">
              <label
                htmlFor="edit-cor-select"
                className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
              >
                Cor predominante <span className="text-[#e03e3e]">*</span>
              </label>
              <select
                id="edit-cor-select"
                value={cor}
                onChange={(e) => {
                  setCor(e.target.value as CorAnimal)
                  setErrors((prev) => ({ ...prev, cor: undefined }))
                }}
                className={`w-full h-11 px-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] focus:ring-4 focus:ring-[#2d8f6f]/15 transition-all ${
                  errors.cor ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                }`}
              >
                <option value="">Selecione a cor...</option>
                {CORES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.cor && (
                <div className="flex items-center gap-1.5 text-xs text-[#e03e3e]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.cor}</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. UF, Cidade, Bairro e Data */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
              {/* UF */}
              <div className="sm:col-span-4 space-y-1.5">
                <label
                  htmlFor="edit-uf"
                  className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
                >
                  UF <span className="text-[#e03e3e]">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#6b6b6b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="edit-uf"
                    value={uf}
                    onChange={(e) => {
                      const novaUf = e.target.value
                      setUf(novaUf)
                      setCidade('') // Tratar troca de UF limpando a cidade
                      setErrors((prev) => ({ ...prev, uf: undefined, cidade: undefined }))
                    }}
                    className={`w-full h-11 pl-9 pr-3 bg-white rounded-xl border text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all ${
                      errors.uf ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                    }`}
                  >
                    <option value="">Selecione…</option>
                    {ESTADOS_BRASIL.map((est) => (
                      <option key={est.sigla} value={est.sigla}>
                        {est.sigla} — {est.nome}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.uf && (
                  <div className="flex items-center gap-1 text-[11px] text-[#e03e3e]">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.uf}</span>
                  </div>
                )}
              </div>

              {/* Cidade com autocomplete do IBGE */}
              <div className="sm:col-span-8 space-y-1.5">
                <label
                  htmlFor="edit-cidade-combobox"
                  className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
                >
                  Cidade <span className="text-[#e03e3e]">*</span>
                </label>
                <CidadeCombobox
                  id="edit-cidade-combobox"
                  uf={uf}
                  value={cidade}
                  onChange={(cidadeEscolhida) => {
                    setCidade(cidadeEscolhida)
                    setErrors((prev) => ({ ...prev, cidade: undefined }))
                  }}
                  error={Boolean(errors.cidade)}
                  placeholder={uf ? 'Digite para buscar o município…' : 'Selecione a UF primeiro'}
                />
                {errors.cidade && (
                  <div className="flex items-center gap-1 text-[11px] text-[#e03e3e]">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.cidade}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-bairro"
                  className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
                >
                  Bairro <span className="text-[#e03e3e]">*</span>
                </label>
                <input
                  id="edit-bairro"
                  type="text"
                  placeholder="Ex.: Pinheiros, Centro"
                  value={bairro}
                  onChange={(e) => {
                    setBairro(e.target.value)
                    setErrors((prev) => ({ ...prev, bairro: undefined }))
                  }}
                  className={`w-full h-11 px-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all ${
                    errors.bairro ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                  }`}
                />
                {errors.bairro && (
                  <div className="flex items-center gap-1 text-[11px] text-[#e03e3e]">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.bairro}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-data"
                  className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
                >
                  Data <span className="text-[#e03e3e]">*</span>
                </label>
                <div className="relative">
                  <CalendarIcon className="w-4 h-4 text-[#6b6b6b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="edit-data"
                    type="date"
                    value={data}
                    onChange={(e) => {
                      setData(e.target.value)
                      setErrors((prev) => ({ ...prev, data: undefined }))
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full h-11 pl-9 pr-3.5 bg-white rounded-xl border text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all ${
                      errors.data ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                    }`}
                  />
                </div>
                {errors.data && (
                  <div className="flex items-center gap-1 text-[11px] text-[#e03e3e]">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.data}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 6. Nome da Pessoa e Nome do Pet (Opcionais) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e5e0d8]">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="edit-nome-pessoa"
                  className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
                >
                  Nome da pessoa
                </label>
                <span className="text-[11px] text-[#6b6b6b]">Opcional</span>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-[#6b6b6b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="edit-nome-pessoa"
                  type="text"
                  placeholder="Nome do tutor ou de quem acolheu"
                  value={nomePessoa}
                  onChange={(e) => setNomePessoa(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="edit-nome-pet"
                  className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
                >
                  Nome do pet
                </label>
                <span className="text-[11px] text-[#6b6b6b]">Opcional</span>
              </div>
              <div className="relative">
                <Heart className="w-4 h-4 text-[#f49b4f] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="edit-nome-pet"
                  type="text"
                  placeholder="Nome do pet (ex.: Bob, Mel)"
                  value={nomePet}
                  onChange={(e) => setNomePet(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all"
                />
              </div>
            </div>
          </div>

          {/* 7. Características marcantes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-caracteristicas"
                className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
              >
                Características marcantes
              </label>
              <span className="text-[11px] text-[#6b6b6b]">Opcional</span>
            </div>
            <textarea
              id="edit-caracteristicas"
              rows={2}
              placeholder="Ex.: manchas, cor da coleira, cicatrizes…"
              value={caracteristicas}
              onChange={(e) => setCaracteristicas(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all resize-y"
            />
          </div>

          {/* 8. Descrição livre */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-descricao"
                className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]"
              >
                Descrição detalhada
              </label>
              <span className="text-[11px] text-[#6b6b6b]">Opcional</span>
            </div>
            <textarea
              id="edit-descricao"
              rows={3}
              placeholder="Mais detalhes sobre o ocorrido ou informações relevantes…"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-[#e5e0d8] text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all resize-y"
            />
          </div>

          {/* 9. Formas de contato */}
          <div className="space-y-2 pt-2 border-t border-[#e5e0d8]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-[0.05em] text-[#2b2b2b]">
                Forma de contato <span className="text-[#e03e3e]">*</span>
              </label>
              <span className="text-[11px] text-[#6b6b6b]">
                Preencha Telefone, WhatsApp ou ambos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#6b6b6b]">Telefone</span>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#6b6b6b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="(19) 99999-9999"
                    value={telefone}
                    onChange={(e) => {
                      const formatado = aplicarMascaraTelefone(e.target.value)
                      setTelefone(formatado)
                      setErrors((prev) => ({
                        ...prev,
                        contato: undefined,
                        telefone: undefined,
                      }))
                    }}
                    className={`w-full h-10 pl-9 pr-3 bg-white rounded-xl border text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all ${
                      errors.telefone || errors.contato ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                    }`}
                  />
                </div>
                {errors.telefone && (
                  <div className="flex items-center gap-1 text-[11px] text-[#e03e3e] mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.telefone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#6b6b6b]">WhatsApp</span>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-[#28a745] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="(19) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => {
                      const formatado = aplicarMascaraTelefone(e.target.value)
                      setWhatsapp(formatado)
                      setErrors((prev) => ({
                        ...prev,
                        contato: undefined,
                        whatsapp: undefined,
                      }))
                    }}
                    className={`w-full h-10 pl-9 pr-3 bg-white rounded-xl border text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2d8f6f] transition-all ${
                      errors.whatsapp || errors.contato ? 'border-[#e03e3e]' : 'border-[#e5e0d8]'
                    }`}
                  />
                </div>
                {errors.whatsapp && (
                  <div className="flex items-center gap-1 text-[11px] text-[#e03e3e] mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.whatsapp}</span>
                  </div>
                )}
              </div>
            </div>

            {errors.contato && (
              <div className="flex items-center gap-1.5 text-xs text-[#e03e3e] mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.contato}</span>
              </div>
            )}
          </div>

          {/* Rodapé do Modal com Ações */}
          <div className="pt-4 border-t border-[#e5e0d8] flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] border border-[#e5e0d8] text-sm font-semibold text-[#2b2b2b] hover:bg-[#faf7f2] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[10px] bg-[#2d8f6f] hover:bg-[#237a5e] text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando alterações…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
