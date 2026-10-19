/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para ocultar o campo email_alertas nas respostas da API pública (enrich),
 * garantindo que ele NUNCA seja vazado em endpoints de listagem, visualização pública ou realtime.
 */
onRecordEnrich((e) => {
  try {
    const isSuper =
      e.requestInfo &&
      typeof e.requestInfo.hasSuperuserAuth === 'function' &&
      e.requestInfo.hasSuperuserAuth()
    const authCollection = e.requestInfo?.auth?.collection?.()?.name
    if (!isSuper && authCollection !== 'admins') {
      e.record.hide('email_alertas')
      e.record.hide('codigo_secreto')
    }
  } catch (_) {
    try {
      e.record.hide('email_alertas')
      e.record.hide('codigo_secreto')
    } catch (_) {}
  }
  e.next()
}, 'animais')

/**
 * Hook onRecordCreate: antes de persistir, gera codigo_secreto seguro se não estiver preenchido.
 */
onRecordCreate((e) => {
  try {
    const codAtual = e.record.getString('codigo_secreto')
    if (!codAtual || codAtual.trim() === '') {
      e.record.set('codigo_secreto', $security.randomString(24))
    }
  } catch (_) {}
  e.next()
}, 'animais')

/**
 * Hook onRecordCreate na coleção 'animais':
 * Executa persistência com e.next() primeiro e depois compara o animal cadastrado
 * com candidatos ativos do caminho oposto (mesma espécie e mesma UF, excluindo "reunido").
 * Para compatibilidade >= 70%, deduplica pelo par e envia e-mail com foto, % e link.
 * Registra o alerta na nova coleção 'alertas'.
 */
onRecordCreate((e) => {
  // 1. Garante a criação do registro sem bloqueio
  e.next()

  try {
    const appInstance = e.app
    const animalRecord = e.record
    if (!animalRecord) return

    // Se o cadastro tiver email_alertas, enviar e-mail com o link de gestão exclusivo
    try {
      const emailCriador = (animalRecord.getString('email_alertas') || '').trim()
      const codigoCriador = (animalRecord.getString('codigo_secreto') || '').trim()
      if (emailCriador && codigoCriador) {
        const linkGestaoCriador =
          'https://reencontro-pets.goskip.app/animal/' +
          animalRecord.id +
          '?gestao=' +
          encodeURIComponent(codigoCriador)
        const petNomeOuEspecie =
          animalRecord.getString('nome_pet') || animalRecord.getString('especie') || 'seu animal'
        const tipoCriadorRotulo =
          animalRecord.getString('tipo') === 'perdido'
            ? 'perdido'
            : 'em busca do dono ("Procura-se o dono")'

        const senderAddress =
          appInstance.settings().meta.senderAddress || 'no-reply@reencontro-pets.goskip.app'
        const senderName = appInstance.settings().meta.senderName || 'Reencontro Pets'

        const emailSubjectGestao =
          'Link de gestão do anúncio: ' + petNomeOuEspecie + ' — Reencontro'
        const htmlBodyGestao =
          '<!DOCTYPE html>' +
          '<html lang="pt-BR">' +
          '<head><meta charset="utf-8"><title>Link de Gestão do seu Anúncio — Reencontro</title></head>' +
          '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f2; color: #2b2b2b; margin: 0; padding: 24px;">' +
          '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e0d8; overflow: hidden;">' +
          '<tr><td style="background-color: #2d8f6f; padding: 24px; text-align: center; color: #ffffff;">' +
          '<h1 style="margin: 0; font-size: 22px; font-weight: bold;">Reencontro — Gestão do Anúncio</h1>' +
          '<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Seu anúncio foi cadastrado com sucesso no mural</p>' +
          '</td></tr>' +
          '<tr><td style="padding: 28px 24px;">' +
          '<p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">' +
          'Olá! Seu cadastro de <strong>' +
          petNomeOuEspecie +
          '</strong> (' +
          tipoCriadorRotulo +
          ') foi publicado com sucesso no Reencontro.' +
          '</p>' +
          '<div style="background-color: #f4faf6; border: 1px solid #c7e6d7; border-radius: 12px; padding: 18px; margin-bottom: 24px;">' +
          '<div style="font-size: 14px; font-weight: bold; color: #2d8f6f; margin-bottom: 8px;">Link de gestão do seu anúncio</div>' +
          '<p style="font-size: 13px; color: #555555; margin: 0 0 14px 0; line-height: 1.4;">' +
          '<strong>Guarde este link. Só ele permite alterar seu anúncio.</strong> Com ele você pode editar seus dados de contato ou marcar o pet como reunido com a família quando for encontrado.' +
          '</p>' +
          '<div style="text-align: center; margin: 16px 0;">' +
          '<a href="' +
          linkGestaoCriador +
          '" target="_blank" style="background-color: #2d8f6f; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 24px; border-radius: 10px; display: inline-block;">' +
          'Acessar gestão do anúncio &rarr;' +
          '</a>' +
          '</div>' +
          '<p style="font-size: 11px; color: #777777; margin: 12px 0 0 0; word-break: break-all;">' +
          'Link direto: <a href="' +
          linkGestaoCriador +
          '" style="color: #2d8f6f;">' +
          linkGestaoCriador +
          '</a>' +
          '</p>' +
          '</div>' +
          '</td></tr>' +
          '<tr><td style="background-color: #faf7f2; padding: 16px 24px; border-top: 1px solid #e5e0d8; font-size: 11px; color: #777777; text-align: center; line-height: 1.4;">' +
          'Você recebeu este e-mail porque cadastrou um alerta no Reencontro. Guarde este link com segurança.' +
          '</td></tr>' +
          '</table></body></html>'

        const mailMsg = new MailerMessage({
          from: {
            address: senderAddress,
            name: senderName,
          },
          to: [{ address: emailCriador }],
          subject: emailSubjectGestao,
          html: htmlBodyGestao,
        })

        appInstance.newMailClient().send(mailMsg)
        console.log('E-mail com link de gestão enviado para ' + emailCriador)
      }
    } catch (mailGestaoErr) {
      console.log('Falha ao enviar e-mail de link de gestão:', mailGestaoErr.message)
    }

    const animalId = animalRecord.id
    const tipoRef = animalRecord.getString('tipo')

    // Se o novo registro tiver status 'reunido', não participa de análise de compatibilidade
    if (tipoRef === 'reunido') {
      return
    }

    const tipoOposto = tipoRef === 'perdido' ? 'encontrado' : 'perdido'
    const especieRef = animalRecord.getString('especie')
    const refUf = (animalRecord.getString('uf') || '').trim()

    // 2. Buscar candidatos do tipo oposto (excluindo 'reunido'), mesma espécie e mesma UF
    let candidatos = []
    try {
      let filterExp = `tipo = '${tipoOposto}' && tipo != 'reunido' && especie = '${especieRef}'`
      if (refUf) {
        filterExp += ` && uf = '${refUf}'`
      }
      candidatos = appInstance.findRecordsByFilter('animais', filterExp, '-created', 20, 0)
    } catch (candErr) {
      console.log('Erro ao buscar candidatos para alerta de compatibilidade:', candErr.message)
      return
    }

    if (!candidatos || candidatos.length === 0) {
      return
    }

    // 3. Obter usuário de serviço para acionar o agente Skip Cloud nativo
    let serviceUserId = ''
    try {
      const serviceUser = appInstance.findAuthRecordByEmail('users', 'sistema-reencontro@app.local')
      serviceUserId = serviceUser.id
    } catch (_) {
      try {
        const firstUser = appInstance.findFirstRecordByFilter('users', 'id != ""')
        serviceUserId = firstUser.id
      } catch (_) {}
    }

    if (!serviceUserId) {
      console.log('Alerta automático: usuário de serviço não localizado para acionar o agente IA.')
      return
    }

    const pbBaseUrl = $os.getenv('VITE_POCKETBASE_URL') || ''
    const fotoRefNome = animalRecord.getString('foto')
    const fotoRefUrl = fotoRefNome
      ? `${pbBaseUrl}/api/files/animais/${animalRecord.id}/${fotoRefNome}`
      : ''

    const refCidade = animalRecord.getString('cidade') || ''
    const refLocalFormatado = refUf ? `${refCidade}, ${refUf}` : refCidade

    const refDados = {
      id: animalRecord.id,
      tipo: tipoRef,
      especie: especieRef,
      porte: animalRecord.getString('porte'),
      cor: animalRecord.getString('cor'),
      uf: refUf,
      cidade: refCidade,
      bairro: animalRecord.getString('bairro'),
      data: animalRecord.getString('data'),
      caracteristicas: animalRecord.getString('caracteristicas') || 'Não informadas',
      descricao: animalRecord.getString('descricao') || 'Não informada',
      fotoArquivo: fotoRefNome || 'Não possui',
      fotoUrl: fotoRefUrl || 'Sem foto anexada',
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
3. LOCALIZAÇÃO E TEMPO: proximidade geográfica (UF, Cidade, Bairro) e coerência temporal.
Retorne estritamente um array JSON com id, porcentagem (0-100) e explicacao em português citando foto, características e localização.`

    // 4. Chamar agente nativo Skip Cloud
    let agentResult = null
    try {
      agentResult = $ai.agent('compatibilidade-animais').chat({
        user_id: serviceUserId,
        message: promptMessage,
      })
    } catch (aiErr) {
      console.log('Alerta automático: falha ao chamar agente Skip Cloud:', aiErr.message)
      return
    }

    const content = agentResult && agentResult.content ? agentResult.content.trim() : ''
    let analises = []
    try {
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
      console.log('Alerta automático: erro no parse JSON do agente:', parseErr.message)
      return
    }

    if (!Array.isArray(analises) || analises.length === 0) {
      return
    }

    // Mapa de candidatos por ID para acesso rápido
    const candidatosMap = new Map()
    for (let i = 0; i < candidatos.length; i++) {
      candidatosMap.set(candidatos[i].id, candidatos[i])
    }

    let colAlertas = null
    try {
      colAlertas = appInstance.findCollectionByNameOrId('alertas')
    } catch (colErr) {
      console.log('Coleção alertas não encontrada:', colErr.message)
      return
    }

    // 5. Filtrar por compatibilidade >= 70% e verificar deduplicação
    for (let i = 0; i < analises.length; i++) {
      const item = analises[i]
      if (!item || !item.id) continue

      const pct = Math.max(0, Math.min(100, Math.round(Number(item.porcentagem) || 0)))
      if (pct < 70) {
        continue // Exigência: 70% OU MAIS
      }

      const candRecord = candidatosMap.get(item.id)
      if (!candRecord) continue

      const candEmailAlertas = (candRecord.getString('email_alertas') || '').trim()

      // Deduplicação determinística por par (chave única independente da ordem: menor_maior)
      const id1 = animalId
      const id2 = candRecord.id
      const chavePar = id1 < id2 ? id1 + '_' + id2 : id2 + '_' + id1

      let jaAlertado = false
      try {
        const alertasExistentes = appInstance.findRecordsByFilter(
          'alertas',
          `par_chave = '${chavePar}'`,
          '-created',
          1,
          0,
        )
        if (alertasExistentes && alertasExistentes.length > 0) {
          jaAlertado = true
        }
      } catch (checkErr) {
        console.log('Erro ao consultar deduplicação de alertas:', checkErr.message)
      }

      if (jaAlertado) {
        console.log('Alerta ignorado (já enviado anteriormente para o par ' + chavePar + ')')
        continue
      }

      // Se o cadastro compatível não tiver email_alertas preenchido, não envia e-mail
      if (!candEmailAlertas) {
        console.log(
          'Candidato compatível ' + candRecord.id + ' não possui email_alertas cadastrado.',
        )
        continue
      }

      // 6. Preparação e envio do e-mail com visual limpo e respeitoso em pt-BR
      const linkDetalhes = 'https://reencontro-pets.goskip.app/animal/' + animalId
      const candCodigo = (candRecord.getString('codigo_secreto') || '').trim()
      const linkGestaoCand = candCodigo
        ? 'https://reencontro-pets.goskip.app/animal/' +
          candRecord.id +
          '?gestao=' +
          encodeURIComponent(candCodigo)
        : ''
      const tipoNovoRotulo =
        tipoRef === 'perdido' ? 'um animal perdido' : 'um animal encontrado ("Procura-se o dono")'
      const emailSubject =
        'Possível compatibilidade (' + pct + '%) encontrada para seu pet — Reencontro'

      const htmlBody =
        '<!DOCTYPE html>' +
        '<html lang="pt-BR">' +
        '<head><meta charset="utf-8"><title>Alerta de Compatibilidade — Reencontro</title></head>' +
        '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f2; color: #2b2b2b; margin: 0; padding: 24px;">' +
        '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e0d8; overflow: hidden;">' +
        '<tr><td style="background-color: #2d8f6f; padding: 24px; text-align: center; color: #ffffff;">' +
        '<h1 style="margin: 0; font-size: 22px; font-weight: bold;">Reencontro — Alerta de Compatibilidade</h1>' +
        '<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Avisamos você porque surgiu um novo cadastro parecido no site</p>' +
        '</td></tr>' +
        '<tr><td style="padding: 28px 24px;">' +
        '<p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">' +
        'Olá! Um novo animal acaba de ser cadastrado no sistema como <strong>' +
        tipoNovoRotulo +
        '</strong> e nossa análise identificou <strong>' +
        pct +
        '% de compatibilidade</strong> com o seu cadastro anterior.' +
        '</p>' +
        '<div style="background-color: #f4faf6; border: 1px solid #c7e6d7; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">' +
        '<div style="font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #2d8f6f; margin-bottom: 4px;">Índice de semelhança</div>' +
        '<div style="font-size: 32px; font-weight: 800; color: #2d8f6f;">' +
        pct +
        '%</div>' +
        '<div style="font-size: 13px; color: #555555; margin-top: 4px;">Espécie: <strong>' +
        especieRef +
        '</strong> • Local: <strong>' +
        refLocalFormatado +
        '</strong></div>' +
        '</div>' +
        (fotoRefUrl
          ? '<div style="text-align: center; margin: 20px 0;">' +
            '<p style="font-size: 13px; font-weight: bold; color: #6b6b6b; margin-bottom: 8px;">Foto do animal recém-cadastrado:</p>' +
            '<img src="' +
            fotoRefUrl +
            '" alt="Foto do animal recém-cadastrado" style="max-width: 280px; width: 100%; height: auto; border-radius: 12px; border: 2px solid #e5e0d8; object-fit: cover;" />' +
            '</div>'
          : '') +
        '<div style="text-align: center; margin: 28px 0 16px 0;">' +
        '<a href="' +
        linkDetalhes +
        '" target="_blank" style="background-color: #2d8f6f; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 14px 28px; border-radius: 10px; display: inline-block;">' +
        'Ver detalhes do animal no Reencontro &rarr;' +
        '</a>' +
        '</div>' +
        '<p style="font-size: 12px; color: #777777; text-align: center; margin: 16px 0 0 0;">' +
        'Link direto: <a href="' +
        linkDetalhes +
        '" style="color: #2d8f6f;">' +
        linkDetalhes +
        '</a>' +
        '</p>' +
        (linkGestaoCand
          ? '<div style="margin-top: 24px; padding: 14px; background-color: #faf7f2; border: 1px dashed #c7e6d7; border-radius: 10px; font-size: 12px; color: #555555; text-align: left;">' +
            '<strong>Link de gestão do seu anúncio:</strong> Guarde este link. Só ele permite alterar seu anúncio ou marcá-lo como reunido:<br/>' +
            '<a href="' +
            linkGestaoCand +
            '" style="color: #2d8f6f; word-break: break-all;">' +
            linkGestaoCand +
            '</a>' +
            '</div>'
          : '') +
        '</td></tr>' +
        '<tr><td style="background-color: #faf7f2; padding: 16px 24px; border-top: 1px solid #e5e0d8; font-size: 11px; color: #777777; text-align: center; line-height: 1.4;">' +
        'Você recebeu esta mensagem porque cadastrou seu e-mail para receber alertas no Reencontro. Seu e-mail não aparece no site nem é divulgado publicamente.' +
        '</td></tr>' +
        '</table></body></html>'

      let statusEnvio = 'enviado'
      let erroEnvio = ''

      try {
        const senderAddress =
          appInstance.settings().meta.senderAddress || 'no-reply@reencontro-pets.goskip.app'
        const senderName = appInstance.settings().meta.senderName || 'Reencontro Pets'

        const mailMessage = new MailerMessage({
          from: {
            address: senderAddress,
            name: senderName,
          },
          to: [{ address: candEmailAlertas }],
          subject: emailSubject,
          html: htmlBody,
        })

        appInstance.newMailClient().send(mailMessage)
        console.log(
          'Alerta enviado com sucesso para ' +
            candEmailAlertas +
            ' (par: ' +
            chavePar +
            ', ' +
            pct +
            '%)',
        )
      } catch (mailErr) {
        statusEnvio = 'erro'
        erroEnvio = mailErr.message || 'Erro desconhecido ao enviar e-mail'
        console.log('Falha ao enviar e-mail de alerta para ' + candEmailAlertas + ':', erroEnvio)
      }

      // 7. Gravar registro na nova coleção 'alertas'
      try {
        const recAlerta = new Record(colAlertas)
        recAlerta.set('origem_id', animalId)
        recAlerta.set('compativel_id', candRecord.id)
        recAlerta.set('porcentagem', pct)
        recAlerta.set('email_destinatario', candEmailAlertas)
        recAlerta.set('status', statusEnvio)
        if (erroEnvio) {
          recAlerta.set('erro', erroEnvio)
        }
        recAlerta.set('par_chave', chavePar)
        recAlerta.set('data_envio', new Date().toISOString())
        appInstance.save(recAlerta)
      } catch (saveAlertaErr) {
        console.log('Erro ao salvar registro na coleção alertas:', saveAlertaErr.message)
      }
    }
  } catch (errGeral) {
    console.log('Erro geral no processamento de alertas automáticos:', errGeral.message)
  }
}, 'animais')

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

/**
 * Endpoint POST /backend/v1/validar-codigo
 * Valida se um determinado codigo_secreto pertence ao animalId informado.
 * Nunca expõe o código nem dados sigilosos.
 * Retorna { valido: boolean, emailAlertas?: string, telefone?: string, whatsapp?: string } se válido
 */
routerAdd('POST', '/backend/v1/validar-codigo', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const animalId = (body.animalId || '').trim()
    const codigo = (body.codigo || '').trim()

    if (!animalId || !codigo) {
      return e.json(200, { valido: false })
    }

    let animal = null
    try {
      animal = $app.findRecordById('animais', animalId)
    } catch (_) {
      return e.json(200, { valido: false })
    }

    const codGravado = (animal.getString('codigo_secreto') || '').trim()
    if (!codGravado || codGravado !== codigo) {
      return e.json(200, { valido: false })
    }

    return e.json(200, {
      valido: true,
      telefone: animal.getString('telefone') || '',
      whatsapp: animal.getString('whatsapp') || '',
      emailAlertas: animal.getString('email_alertas') || '',
      tipo: animal.getString('tipo') || '',
      dataReencontro: animal.getString('data_reencontro') || '',
    })
  } catch (err) {
    console.log('Erro ao validar código secreto:', err.message)
    return e.json(500, { error: 'Erro ao validar código' })
  }
})

/**
 * Endpoint POST /backend/v1/gestao/marcar-reunido
 * Permite a quem cadastrou marcar o animal como reunido com a família
 * Exige animalId e codigo válidos.
 * Grava tipo = 'reunido' e data_reencontro = data atual (YYYY-MM-DD ou ISO).
 */
routerAdd('POST', '/backend/v1/gestao/marcar-reunido', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const animalId = (body.animalId || '').trim()
    const codigo = (body.codigo || '').trim()

    if (!animalId || !codigo) {
      return e.badRequestError('Animal ID e código secreto são obrigatórios.')
    }

    let animal = null
    try {
      animal = $app.findRecordById('animais', animalId)
    } catch (_) {
      return e.notFoundError('Animal não encontrado.')
    }

    const codGravado = (animal.getString('codigo_secreto') || '').trim()
    if (!codGravado || codGravado !== codigo) {
      return e.forbiddenError('Código de gestão inválido.')
    }

    // Grava tipo = 'reunido' e data_reencontro = data de hoje
    const hojeIso = new Date().toISOString()
    animal.set('tipo', 'reunido')
    animal.set('data_reencontro', hojeIso)
    $app.save(animal)

    return e.json(200, {
      sucesso: true,
      id: animal.id,
      tipo: 'reunido',
      data_reencontro: hojeIso,
    })
  } catch (err) {
    console.log('Erro ao marcar reunido via código de gestão:', err.message)
    return e.json(500, { error: 'Erro ao atualizar status do animal' })
  }
})

/**
 * Endpoint POST /backend/v1/gestao/editar-contato
 * Permite a quem cadastrou editar telefone, whatsapp e email_alertas
 * Exige animalId e codigo válidos.
 */
routerAdd('POST', '/backend/v1/gestao/editar-contato', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const animalId = (body.animalId || '').trim()
    const codigo = (body.codigo || '').trim()

    if (!animalId || !codigo) {
      return e.badRequestError('Animal ID e código secreto são obrigatórios.')
    }

    let animal = null
    try {
      animal = $app.findRecordById('animais', animalId)
    } catch (_) {
      return e.notFoundError('Animal não encontrado.')
    }

    const codGravado = (animal.getString('codigo_secreto') || '').trim()
    if (!codGravado || codGravado !== codigo) {
      return e.forbiddenError('Código de gestão inválido.')
    }

    if (body.telefone !== undefined) {
      animal.set('telefone', (body.telefone || '').trim())
    }
    if (body.whatsapp !== undefined) {
      animal.set('whatsapp', (body.whatsapp || '').trim())
    }
    if (body.emailAlertas !== undefined || body.email_alertas !== undefined) {
      const emailNovo =
        (body.emailAlertas !== undefined ? body.emailAlertas : body.email_alertas) || ''
      animal.set('email_alertas', emailNovo.trim())
    }

    $app.save(animal)

    return e.json(200, {
      sucesso: true,
      id: animal.id,
      telefone: animal.getString('telefone') || '',
      whatsapp: animal.getString('whatsapp') || '',
      emailAlertas: animal.getString('email_alertas') || '',
    })
  } catch (err) {
    console.log('Erro ao editar contato via código de gestão:', err.message)
    return e.json(500, { error: 'Erro ao atualizar contato' })
  }
})
