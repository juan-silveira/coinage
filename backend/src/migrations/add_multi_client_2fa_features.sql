-- Migração para adicionar funcionalidades multi-client e 2FA
-- Execute este script no banco de dados PostgreSQL

-- 1. Adicionar campos ao modelo User para permissão de chaves privadas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_view_private_keys BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS private_key_access_level VARCHAR(20) DEFAULT 'own' NOT NULL
  CHECK (private_key_access_level IN ('none', 'own', 'client_users', 'all'));

COMMENT ON COLUMN users.can_view_private_keys IS 'Indica se o usuário pode visualizar chaves privadas de outros usuários';
COMMENT ON COLUMN users.private_key_access_level IS 'Nível de acesso às chaves privadas: none (nenhuma), own (próprias), client_users (usuários do mesmo client), all (todas)';

-- 2. Criar tabela de relacionamento User-Client
CREATE TABLE IF NOT EXISTS user_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL 
    CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  linked_at TIMESTAMP,
  roles JSONB DEFAULT '["USER"]' NOT NULL,
  permissions JSONB DEFAULT '{}' NOT NULL,
  metadata JSONB DEFAULT '{}',
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  last_access_at TIMESTAMP,
  access_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  
  UNIQUE(user_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_user_clients_user_id ON user_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clients_client_id ON user_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_user_clients_status ON user_clients(status);
CREATE INDEX IF NOT EXISTS idx_user_clients_user_status ON user_clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_clients_client_status ON user_clients(client_id, status);

COMMENT ON TABLE user_clients IS 'Relacionamento many-to-many entre usuários e clientes';
COMMENT ON COLUMN user_clients.status IS 'Status da vinculação: pending (aguardando confirmação), active (ativo), suspended (suspenso), rejected (rejeitado)';

-- 3. Criar tabela de 2FA
CREATE TABLE IF NOT EXISTS user_two_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('totp', 'sms', 'email', 'backup_codes')),
  secret TEXT,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT false NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  backup_codes JSONB,
  used_backup_codes JSONB DEFAULT '[]' NOT NULL,
  setup_completed_at TIMESTAMP,
  last_used_at TIMESTAMP,
  failed_attempts INTEGER DEFAULT 0 NOT NULL,
  locked_until TIMESTAMP,
  settings JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  
  UNIQUE(user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_user_two_factors_user_id ON user_two_factors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_two_factors_user_active ON user_two_factors(user_id, is_active);

COMMENT ON TABLE user_two_factors IS 'Configurações de autenticação em duas etapas dos usuários';
COMMENT ON COLUMN user_two_factors.type IS 'Tipo de 2FA: totp (Google Authenticator), sms, email, backup_codes';

-- 4. Criar tabela de branding de clientes
CREATE TABLE IF NOT EXISTS client_brandings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  primary_color VARCHAR(7) DEFAULT '#007bff' NOT NULL CHECK (primary_color ~ '^#[0-9A-F]{6}$'),
  secondary_color VARCHAR(7) CHECK (secondary_color ~ '^#[0-9A-F]{6}$'),
  accent_color VARCHAR(7) CHECK (accent_color ~ '^#[0-9A-F]{6}$'),
  background_color VARCHAR(7) DEFAULT '#ffffff' NOT NULL CHECK (background_color ~ '^#[0-9A-F]{6}$'),
  text_color VARCHAR(7) DEFAULT '#333333' NOT NULL CHECK (text_color ~ '^#[0-9A-F]{6}$'),
  logo_url TEXT,
  logo_url_dark TEXT,
  favicon_url TEXT,
  background_image_url TEXT,
  layout_style VARCHAR(20) DEFAULT 'default' NOT NULL 
    CHECK (layout_style IN ('default', 'centered', 'sidebar', 'fullscreen')),
  border_radius INTEGER DEFAULT 8 NOT NULL CHECK (border_radius >= 0 AND border_radius <= 50),
  font_family VARCHAR(100),
  font_size VARCHAR(10) DEFAULT 'medium' NOT NULL 
    CHECK (font_size IN ('small', 'medium', 'large')),
  login_title VARCHAR(100),
  login_subtitle VARCHAR(200),
  welcome_message TEXT,
  footer_text TEXT,
  support_url TEXT,
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  contact_email VARCHAR(255) CHECK (contact_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  custom_css TEXT,
  custom_js TEXT,
  allow_customization BOOLEAN DEFAULT true NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  deployed_at TIMESTAMP,
  deployed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_brandings_client_id ON client_brandings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_brandings_is_active ON client_brandings(is_active);

COMMENT ON TABLE client_brandings IS 'Configurações de branding personalizadas para cada cliente';

-- 5. Adicionar campo slug na tabela clients (se não existir)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Gerar slugs para clientes existentes
UPDATE clients 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '.', '')) 
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);

COMMENT ON COLUMN clients.slug IS 'Slug único para URLs personalizadas do cliente';

-- 6. Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Triggers para updated_at
CREATE TRIGGER update_user_clients_updated_at BEFORE UPDATE ON user_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_two_factors_updated_at BEFORE UPDATE ON user_two_factors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_brandings_updated_at BEFORE UPDATE ON client_brandings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Inserir dados padrão
-- Cliente Coinage (padrão para todos os usuários)
INSERT INTO clients (name, slug, description, is_active)
VALUES ('Coinage', 'coinage', 'Cliente padrão da plataforma Coinage', true)
ON CONFLICT (slug) DO NOTHING;

-- Vincular todos os usuários existentes ao cliente Coinage
DO $$
DECLARE
  coinage_client_id UUID;
  user_record RECORD;
BEGIN
  -- Buscar ID do cliente Coinage
  SELECT id INTO coinage_client_id FROM clients WHERE slug = 'coinage';
  
  -- Se encontrou o cliente Coinage
  IF coinage_client_id IS NOT NULL THEN
    -- Vincular todos os usuários ativos
    FOR user_record IN SELECT id FROM users WHERE is_active = true
    LOOP
      INSERT INTO user_clients (user_id, client_id, status, linked_at, approved_at)
      VALUES (user_record.id, coinage_client_id, 'active', NOW(), NOW())
      ON CONFLICT (user_id, client_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- 9. Atualizar usuários API_ADMIN para terem acesso total às chaves privadas
UPDATE users 
SET can_view_private_keys = true, 
    private_key_access_level = 'all'
WHERE is_api_admin = true 
   OR roles @> '["API_ADMIN"]';

-- Commit das alterações
COMMIT;