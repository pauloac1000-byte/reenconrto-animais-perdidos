/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook routerAdd para análise de compatibilidade de animais via agente Skip Cloud nativo
 * Endpoint: POST /backend/v1/analisar-compatibilidade
 * Body: { animalId: string }
 */
routerAdd('POST', '/backend/v1/analisar-compatibilidade', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const animalId = (body.animalId || '').trim()

    if (!animalId) {
      return e.badRequestError('O ID do animal é obrigatório para análise.')
    }

    // 1. Buscar o animal de referência
    let animalRef = null
    try {
      animalRef = $app.findRecordById('animais', animalId)
    } catch (_) {
      return e.notFoundError('Animal de referência não encontrado.')
    }

    const tipoRef = animalRef.getString('tipo')

    // Se o animal já estiver reunido com a família, não participa de análise
    if (tipoRef === 'reunido') {
      return e.json(200, {
        analisado: true,
        totalCandidatos: 0,
        compatibilidades: [],
        aviso: 'Animal já se encontra reunido com a família.',
      })
    }

    const tipoOposto = tipoRef === 'perdido' ? 'encontrado' : 'perdido'
    const especieRef = animalRef.getString('especie')

    const refUf = animalRef.getString('uf') || ''

    // 2. Buscar candidatos do tipo oposto (excluindo qualquer animal com status 'reunido').
    // Especificação: animais do caminho oposto, da mesma espécie e da mesma UF
    let candidatos = []
    try {
      let filterExp = `tipo = '${tipoOposto}' && tipo != 'reunido' && especie = '${especieRef}'`
      if (refUf) {
        filterExp += ` && uf = '${refUf}'`
      }
      candidatos = $app.findRecordsByFilter('animais', filterExp, '-created', 15, 0)
    } catch (_) {
      candidatos = []
    }

    // Se não há candidatos no banco, retorna lista vazia imediatamente
    if (!candidatos || candidatos.length === 0) {
      return e.json(200, {
        analisado: true,
        totalCandidatos: 0,
        compatibilidades: [],
      })
    }

    // 3. Obter o usuário de serviço para conversar com o agente nativo
    let userId = e.auth?.id
    if (!userId) {
      try {
        const serviceUser = $app.findAuthRecordByEmail('users', 'sistema-reencontro@app.local')
        userId = serviceUser.id
      } catch (_) {
        // Fallback: primeiro usuário encontrado
        try {
          const firstUser = $app.findFirstRecordByFilter('users', 'id != ""')
          userId = firstUser.id
        } catch (_) {}
      }
    }

    if (!userId) {
      return e.json(200, {
        analisado: false,
        totalCandidatos: candidatos.length,
        compatibilidades: [],
        aviso: 'Usuário de execução não disponível para acionar o agente.',
      })
    }

    // 4. Montar a mensagem detalhada enviada ao agente nativo Skip Cloud
    // Incluímos a foto (nome do arquivo no storage / link de acesso), características, localização e data
    const pbBaseUrl = $os.getenv('VITE_POCKETBASE_URL') || ''
    const fotoRefNome = animalRef.getString('foto')
    const fotoRefUrl = fotoRefNome
      ? `${pbBaseUrl}/api/files/animais/${animalRef.id}/${fotoRefNome}`
      : 'Sem foto anexada'

    const refCidade = animalRef.getString('cidade') || ''
    const refLocalFormatado = refUf ? `${refCidade}, ${refUf}` : refCidade

    const refDados = {
      id: animalRef.id,
      tipo: tipoRef,
      especie: especieRef,
      porte: animalRef.getString('porte'),
      cor: animalRef.getString('cor'),
      uf: refUf,
      cidade: refCidade,
      bairro: animalRef.getString('bairro'),
      data: animalRef.getString('data'),
      caracteristicas: animalRef.getString('caracteristicas') || 'Não informadas',
      descricao: animalRef.getString('descricao') || 'Não informada',
      fotoArquivo: fotoRefNome || 'Não possui',
      fotoUrl: fotoRefUrl,
    }

    const candidatosPayload = candidatos.map((cand) => {
      const candFoto = cand.getString('foto')
      const candFotoUrl = candFoto
        ? `${pbBaseUrl}/api/files/animais/${cand.id}/${candFoto}`
        : 'Sem foto anexada'

      return {
        id: cand.id,
        tipo: cand.getString('tipo'),
        especie: cand.getString('especie'),
        porte: cand.getString('porte'),
        cor: cand.getString('cor'),
        uf: cand.getString('uf') || '',
        cidade: cand.getString('cidade') || '',
        bairro: cand.getString('bairro'),
        data: cand.getString('data'),
        caracteristicas: cand.getString('caracteristicas') || 'Não informadas',
        descricao: cand.getString('descricao') || 'Não informada',
        fotoArquivo: candFoto || 'Não possui',
        fotoUrl: candFotoUrl,
        telefone: cand.getString('telefone') || '',
        whatsapp: cand.getString('whatsapp') || '',
      }
    })

    const promptMessage = `Por favor, faça a análise cruzada de compatibilidade entre o seguinte animal recém-cadastrado e a lista de candidatos do tipo oposto:

ANIMAL RECÉM-CADASTRADO (${refDados.tipo.toUpperCase()}):
- ID: ${refDados.id}
- Espécie: ${refDados.especie}
- Porte: ${refDados.porte}
- Cor predominante: ${refDados.cor}
- Características marcantes: ${refDados.caracteristicas}
- Descrição: ${refDados.descricao}
- Localização: Bairro ${refDados.bairro}, Cidade ${refLocalFormatado} (UF: ${refDados.uf || 'N/A'}, Cidade: ${refDados.cidade})
- Data do evento: ${refDados.data}
- Foto: ${refDados.fotoUrl} (Arquivo: ${refDados.fotoArquivo})

CANDIDATOS DO TIPO OPOSTO NO BANCO:
${JSON.stringify(candidatosPayload, null, 2)}

Critérios de análise:
1. FOTO: características visuais.
2. CARACTERÍSTICAS: espécie (essencial), porte, cor predominante e marcas.
3. LOCALIZAÇÃO E TEMPO: avalie a proximidade geográfica usando UF e Cidade (mesma Cidade = pontuação máxima de proximidade; mesma UF = proximidade regional; UFs diferentes = improvável/baixa proximidade geográfica a menos que sejam cidades vizinhas na divisa), além de bairro e coerência de datas.
Retorne estritamente um array JSON com id, porcentagem (0-100) e explicacao em português citando foto, características e localização.`

    // 5. Chamar o agente nativo Skip Cloud
    let agentResult = null
    try {
      agentResult = $ai.agent('compatibilidade-animais').chat({
        user_id: userId,
        message: promptMessage,
      })
    } catch (agentErr) {
      console.log('Erro ao chamar agente nativo Skip Cloud:', agentErr.message)
      // Se a chamada do agente falhar por qualquer razão, não falha o cadastro!
      return e.json(200, {
        analisado: false,
        erro: 'Não foi possível processar a compatibilidade via IA no momento.',
        totalCandidatos: candidatos.length,
        compatibilidades: [],
      })
    }

    const content = agentResult && agentResult.content ? agentResult.content.trim() : ''

    // 6. Fazer o parse defensivo do JSON retornado pelo agente
    let analises = []
    try {
      // Extrai bloco JSON se o modelo envolveu em ```json ... ```
      let jsonText = content
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1].trim()
      } else {
        const startIdx = content.indexOf('[')
        const endIdx = content.lastIndexOf(']')
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          jsonText = content.substring(startIdx, endIdx + 1)
        }
      }
      analises = JSON.parse(jsonText)
    } catch (parseErr) {
      console.log(
        'Erro ao analisar JSON retornado pelo agente:',
        parseErr.message,
        'Conteúdo:',
        content,
      )
    }

    // 7. Enriquecer os resultados compatíveis com os dados reais dos candidatos do banco
    const candidatosMap = new Map()
    for (let i = 0; i < candidatos.length; i++) {
      const c = candidatos[i]
      const fotoNome = c.getString('foto')
      candidatosMap.set(c.id, {
        id: c.id,
        tipo: c.getString('tipo'),
        fotoUrl: fotoNome ? `${pbBaseUrl}/api/files/animais/${c.id}/${fotoNome}` : '',
        especie: c.getString('especie'),
        porte: c.getString('porte'),
        cor: c.getString('cor'),
        uf: c.getString('uf') || '',
        cidade: c.getString('cidade'),
        bairro: c.getString('bairro'),
        data: c.getString('data'),
        caracteristicas: c.getString('caracteristicas') || '',
        descricao: c.getString('descricao') || '',
        telefone: c.getString('telefone') || '',
        whatsapp: c.getString('whatsapp') || '',
        createdAt: c.getString('created'),
      })
    }

    const compatibilidades = []
    if (Array.isArray(analises)) {
      for (let i = 0; i < analises.length; i++) {
        const item = analises[i]
        if (!item || !item.id) continue
        const candData = candidatosMap.get(item.id)
        if (!candData) continue

        const pct = Math.max(0, Math.min(100, Math.round(Number(item.porcentagem) || 0)))
        compatibilidades.push({
          animal: candData,
          porcentagem: pct,
          explicacao:
            item.explicacao ||
            'Compatibilidade calculada com base nas características, foto e localização.',
        })
      }
    }

    // Ordena decrescente por porcentagem
    compatibilidades.sort((a, b) => b.porcentagem - a.porcentagem)

    return e.json(200, {
      analisado: true,
      totalCandidatos: candidatos.length,
      compatibilidades,
    })
  } catch (err) {
    console.log('Erro geral no hook de compatibilidade:', err.message)
    return e.json(500, {
      error: 'Erro interno ao processar análise de compatibilidade',
    })
  }
})
