"use client";
import { useEffect, useState } from 'react';

/**
 * Componente que só renderiza no cliente, evitando problemas de hidratação
 * Use para componentes que têm comportamentos diferentes no servidor e cliente
 */
const ClientOnly = ({ children, fallback = null }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return <>{children}</>;
};

export default ClientOnly;