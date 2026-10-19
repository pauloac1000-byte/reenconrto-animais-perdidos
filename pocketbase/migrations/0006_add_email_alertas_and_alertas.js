migrate(
  (app) => {
    // 1. Adicionar o campo 'email_alertas' na coleção 'animais' se não existir
    const colAnimais = app.findCollectionByNameOrId('animais')
    if (!colAnimais.fields.getByName('email_alertas')) {
      colAnimais.fields.add(
        new EmailField({
          name: 'email_alertas',
          required: false,
        }),
      )
      app.save(colAnimais)
    }

    // 2. Criar coleção 'alertas' de forma idempotente
    try {
      app.findCollectionByNameOrId('alertas')
      return // Coleção já existe
    } catch (_) {
      // Coleção não existe, prosseguir com criação
    }

    const animaisColId = colAnimais.id

    const colAlertas = new Collection({
      name: 'alertas',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'origem_id',
          type: 'relation',
          required: true,
          collectionId: animaisColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'compativel_id',
          type: 'relation',
          required: true,
          collectionId: animaisColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'porcentagem',
          type: 'number',
          required: false,
          min: 0,
          max: 100,
        },
        {
          name: 'data_envio',
          type: 'date',
          required: false,
        },
        {
          name: 'email_destinatario',
          type: 'email',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          values: ['enviado', 'erro'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'erro',
          type: 'text',
          required: false,
        },
        {
          name: 'par_chave',
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
        'CREATE INDEX idx_alertas_par_chave ON alertas (par_chave)',
        'CREATE INDEX idx_alertas_created ON alertas (created DESC)',
      ],
    })

    app.save(colAlertas)
  },
  (app) => {
    try {
      const colAlertas = app.findCollectionByNameOrId('alertas')
      app.delete(colAlertas)
    } catch (_) {}

    try {
      const colAnimais = app.findCollectionByNameOrId('animais')
      if (colAnimais.fields.getByName('email_alertas')) {
        colAnimais.fields.removeByName('email_alertas')
        app.save(colAnimais)
      }
    } catch (_) {}
  },
)
