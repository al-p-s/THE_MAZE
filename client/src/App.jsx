import { useEffect } from 'react';
import socket from './socket';

function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    return () => socket.off('connect');
  }, []);

  return <div>The Maze</div>;
}

export default App;
