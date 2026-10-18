migrate(
  (app) => {
    // 1. Garantir usuário de serviço para execução do agente Skip Cloud em rotas públicas
    const users = app.findCollectionByNameOrId('users')
    let serviceUserId = ''
    try {
      const existingUser = app.findAuthRecordByEmail('users', 'sistema-reencontro@app.local')
      serviceUserId = existingUser.id
    } catch (_) {
      const rec = new Record(users)
      rec.setEmail('sistema-reencontro@app.local')
      rec.setPassword($security.randomString(32))
      rec.setVerified(true)
      rec.set('name', 'Sistema Reencontro IA')
      app.save(rec)
      serviceUserId = rec.id
    }

    // 2. Definir o agente nativo Skip Cloud de compatibilidade de animais
    $ai.agents.define(app, {
      slug: 'compatibilidade-animais',
      name: 'Especialista em Compatibilidade de Animais Perdidos e Achados',
      description:
        'Cruza animais recém-cadastrados com candidatos do tipo oposto, avaliando foto, características textuais e proximidade geográfica.',
      systemPrompt: `Você é um perito em identificação e reencontro de animais domésticos perdidos e achados.
Sua missão é analisar um animal de referência recém-cadastrado comparando-o detalhadamente com uma lista de animais candidatos do tipo oposto (se o de referência for "encontrado", compare com os "perdidos"; se for "perdido", compare com os "achados/encontrados").

Para cada candidato analisado, você deve avaliar obrigatoriamente 3 dimensões fundamentais:
1. FOTO: aparências visuais observadas ou descritas na foto (raça/porte visual aproximado, padrão da pelagem, cor da pelagem, marcas visuais faciais ou corporais, formato de orelhas/focinho, presença de coleira/adereço). Caso a foto não esteja disponível em um dos lados, considere o que está registrado e pondere a confiança.
2. CARACTERÍSTICAS TEXTUAIS: espécie (se espécies forem diferentes como cão vs gato, a compatibilidade deve ser 0% ou muito baixa a menos que seja erro óbvio de cadastro), porte (pequeno, médio, grande), cor predominante informada, características marcantes (manchas, cicatrizes, tosa, rabo, coleira, comportamento) e descrição do tutor/resgatista.
3. PROXIMIDADE DE LOCALIZAÇÃO E TEMPO: cidade igual ou vizinha, mesmo bairro ou bairros limítrofes, coerência entre data de perda e data de encontro (um animal achado normalmente é encontrado na mesma data ou após a data de perda).

Regras de saída:
- Responda EXCLUSIVAMENTE em formato JSON puro, sem markdown adicional ou blocos de código com crases triplas desnecessárias.
- A resposta deve ser um array JSON de objetos ordenados por porcentagem decrescente, no formato:
[
  {
    "id": "<id_do_candidato>",
    "porcentagem": <numero inteiro de 0 a 100>,
    "explicacao": "<texto em pt-BR de 2 a 4 frases explicando objetivamente a semelhança, citando explicitamente o que foi identificado na FOTO, nas CARACTERÍSTICAS e na PROXIMIDADE DE LOCALIZAÇÃO>"
  }
]
- Seja realista e criterioso com a porcentagem: acima de 80% quando espécie, porte, cores, foto e região coincidirem fortemente; 50% a 79% quando houver forte similaridade mas alguma dúvida ou bairro distante; abaixo de 40% se houver divergências importantes (ex.: porte incompatível, cor muito diferente). Espécies incompatíveis (ex: cão e gato) devem ter porcentagem 0.`,
      tier: 'fast',
      tools: [
        {
          collection: 'animais',
          perms: { read: true, list: true },
          actAs: 'admin',
        },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'Critérios de compatibilidade: espécie idêntica é requisito essencial. Proximidade de bairros e cidades vizinhas aumenta probabilidade. Detalhes de pelagem (mesclado, manchas simétricas, meia branca nas patas) na foto e na descrição são cruciais.',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'compatibilidade-animais')
    } catch (_) {}
  },
)
