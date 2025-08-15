import React, { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/ui/Icon";

const Alert = ({
  children,
  className = "alert-dark",
  icon,
  toggle,
  dismissible,
  label,
  autoClose = 5000, // Auto-close após 5 segundos por padrão
  hideProgressBar = false,
  pauseOnHover = true,
}) => {
  const [isShow, setIsShow] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(autoClose);
  const totalTimeRef = useRef(autoClose);

  const handleDestroy = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsShow(false);
      if (toggle) toggle();
    }, 300); // Tempo da animação de saída
  };

  const startTimer = () => {
    if (autoClose && autoClose > 0) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        handleDestroy();
      }, remainingTimeRef.current);
    }
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  };

  const resumeTimer = () => {
    if (remainingTimeRef.current > 0) {
      // Recalcular o progresso atual para continuar de onde parou
      const timeSpent = totalTimeRef.current - remainingTimeRef.current;
      const currentProgress = Math.max(0, 100 - (timeSpent / totalTimeRef.current) * 100);
      setProgress(currentProgress);
      
      startTimer();
    }
  };

  useEffect(() => {
    if (autoClose && autoClose > 0 && !isPaused) {
      startTimer();

      // Atualizar progress bar usando requestAnimationFrame para animação fluida
      let animationId;
      const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const timeSpent = totalTimeRef.current - remainingTimeRef.current + elapsed;
        const newProgress = Math.max(0, 100 - (timeSpent / totalTimeRef.current) * 100);
        
        // Só atualizar se mudou significativamente (reduz re-renders)
        setProgress(prev => {
          const diff = Math.abs(prev - newProgress);
          return diff > 0.1 ? newProgress : prev;
        });

        if (newProgress > 0 && !isPaused) {
          animationId = requestAnimationFrame(updateProgress);
        }
      };

      if (!isPaused) {
        animationId = requestAnimationFrame(updateProgress);
      }

      return () => {
        clearTimeout(timerRef.current);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [autoClose, isPaused]);

  const handleMouseEnter = () => {
    if (pauseOnHover && !isPaused) {
      setIsPaused(true);
      pauseTimer();
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && isPaused) {
      setIsPaused(false);
      resumeTimer();
    }
  };

  return (
    <>
      {isShow ? (
        <div 
          className={`alert ${className} relative overflow-hidden transition-all duration-300 ease-in-out transform ${
            isClosing 
              ? 'translate-x-full opacity-0 scale-95' 
              : 'translate-x-0 opacity-100 scale-100'
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-start space-x-3 rtl:space-x-reverse relative z-10">
            {icon && (
              <div className="flex-0 text-[22px]">
                <Icon icon={icon} />
              </div>
            )}
            <div className="flex-1">{children ? children : label}</div>
            {(dismissible || toggle) && (
              <div
                className="flex-0 text-2xl cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => {
                  if (toggle) {
                    handleDestroy();
                  } else if (dismissible) {
                    handleDestroy();
                  }
                }}
              >
                <Icon icon="heroicons-outline:x" />
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {autoClose && autoClose > 0 && !hideProgressBar && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20">
              <div 
                className="h-full bg-current will-change-transform"
                style={{ 
                  width: `${progress}%`,
                  opacity: isPaused ? 0.5 : 1,
                  transition: isPaused ? 'opacity 0.2s ease' : 'opacity 0.2s ease'
                }}
              />
            </div>
          )}
        </div>
      ) : null}
    </>
  );
};

export default Alert;
