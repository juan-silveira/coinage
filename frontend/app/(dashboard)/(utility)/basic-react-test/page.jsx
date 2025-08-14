import BasicReactTest from '@/examples/basic-react-test';

export default function BasicReactTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Teste Ultra-Básico - React
        </h1>
        <p className="text-gray-600">
          Esta página testa se o React está funcionando no nível mais básico.
          Se este teste não funcionar, há um problema fundamental no React ou na configuração.
        </p>
      </div>
      
      <BasicReactTest />
    </div>
  );
}
