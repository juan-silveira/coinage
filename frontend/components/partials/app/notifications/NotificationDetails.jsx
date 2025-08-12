import React from "react";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";

const NotificationDetails = ({ notification, onClose, onMarkAsRead, onMarkAsUnread, onToggleFavorite, onDelete }) => {
  if (!notification) return null;

  const { id, isRead, sender, title, message, createdAt, isFavorite } = notification;

  return (
    <div className="absolute left-0 top-0 w-full h-full bg-white dark:bg-slate-800 z-[55] rounded-md p-6 overflow-y-auto">
      {/* Header com botões de ação */}
      <div className="flex items-center border-b border-slate-100 dark:border-slate-700 -mx-6 pb-6 mb-6 px-6">
        <div className="flex-1">
          <Tooltip content="Voltar" placement="top" arrow>
            <button
              className="email-icon"
              type="button"
              onClick={onClose}
            >
              <Icon icon="heroicons-outline:arrow-left" />
            </button>
          </Tooltip>
        </div>
        <div className="flex-none flex items-center space-x-4 rtl:space-x-reverse">
          <Tooltip placement="top" arrow content={isRead ? "Marcar como não lida" : "Marcar como lida"}>
            <button 
              className={`email-icon ${isRead ? 'text-green-600' : 'text-gray-400'}`}
              type="button"
              onClick={() => {
                if (isRead) {
                  onMarkAsUnread(id);
                } else {
                  onMarkAsRead(id);
                }
              }}
            >
              <Icon icon={isRead ? "heroicons-solid:check-circle" : "heroicons-outline:eye-off"} />
            </button>
          </Tooltip>
          <Tooltip placement="top" arrow content={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
            <button 
              className={`email-icon ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
              onClick={() => onToggleFavorite(id)}
            >
              <Icon icon={isFavorite ? "heroicons-solid:star" : "heroicons-outline:star"} />
            </button>
          </Tooltip>
          <Tooltip placement="top" arrow content="Excluir">
            <button 
              className="email-icon text-red-500 hover:text-red-700"
              onClick={() => onDelete(id)}
            >
              <Icon icon="heroicons-outline:trash" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Conteúdo da notificação */}
      <div>
        {/* Título */}
        <div className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-4">
          {title}
        </div>

        {/* Informações do sender */}
        <div className="flex space-x-3 pt-4 pb-6 items-start rtl:space-x-reverse">
          <div className="flex-none">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Icon 
                icon="heroicons-solid:user" 
                className="text-white text-sm" 
              />
            </div>
          </div>
          <div className="flex-1">
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-4">
              {sender}
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {new Date(createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Mensagem com suporte a markdown */}
        <div className="text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
          <div 
            dangerouslySetInnerHTML={{
              __html: message
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                .replace(/\n/g, '<br />')
            }}
          />
        </div>


      </div>
    </div>
  );
};

export default NotificationDetails;
