"use client";
import dynamic from 'next/dynamic';

/**
 * Componente que força renderização apenas no cliente
 * Resolve definitivamente problemas de hidratação
 */
const NoSSR = dynamic(() => Promise.resolve(({ children }) => <>{children}</>), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Carregando sistema...</p>
      </div>
    </div>
  )
});

export default NoSSR;