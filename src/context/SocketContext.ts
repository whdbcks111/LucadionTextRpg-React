import { createContext } from 'react';
import { io } from 'socket.io-client';

const socketClient = io('https://lucadion.mcv.kr:5555/chat');
export const SocketContext = createContext(socketClient);