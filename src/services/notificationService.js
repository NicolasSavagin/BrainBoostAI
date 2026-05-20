import { useNotificationStore } from '../store';
import streakService from './streakService';

/**
 * Notificações unificadas: toast (Zustand) + painel (Firestore).
 */
export async function notify(userId, { type = 'info', title, message }) {
  useNotificationStore.getState().addNotification({
    type,
    title: title || message,
    message,
  });

  if (userId) {
    await streakService.createNotification(userId, {
      type,
      title: title || 'Notificação',
      message,
    });
  }
}

export default { notify };
