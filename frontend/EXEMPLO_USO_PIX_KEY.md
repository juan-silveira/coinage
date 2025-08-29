# Como Usar o Sistema de PIX Keys

## 1. Como Página Standalone

```jsx
// Em qualquer página de saque, depósito ou transferência
import PixKeyPage from '@/app/(dashboard)/withdraw/pix-key/page';

// Usar diretamente
<PixKeyPage />
```

## 2. Como Componente Reutilizável

```jsx
import PixKeyForm from '@/components/shared/PixKeyForm';

function MinhaTelaFinanceira() {
  const handlePixKeySuccess = (pixKey) => {
    console.log('Chave PIX cadastrada:', pixKey);
    // Fazer algo com a chave cadastrada
  };

  return (
    <div>
      <h1>Configuração Financeira</h1>
      
      <PixKeyForm
        mode="transfer" // 'withdraw', 'deposit', 'transfer'
        onSuccess={handlePixKeySuccess}
        onCancel={() => console.log('Cancelado')}
        showTitle={true}
      />
    </div>
  );
}
```

## 3. Como Modal

```jsx
import { useState } from 'react';
import PixKeyModal from '@/components/modals/PixKeyModal';
import Button from '@/components/ui/Button';

function MinhaTelaComModal() {
  const [showPixKeyModal, setShowPixKeyModal] = useState(false);

  const handlePixKeyAdded = (pixKey) => {
    console.log('Nova chave PIX:', pixKey);
    // Processar a nova chave
  };

  return (
    <div>
      <Button onClick={() => setShowPixKeyModal(true)}>
        Adicionar Chave PIX
      </Button>

      <PixKeyModal
        isOpen={showPixKeyModal}
        onClose={() => setShowPixKeyModal(false)}
        onSuccess={handlePixKeyAdded}
        mode="withdraw"
      />
    </div>
  );
}
```

## 4. Com Hook Personalizado

```jsx
import usePixKeys from '@/hooks/usePixKeys';

function GerenciadorDePixKeys() {
  const {
    pixKeys,
    loading,
    addPixKey,
    removePixKey,
    setDefaultPixKey,
    getDefaultPixKey
  } = usePixKeys();

  const defaultKey = getDefaultPixKey();

  return (
    <div>
      <h2>Minhas Chaves PIX</h2>
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div>
          <p>Chave padrão: {defaultKey?.keyValue}</p>
          
          <ul>
            {pixKeys.map(key => (
              <li key={key.id}>
                {key.keyType}: {key.keyValue}
                <button onClick={() => removePixKey(key.id)}>Remover</button>
                <button onClick={() => setDefaultPixKey(key.id)}>
                  Tornar Padrão
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## 5. Integração em Fluxo de Saque

```jsx
import { useState } from 'react';
import usePixKeys from '@/hooks/usePixKeys';
import PixKeyModal from '@/components/modals/PixKeyModal';

function TelaDeSaque() {
  const { pixKeys, getDefaultPixKey } = usePixKeys();
  const [showAddPixKey, setShowAddPixKey] = useState(false);
  const defaultKey = getDefaultPixKey();

  const handleWithdraw = () => {
    if (!defaultKey) {
      setShowAddPixKey(true);
      return;
    }
    
    // Processar saque com a chave PIX padrão
    console.log('Processando saque para:', defaultKey);
  };

  return (
    <div>
      <h1>Realizar Saque</h1>
      
      {defaultKey ? (
        <div>
          <p>Chave PIX: {defaultKey.keyValue}</p>
          <p>Banco: {defaultKey.bankName}</p>
          <button onClick={handleWithdraw}>Confirmar Saque</button>
          <button onClick={() => setShowAddPixKey(true)}>
            Usar Outra Chave
          </button>
        </div>
      ) : (
        <div>
          <p>Você precisa cadastrar uma chave PIX</p>
          <button onClick={() => setShowAddPixKey(true)}>
            Cadastrar Chave PIX
          </button>
        </div>
      )}

      <PixKeyModal
        isOpen={showAddPixKey}
        onClose={() => setShowAddPixKey(false)}
        onSuccess={() => {
          setShowAddPixKey(false);
          // Recarregar chaves PIX
        }}
        mode="withdraw"
      />
    </div>
  );
}
```

## Propriedades do Componente

### PixKeyForm
- `mode`: 'withdraw' | 'deposit' | 'transfer' - Contexto de uso
- `onSuccess`: (pixKey) => void - Callback quando cadastrado com sucesso
- `onCancel`: () => void - Callback ao cancelar
- `showTitle`: boolean - Mostrar ou não o título
- `className`: string - Classes CSS adicionais

### PixKeyModal
- `isOpen`: boolean - Controle de abertura/fechamento
- `onClose`: () => void - Callback ao fechar
- `onSuccess`: (pixKey) => void - Callback quando cadastrado
- `mode`: 'withdraw' | 'deposit' | 'transfer' - Contexto

### Hook usePixKeys
- `pixKeys`: Array de chaves PIX
- `loading`: Estado de carregamento
- `error`: Erro se houver
- `loadPixKeys()`: Recarregar chaves
- `addPixKey(data)`: Adicionar nova chave
- `removePixKey(id)`: Remover chave
- `setDefaultPixKey(id)`: Definir como padrão
- `getDefaultPixKey()`: Obter chave padrão

## Dados da Chave PIX

```javascript
{
  id: '123',
  keyType: 'cpf', // 'cpf', 'email', 'phone', 'random'
  keyValue: '12345678901',
  bankCode: '341',
  bankName: 'Itaú',
  bankLogo: 'https://...',
  agency: '0001',
  agencyDigit: '2',
  accountNumber: '12345',
  accountDigit: '6',
  accountType: 'corrente', // 'corrente', 'poupanca', 'pagamentos', 'salario'
  holderName: 'João Silva',
  holderDocument: '12345678901',
  isDefault: true,
  isVerified: true,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z'
}
```