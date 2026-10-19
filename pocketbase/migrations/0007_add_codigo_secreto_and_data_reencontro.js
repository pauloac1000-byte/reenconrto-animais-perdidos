migrate(
  (app) => {
    const colAnimais = app.findCollectionByNameOrId('animais')

    // 1. Campo 'codigo_secreto' (texto para chave de gestão sem conta)
    if (!colAnimais.fields.getByName('codigo_secreto')) {
      colAnimais.fields.add(
        new TextField({
          name: 'codigo_secreto',
          required: false,
        }),
      )
    }

    // 2. Campo 'data_reencontro' (data do reencontro do pet)
    if (!colAnimais.fields.getByName('data_reencontro')) {
      colAnimais.fields.add(
        new DateField({
          name: 'data_reencontro',
          required: false,
        }),
      )
    }

    app.save(colAnimais)

    // Preencher codigo_secreto para registros existentes que eventualmente não possuam
    try {
      const semCodigo = app.findRecordsByFilter(
        'animais',
        'codigo_secreto = "" || codigo_secreto = null',
        'created',
        0,
        0,
      )
      for (let i = 0; i < semCodigo.length; i++) {
        const rec = semCodigo[i]
        rec.set('codigo_secreto', $security.randomString(24))
        app.save(rec)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const colAnimais = app.findCollectionByNameOrId('animais')
      if (colAnimais.fields.getByName('codigo_secreto')) {
        colAnimais.fields.removeByName('codigo_secreto')
      }
      if (colAnimais.fields.getByName('data_reencontro')) {
        colAnimais.fields.removeByName('data_reencontro')
      }
      app.save(colAnimais)
    } catch (_) {}
  },
)
