migrate(
  (app) => {
    // 1. Adicionar o campo 'detalhe_confirmacao' na coleção 'animais' se não existir
    const colAnimais = app.findCollectionByNameOrId('animais')
    if (!colAnimais.fields.getByName('detalhe_confirmacao')) {
      colAnimais.fields.add(
        new TextField({
          name: 'detalhe_confirmacao',
          required: false,
        }),
      )
      app.save(colAnimais)
    }

    // 2. Criar coleção 'denuncias' de forma idempotente, com regras de API bloqueadas (null)
    try {
      app.findCollectionByNameOrId('denuncias')
      return // Coleção já existe
    } catch (_) {
      // Coleção não existe, prosseguir com criação
    }

    const animaisColId = colAnimais.id

    const colDenuncias = new Collection({
      name: 'denuncias',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'animal_id',
          type: 'relation',
          required: true,
          collectionId: animaisColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'motivo',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          values: ['nova', 'analisada', 'descartada'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_denuncias_animal ON denuncias (animal_id)',
        'CREATE INDEX idx_denuncias_status ON denuncias (status)',
        'CREATE INDEX idx_denuncias_created ON denuncias (created DESC)',
      ],
    })

    app.save(colDenuncias)
  },
  (app) => {
    try {
      const colDenuncias = app.findCollectionByNameOrId('denuncias')
      app.delete(colDenuncias)
    } catch (_) {}

    try {
      const colAnimais = app.findCollectionByNameOrId('animais')
      if (colAnimais.fields.getByName('detalhe_confirmacao')) {
        colAnimais.fields.removeByName('detalhe_confirmacao')
        app.save(colAnimais)
      }
    } catch (_) {}
  },
)
