import { useEffect } from 'react';
import socket from './socket';

function App() {
  useEffect(() => {
  window.socket = socket;
  socket.on('connect', () => console.log('Connected:', socket.id));
  socket.on('game:state', (data) => console.log('state', data));
  socket.on('game:turn', (data) => console.log('turn', data));
  socket.on('game:event', (data) => console.log('event', data));

  return () => {
    socket.off('connect');
    socket.off('game:state');
    socket.off('game:turn');
    socket.off('game:event');
  };
}, []);

  return <div>The Maze</div>;
}

export default App;
