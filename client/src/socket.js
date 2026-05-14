import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  forceNew: true
});

export default socket;
