import { useSelector } from 'react-redux';

export const useChatMessages = () => {
  const contacts = useSelector((state) => state.chat.contacts);
  
  // Calcular total de mensagens não lidas
  const unreadCount = contacts.reduce((total, contact) => {
    return total + (contact.unredmessage || 0);
  }, 0);

  return {
    unreadCount
  };
};
