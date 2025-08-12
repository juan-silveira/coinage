import React from "react";
import Icon from "@/components/ui/Icon";

const NotificationItem = ({ notification, onToggleSelection, onToggleFavorite, onMarkAsRead, onMarkAsUnread, onDelete, onRestore, onViewDetails, isSelected, isLast }) => {
  const { id, isRead, sender, title, message, createdAt, isFavorite } = notification;

  return (
    <li className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-3 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 relative min-h-[60px]">
      {/* Lado Esquerdo: Checkbox e Estrela */}
      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Estrela de favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(id);
          }}
          className="p-1 transition-colors"
        >
          {isFavorite ? (
            <Icon
              icon="heroicons-solid:star"
              className="text-lg sm:text-xl leading-[1] text-[#FFCE30] relative cursor-pointer"
            />
          ) : (
            <Icon
              icon="heroicons:star"
              className="text-lg sm:text-xl leading-[1] relative cursor-pointer text-slate-400 hover:text-[#FFCE30]"
            />
          )}
        </button>
      </div>

      {/* Lado Direito: Conteúdo da notificação */}
      <div
        className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1 min-w-0"
        onClick={() => onViewDetails(notification)}
      >
        {/* Sender */}
        <div className="flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse flex-shrink-0">
          <div className="flex-none">
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-500 flex items-center justify-center">
              <Icon 
                icon="heroicons-solid:user" 
                className="text-white text-xs" 
              />
            </div>
          </div>
          <div
            className={`text-xs sm:text-sm w-16 sm:w-20 ${
              isRead
                ? "font-light text-slate-500 dark:text-slate-400"
                : "font-extrabold text-blue-700 dark:text-blue-300"
            }`}
          >
            {sender}
          </div>
        </div>

                {/* Título e Mensagem */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 w-full">
            <span
              className={`text-xs sm:text-sm flex-shrink-0 max-w-[100px] sm:max-w-[140px] truncate ${
                isRead
                  ? "font-light text-slate-500 dark:text-slate-400"
                  : "font-extrabold text-slate-900 dark:text-white"
              }`}
              title={title}
            >
              {title}
            </span>
            <span className={`flex-shrink-0 text-xs sm:text-sm ${
              isRead
                ? "text-slate-300 dark:text-slate-500"
                : "text-slate-400 dark:text-slate-500"
            }`}>-</span>
            <span
              className={`text-xs sm:text-sm flex-1 min-w-0 truncate ${
                isRead
                  ? "font-light text-slate-500 dark:text-slate-400"
                  : "font-extrabold text-slate-900 dark:text-white"
              }`}
              title={message.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
            >
              {message.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
            </span>
          </div>
        </div>

        {/* Data */}
        <div className="flex-shrink-0 w-24 sm:w-28 text-right">
          <span className={`text-xs whitespace-nowrap ${
            isRead
              ? "font-light text-slate-500 dark:text-slate-400"
              : "font-extrabold text-blue-600 dark:text-blue-400"
          }`}>
            {new Date(createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit'
            })}, {new Date(createdAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Ações que aparecem no hover */}
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 dark:text-slate-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 bg-white h-full w-20 sm:w-24 flex items-center justify-center space-x-1 sm:space-x-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
        >
          {/* Marcar como lida/não lida */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isRead) {
                onMarkAsUnread(id);
              } else {
                onMarkAsRead(id);
              }
            }}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded"
            title={isRead ? "Marcar como não lida" : "Marcar como lida"}
          >
            <Icon 
              icon={isRead ? "heroicons-outline:eye-off" : "heroicons-outline:check-circle"} 
              className="w-3 h-3 sm:w-4 sm:h-4" 
            />
          </button>
          
          {/* Excluir ou Restaurar */}
          {onRestore ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore(id);
              }}
              className="p-1 sm:p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded"
              title="Restaurar"
            >
              <Icon
                icon="heroicons-outline:arrow-path"
                className="w-3 h-3 sm:w-4 sm:h-4 transition duration-150"
              />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded"
              title="Excluir"
            >
              <Icon
                icon="heroicons-outline:trash"
              className="w-3 h-3 sm:w-4 sm:h-4 transition duration-150"
              />
            </button>
          )}
        </span>
      </div>
    </li>
  );
};

export default NotificationItem;
