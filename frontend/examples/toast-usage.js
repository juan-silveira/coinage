// Exemplo de uso do react-toastify com o hook useToast

import useToast from '@/hooks/useToast';

// Exemplo de componente usando toasts
const ExampleComponent = () => {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showLoading, 
    hideToast 
  } = useToast();

  const handleSuccess = () => {
    showSuccess('Operação realizada com sucesso!');
  };

  const handleError = () => {
    showError('Erro ao realizar operação');
  };

  const handleWarning = () => {
    showWarning('Atenção! Esta ação não pode ser desfeita.');
  };

  const handleInfo = () => {
    showInfo('Informação importante para o usuário');
  };

  const handleLoading = async () => {
    const loadingToast = showLoading('Processando...');
    
    // Simular operação assíncrona
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    hideToast(); // Fecha o toast de loading
    showSuccess('Processamento concluído!');
  };

  const handleCustomToast = () => {
    // Usar o objeto toast diretamente para casos especiais
    const { toast } = useToast();
    
    toast('Mensagem customizada', {
      position: "bottom-center",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  return (
    <div className="space-y-4">
      <button onClick={handleSuccess} className="btn btn-success">
        Mostrar Sucesso
      </button>
      
      <button onClick={handleError} className="btn btn-danger">
        Mostrar Erro
      </button>
      
      <button onClick={handleWarning} className="btn btn-warning">
        Mostrar Aviso
      </button>
      
      <button onClick={handleInfo} className="btn btn-info">
        Mostrar Info
      </button>
      
      <button onClick={handleLoading} className="btn btn-primary">
        Mostrar Loading
      </button>
      
      <button onClick={handleCustomToast} className="btn btn-secondary">
        Toast Customizado
      </button>
    </div>
  );
};

export default ExampleComponent;

/*
OPÇÕES DISPONÍVEIS NO REACT-TOASTIFY:

position: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left"
autoClose: number | false (em milissegundos)
hideProgressBar: boolean
closeOnClick: boolean
pauseOnFocusLoss: boolean
draggable: boolean
pauseOnHover: boolean
theme: "light" | "dark" | "colored"
type: "default" | "success" | "info" | "warning" | "error"
rtl: boolean
newestOnTop: boolean

EXEMPLOS DE USO:

// Toast simples
showSuccess('Mensagem de sucesso');

// Toast com opções customizadas
showError('Erro crítico', {
  autoClose: 10000,
  position: "top-center",
  theme: "colored"
});

// Toast de loading que não fecha automaticamente
const loadingToast = showLoading('Carregando dados...');
// ... fazer operação ...
hideToast(); // Fechar manualmente

// Toast com progresso customizado
showInfo('Processando...', {
  autoClose: false,
  closeButton: false
});
*/
