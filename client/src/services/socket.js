import { io } from 'socket.io-client';

const serverUrl = `http://${window.location.hostname || 'localhost'}:3001`;

const socket = io(serverUrl, {
  forceNew: true
});

export default socket;
