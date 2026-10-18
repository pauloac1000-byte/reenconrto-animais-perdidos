migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('animais')
      return // Coleção já existe (idempotente)
    } catch (_) {
      // Não existe, criar coleção
    }

    const collection = new Collection({
      name: 'animais',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['perdido', 'encontrado'],
          maxSelect: 1,
        },
        {
          name: 'foto',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
        },
        {
          name: 'especie',
          type: 'select',
          required: true,
          values: ['Cão', 'Gato', 'Ave', 'Coelho', 'Outro'],
          maxSelect: 1,
        },
        {
          name: 'porte',
          type: 'select',
          required: true,
          values: ['Pequeno', 'Médio', 'Grande'],
          maxSelect: 1,
        },
        {
          name: 'cor',
          type: 'text',
          required: true,
        },
        {
          name: 'caracteristicas',
          type: 'text',
          required: false,
        },
        {
          name: 'cidade',
          type: 'text',
          required: true,
        },
        {
          name: 'bairro',
          type: 'text',
          required: true,
        },
        {
          name: 'data',
          type: 'text',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
          required: false,
        },
        {
          name: 'telefone',
          type: 'text',
          required: false,
        },
        {
          name: 'whatsapp',
          type: 'text',
          required: false,
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
        'CREATE INDEX idx_animais_created ON animais (created DESC)',
        'CREATE INDEX idx_animais_tipo ON animais (tipo)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('animais')
      app.delete(collection)
    } catch (_) {}
  },
)
