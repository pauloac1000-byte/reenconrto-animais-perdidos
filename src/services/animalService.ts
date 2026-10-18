import type { AnimalCadastro, AnaliseCompatibilidadeResultado } from '@/types/animal'
import pb from '@/lib/pocketbase/client'
import { recordToAnimal, type AnimalRecord } from './schema'

/**
 * Converte data URL em objeto File se necessário (para casos de preview/edição)
 */
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

/**
 * Busca todos os animais gravados na coleção 'animais' do Skip Cloud (PocketBase),
 * ordenados do mais recente para o mais antigo.
 */
/**
 * Busca um único animal pelo ID na coleção 'animais' do Skip Cloud (PocketBase)
 */
export async function buscarAnimalPorId(id: string): Promise<AnimalCadastro | null> {
  try {
    const record = await pb.collection('animais').getOne<AnimalRecord>(id, {
      requestKey: null,
    })
    return recordToAnimal(record)
  } catch (err: unknown) {
    // Se for 404 (not found), retorna null suavemente
    const status = (err as { status?: number })?.status
    if (status === 404) {
      return null
    }
    console.error(`Erro ao buscar animal por ID ${id}:`, err)
    throw err
  }
}

export async function listarAnimais(): Promise<AnimalCadastro[]> {
  try {
    const records = await pb.collection('animais').getFullList<AnimalRecord>({
      sort: '-created',
      requestKey: null,
    })

    return records.map(recordToAnimal)
  } catch (err) {
    console.error('Erro ao listar animais no PocketBase:', err)
    throw err
  }
}

/**
 * Salva um novo cadastro real de animal na coleção 'animais' do Skip Cloud (PocketBase)
 * suportando upload real do arquivo de imagem (FormData).
 */
/**
 * Atualiza o status/tipo de um animal para 'reunido' na coleção 'animais'
 */
export async function marcarAnimalComoReunido(id: string): Promise<AnimalCadastro> {
  try {
    const updatedRecord = await pb.collection('animais').update<AnimalRecord>(id, {
      tipo: 'reunido',
    })
    return recordToAnimal(updatedRecord)
  } catch (err) {
    console.error(`Erro ao marcar animal ${id} como reunido:`, err)
    throw err
  }
}

/**
 * Atualiza todas as informações de um cadastro existente de animal (coleção 'animais').
 * Se um novo fotoArquivo ou fotoUrl data-URL for fornecido, atualiza o arquivo de foto no PocketBase.
 * Se fotoArquivo for null e fotoUrl não for data-URL, mantém o arquivo atual intacto.
 */
export async function atualizarAnimal(
  id: string,
  dados: Partial<Omit<AnimalCadastro, 'id' | 'createdAt'>>,
): Promise<AnimalCadastro> {
  try {
    const formData = new FormData()

    if (dados.tipo !== undefined) {
      formData.append('tipo', dados.tipo)
    }
    if (dados.especie !== undefined) {
      formData.append('especie', dados.especie)
    }
    if (dados.porte !== undefined) {
      formData.append('porte', dados.porte)
    }
    if (dados.cor !== undefined) {
      formData.append('cor', dados.cor)
    }
    if (dados.cidade !== undefined) {
      formData.append('cidade', dados.cidade)
    }
    if (dados.bairro !== undefined) {
      formData.append('bairro', dados.bairro)
    }
    if (dados.data !== undefined) {
      formData.append('data', dados.data)
    }

    // Campos opcionais de texto (se forem string vazia ou undefined, garante envio para limpar ou preencher)
    formData.append('caracteristicas', dados.caracteristicas || '')
    formData.append('descricao', dados.descricao || '')
    formData.append('telefone', dados.telefone || '')
    formData.append('whatsapp', dados.whatsapp || '')
    formData.append('nome_pessoa', dados.nomePessoa || '')
    formData.append('nome_pet', dados.nomePet || '')

    // Processamento de nova foto (se o usuário escolheu um novo arquivo)
    if (dados.fotoArquivo instanceof File) {
      formData.append('foto', dados.fotoArquivo)
    } else if (dados.fotoUrl && dados.fotoUrl.startsWith('data:image/')) {
      const extensao = dados.fotoUrl.includes('image/png')
        ? 'png'
        : dados.fotoUrl.includes('image/webp')
          ? 'webp'
          : 'jpg'
      const fileFromDataUrl = dataURLtoFile(dados.fotoUrl, `pet-${Date.now()}.${extensao}`)
      formData.append('foto', fileFromDataUrl)
    }

    const updatedRecord = await pb.collection('animais').update<AnimalRecord>(id, formData)
    return recordToAnimal(updatedRecord)
  } catch (err) {
    console.error(`Erro ao atualizar animal ${id} no PocketBase:`, err)
    throw err
  }
}

/**
 * Apaga o registro do animal na coleção 'animais' do Skip Cloud (PocketBase),
 * deletando também o arquivo associado no storage.
 */
export async function apagarAnimal(id: string): Promise<boolean> {
  try {
    await pb.collection('animais').delete(id)
    return true
  } catch (err) {
    console.error(`Erro ao apagar animal ${id} no PocketBase:`, err)
    throw err
  }
}

export async function criarAnimal(
  dados: Omit<AnimalCadastro, 'id' | 'createdAt'>,
): Promise<AnimalCadastro> {
  try {
    const formData = new FormData()

    formData.append('tipo', dados.tipo)
    formData.append('especie', dados.especie)
    formData.append('porte', dados.porte)
    formData.append('cor', dados.cor)
    formData.append('cidade', dados.cidade)
    formData.append('bairro', dados.bairro)
    formData.append('data', dados.data)

    if (dados.caracteristicas) {
      formData.append('caracteristicas', dados.caracteristicas)
    }
    if (dados.descricao) {
      formData.append('descricao', dados.descricao)
    }
    if (dados.telefone) {
      formData.append('telefone', dados.telefone)
    }
    if (dados.whatsapp) {
      formData.append('whatsapp', dados.whatsapp)
    }
    if (dados.nomePessoa) {
      formData.append('nome_pessoa', dados.nomePessoa)
    }
    if (dados.nomePet) {
      formData.append('nome_pet', dados.nomePet)
    }

    // Processamento da foto: se tiver File anexado, usa diretamente;
    // se tiver fotoUrl como data URL base64, converte para File
    if (dados.fotoArquivo instanceof File) {
      formData.append('foto', dados.fotoArquivo)
    } else if (dados.fotoUrl && dados.fotoUrl.startsWith('data:image/')) {
      const extensao = dados.fotoUrl.includes('image/png')
        ? 'png'
        : dados.fotoUrl.includes('image/webp')
          ? 'webp'
          : 'jpg'
      const fileFromDataUrl = dataURLtoFile(dados.fotoUrl, `pet-${Date.now()}.${extensao}`)
      formData.append('foto', fileFromDataUrl)
    }

    const createdRecord = await pb.collection('animais').create<AnimalRecord>(formData)
    return recordToAnimal(createdRecord)
  } catch (err) {
    console.error('Erro ao criar animal no PocketBase:', err)
    throw err
  }
}

/**
 * Executa a análise de compatibilidade por IA chamando o hook com agente nativo Skip Cloud
 * Compara o animal recém-cadastrado com candidatos do tipo oposto (foto + características + localização).
 */
export async function analisarCompatibilidadeAnimal(
  animalId: string,
): Promise<AnaliseCompatibilidadeResultado> {
  try {
    const res = await pb.send<AnaliseCompatibilidadeResultado>(
      '/backend/v1/analisar-compatibilidade',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ animalId }),
      },
    )
    return res
  } catch (err) {
    console.error('Falha na chamada de análise de compatibilidade:', err)
    return {
      analisado: false,
      totalCandidatos: 0,
      compatibilidades: [],
      erro: 'Não foi possível carregar a análise de compatibilidade no momento.',
    }
  }
}
