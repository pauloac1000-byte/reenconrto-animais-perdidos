migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('animais')

    if (!col.fields.getByName('nome_pessoa')) {
      col.fields.add(
        new TextField({
          name: 'nome_pessoa',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('nome_pet')) {
      col.fields.add(
        new TextField({
          name: 'nome_pet',
          required: false,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('animais')
      col.fields.removeByName('nome_pessoa')
      col.fields.removeByName('nome_pet')
      app.save(col)
    } catch (_) {}
  },
)
