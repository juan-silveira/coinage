import SimpleStateTest from '@/examples/simple-state-test';

export default function SimpleStateTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Teste Simples de Estado - React
        </h1>
        <p className="text-gray-600">
          Esta página testa se o React está funcionando corretamente com useState e useEffect.
          Se este teste não funcionar, há um problema fundamental no React.
        </p>
      </div>
      
      <SimpleStateTest />
    </div>
  );
}
