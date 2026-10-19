migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('animais')

    // 1. Adicionar campo 'uf' se não existir
    if (!col.fields.getByName('uf')) {
      col.fields.add(
        new TextField({
          name: 'uf',
          required: false,
        }),
      )
    }

    // O campo 'cidade' já existe como text na coleção (definido em 0001_create_animais.js).
    // Garantimos que não seja required no nível da schema ou continue text opcional/obrigatório
    const cidadeField = col.fields.getByName('cidade')
    if (cidadeField) {
      cidadeField.required = false
    }

    app.save(col)

    // 2. Migrar os cadastros existentes:
    // Analisar valores antigos de 'cidade' (ex.: "Amparo SP", "São Paulo/SP", "Curitiba - PR", "Campinas, SP")
    // e preencher 'cidade' e 'uf' separadamente.
    const records = app.findRecordsByFilter('animais', 'id != ""', 'created', 0, 0)
    const UFS_VALIDAS = new Set([
      'AC',
      'AL',
      'AP',
      'AM',
      'BA',
      'CE',
      'DF',
      'ES',
      'GO',
      'MA',
      'MT',
      'MS',
      'MG',
      'PA',
      'PB',
      'PR',
      'PE',
      'PI',
      'RJ',
      'RN',
      'RS',
      'RO',
      'RR',
      'SC',
      'SP',
      'SE',
      'TO',
    ])

    for (let i = 0; i < records.length; i++) {
      const rec = records[i]
      const ufAtual = (rec.getString('uf') || '').trim()
      const cidadeRaw = (rec.getString('cidade') || '').trim()

      // Se já tem UF válida preenchida, não sobrescreve
      if (ufAtual && UFS_VALIDAS.has(ufAtual.toUpperCase())) {
        continue
      }

      if (!cidadeRaw) {
        continue
      }

      // Tenta extrair UF e Cidade de formatos comuns:
      // Ex: "Amparo SP", "Amparo - SP", "Amparo/SP", "Amparo, SP", "Amparo-SP", "Amparo - S.P."
      let parsedCidade = cidadeRaw
      let parsedUf = ''

      // Regex para encontrar sigla de UF no final do texto (com possíveis separadores /, -, vírgula, espaços, pontos)
      const match = cidadeRaw.match(/^(.*?)(?:[\s,/\-]+)+([A-Za-z]\.?\s*[A-Za-z]\.?)$/)

      if (match) {
        const possivelUf = match[2].replace(/[^A-Za-z]/g, '').toUpperCase()
        if (UFS_VALIDAS.has(possivelUf)) {
          parsedUf = possivelUf
          parsedCidade = match[1].replace(/[\s,/\-]+$/, '').trim()
        }
      }

      // Se não encontrou UF pelo regex acima, verifica se termina com " SP" ou similar
      if (!parsedUf) {
        const tokens = cidadeRaw.split(/\s+/)
        if (tokens.length >= 2) {
          const ultimoToken = tokens[tokens.length - 1].replace(/[^A-Za-z]/g, '').toUpperCase()
          if (UFS_VALIDAS.has(ultimoToken)) {
            parsedUf = ultimoToken
            parsedCidade = tokens
              .slice(0, tokens.length - 1)
              .join(' ')
              .replace(/[\s,/\-]+$/, '')
              .trim()
          }
        }
      }

      // Salva se conseguimos parsear ou atualiza cidade limpa
      if (parsedUf) {
        rec.set('uf', parsedUf)
        rec.set('cidade', parsedCidade || cidadeRaw)
        app.save(rec)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('animais')
      if (col.fields.getByName('uf')) {
        col.fields.removeByName('uf')
        app.save(col)
      }
    } catch (_) {}
  },
)
