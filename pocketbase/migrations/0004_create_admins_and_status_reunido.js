migrate(
  (app) => {
    // 1. Atualizar a coleção 'animais' para permitir o valor 'reunido' no campo select 'tipo'
    const colAnimais = app.findCollectionByNameOrId('animais')
    const tipoField = colAnimais.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['perdido', 'encontrado', 'reunido']
      tipoField.maxSelect = 1
    }
    app.save(colAnimais)

    // 2. Criar coleção 'admins' (tipo auth) se não existir
    let colAdmins
    try {
      colAdmins = app.findCollectionByNameOrId('admins')
    } catch (_) {
      colAdmins = new Collection({
        name: 'admins',
        type: 'auth',
        listRule: 'id = @request.auth.id',
        viewRule: 'id = @request.auth.id',
        createRule: null, // Apenas superuser cria novos admins via dashboard ou migration
        updateRule: 'id = @request.auth.id',
        deleteRule: null,
        fields: [
          {
            name: 'name',
            type: 'text',
            required: false,
          },
        ],
      })
      app.save(colAdmins)
      colAdmins = app.findCollectionByNameOrId('admins')
    }

    // 3. Criar usuário administrador inicial (admin@reencontro.app / Reencontro@2024) de forma idempotente
    try {
      app.findAuthRecordByEmail('admins', 'admin@reencontro.app')
      // Já existe, não recriar
    } catch (_) {
      const adminRecord = new Record(colAdmins)
      adminRecord.setEmail('admin@reencontro.app')
      adminRecord.setPassword('Reencontro@2024')
      adminRecord.setVerified(true)
      adminRecord.set('name', 'Administrador')
      app.save(adminRecord)
    }
  },
  (app) => {
    try {
      const adminRecord = app.findAuthRecordByEmail('admins', 'admin@reencontro.app')
      app.delete(adminRecord)
    } catch (_) {}

    try {
      const colAdmins = app.findCollectionByNameOrId('admins')
      app.delete(colAdmins)
    } catch (_) {}

    try {
      const colAnimais = app.findCollectionByNameOrId('animais')
      const tipoField = colAnimais.fields.getByName('tipo')
      if (tipoField) {
        tipoField.values = ['perdido', 'encontrado']
      }
      app.save(colAnimais)
    } catch (_) {}
  },
)
