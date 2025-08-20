# Projeto Coinage - Memória do Projeto

## Visão Geral
Sistema financeiro com funcionalidades de depósito e saque (withdraw).

## Estrutura do Projeto

### Backend
- **Localização**: `/backend`
- **Tecnologia**: Node.js
- **Arquivos principais**:
  - Controllers: `src/controllers/` (deposit.controller.js)
  - Routes: `src/routes/` (deposit.routes.js)
  - Workers: `src/workers/` (deposit.worker.js)
  - Package: `package-worker.json`

### Frontend
- **Localização**: `/frontend`
- **Tecnologia**: Next.js/React
- **Estrutura de páginas**:
  - Dashboard: `app/(dashboard)/`
  - Deposit: `app/(dashboard)/deposit/`
  - PIX: `app/(dashboard)/deposit/pix/[payment_id]/`
- **Componentes**: `components/partials/deposit/`
- **Services**: `services/` (mockDepositService.js)

## Branch Atual
- **Branch de trabalho**: 004-withdraw
- **Branch principal**: main (usado para PRs)

## Funcionalidades Implementadas ✅
- Sistema de depósito com PIX
- Sistema de saque (withdraw) com PIX
- Dashboard com controle por roles/permissões
- Sistema de confirmação de email completo
- Templates de email profissionais (22 templates)
- Sistema de logs estruturados (Winston)
- Health checks para todos os serviços
- Autenticação JWT completa
- Páginas Transfer e Exchange (frontend)
- Collections Postman organizadas (20 collections)
- **Sistema de fotos de perfil com armazenamento local (IndexedDB)**

## Status Atual - Sistema 90% Completo 🚀
- **Backend API**: ✅ Funcionando (http://localhost:8800)
- **Frontend**: ✅ Funcionando (http://localhost:3000)
- **Docker**: ✅ Todos containers funcionando
- **Banco PostgreSQL**: ✅ Funcionando (porta 5433)
- **Redis/RabbitMQ/MinIO**: ✅ Funcionando

## Commits Recentes
- Resolução de erros de inicialização do servidor
- Consolidação das collections Postman
- Correção de problemas do container Docker
- Implementação completa do sistema de email
- Implementação da tela de saque

## Observações
- O projeto usa workers para processar operações assíncronas
- Sistema de mock para desenvolvimento do frontend
- **Collections Postman consolidadas em `/backend/postman/`**
- **Email providers em modo mock temporariamente para Docker**
- **Sistema totalmente operacional para desenvolvimento**

## Usuário Padrão
- ivan.alberton@navi.inf.br
- senha: N@vi@2025

## Portas de Acesso

### Localhost (localhost:)
- **3000**: Frontend (Next.js - desenvolvimento local)
- **8800**: Backend API (Node.js - Docker)
- **5433**: PostgreSQL Database (Docker)
- **6379**: Redis (Docker - se configurado)

## Credenciais de Acesso

### Usuário de Teste
- **Email**: ivan.alberton@navi.inf.br
- **Senha**: N@vi@2025
- **Perfil**: Administrador

### Banco de Dados (PostgreSQL)
- **Host**: localhost
- **Porta**: 5433
- **Database**: coinage
- **User**: (verificar .env)
- **Password**: (verificar .env)

## URLs de Desenvolvimento
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8800
- **API Docs**: http://localhost:8800/api-docs (se configurado)

## Rotinas para fazer antes de testar
- **Derrubar, buildar e iniciar containers**: docker compose down && docker compose build backend && docker compose up -d
- **Se zerar o banco de dados**: usar o seed-basic-data.js dentro de /backend/scripts para iniciar a base de dados
- **Buildar e iniciar frontend**: yarn build && yarn dev

## 📸 Sistema de Fotos de Perfil

### Implementação Atual (IndexedDB - Local)
- **Service**: `/frontend/services/imageStorage.service.js`
- **Modal**: `/frontend/components/ui/PhotoUploadModal.jsx`
- **Avatar**: `/frontend/components/ui/UserAvatar.jsx`
- **Armazenamento**: IndexedDB do navegador (database: `CoinageImages`)
- **Benefícios**: Sem CORS, rápido, offline-ready

### 🚀 Migração Futura para Amazon S3

#### 1. Backend - Criar serviço S3
```javascript
// backend/src/services/s3.service.js
const AWS = require('aws-sdk');

class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    this.bucket = process.env.S3_BUCKET_NAME;
  }

  async uploadProfilePhoto(userId, fileBuffer, filename, contentType) {
    const key = `profile-photos/${userId}/${Date.now()}-${filename}`;
    
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read'
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async deleteProfilePhoto(userId, photoKey) {
    const params = {
      Bucket: this.bucket,
      Key: photoKey
    };
    
    return await this.s3.deleteObject(params).promise();
  }
}
```

#### 2. Backend - Endpoint para upload
```javascript
// backend/src/routes/profile.routes.js
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    
    // Upload para S3
    const photoUrl = await s3Service.uploadProfilePhoto(
      userId, 
      file.buffer, 
      file.originalname, 
      file.mimetype
    );
    
    // Salvar URL no banco
    await User.update({ profilePhotoUrl: photoUrl }, { where: { id: userId } });
    
    res.json({ success: true, data: { url: photoUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

#### 3. Frontend - Atualizar PhotoUploadModal
```javascript
// Substituir o método handleUpload atual por:
const handleUpload = async () => {
  if (!file || !user?.id) {
    showError('Selecione uma foto para enviar');
    return;
  }

  setIsUploading(true);

  try {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await api.post('/api/profile/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success) {
      showSuccess('Foto de perfil atualizada com sucesso!');
      setProfilePhotoUrl(response.data.data.url);
      
      // Remover da storage local se existir
      await imageStorageService.removeProfileImage(user.id);
      
      if (onPhotoUploaded) {
        onPhotoUploaded(response.data.data.url);
      }
      handleClose();
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    showError('Erro ao enviar foto. Tente novamente.');
  } finally {
    setIsUploading(false);
  }
};
```

#### 4. Frontend - Atualizar UserAvatar
```javascript
// Modificar o useEffect para priorizar URLs do S3:
useEffect(() => {
  const loadProfilePhoto = async () => {
    if (!user?.id) return;

    try {
      // Primeiro: tentar carregar do backend (S3)
      const response = await api.get('/api/profile/simple-photo');
      if (response.data.success && response.data.data.url) {
        setProfilePhotoUrl(response.data.data.url);
        // Remover versão local se houver
        await imageStorageService.removeProfileImage(user.id);
        return;
      }

      // Fallback: usar storage local
      const localImage = await imageStorageService.getProfileImage(user.id);
      if (localImage?.dataUrl) {
        setProfilePhotoUrl(localImage.dataUrl);
      }
    } catch (error) {
      console.log('Error loading profile photo:', error);
    }
  };

  if (user?.id && !profilePhotoUrl) {
    loadProfilePhoto();
  }
}, [user?.id, setProfilePhotoUrl]);
```

#### 5. Variáveis de Ambiente (.env)
```env
# S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=coinage-profile-photos
```

#### 6. Dependências Necessárias
```bash
# Backend
npm install aws-sdk multer

# Configurar CORS para S3 no bucket
```

### 📋 Checklist de Migração S3
- [ ] Configurar bucket S3 com permissões
- [ ] Instalar dependências AWS SDK
- [ ] Criar serviço S3 no backend
- [ ] Implementar endpoint de upload
- [ ] Atualizar PhotoUploadModal
- [ ] Atualizar UserAvatar  
- [ ] Configurar variáveis de ambiente
- [ ] Testar upload e visualização
- [ ] Migrar fotos existentes (opcional)
- [ ] Limpar storage local após migração