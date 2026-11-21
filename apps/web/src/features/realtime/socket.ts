import { io } from 'socket.io-client';
import { API_URL } from '@/lib/env';

/** Shared Socket.IO connection; the session cookie authenticates it. */
export const socket = io(API_URL, {
  withCredentials: true,
  autoConnect: false,
});
