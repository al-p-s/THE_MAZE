import { useEffect, useRef } from 'react';

export default function NotificationPanel({ notification }) {
  const boxRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!notification || !boxRef.current) return;
    clearTimeout(timerRef.current);
    boxRef.current.style.opacity = '1';
    boxRef.current.style.transform = 'translateY(0)';
    timerRef.current = setTimeout(() => {
      if (boxRef.current) {
        boxRef.current.style.opacity = '0';
        boxRef.current.style.transform = 'translateY(6px)';
      }
    }, 2500);
  }, [notification]);

  return (
    <div style={styles.root}>
      <div ref={boxRef} style={styles.box}>
        {notification && (
          <>
            <div style={{ ...styles.text, color: notification.color }}>
              {notification.text}
            </div>
            {notification.sub && (
              <div style={{ ...styles.sub, color: notification.subColor || '#aaa' }}>
                {notification.sub}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    padding: '10px 12px',
    borderBottom: '1px solid #1a1a1a',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    fontFamily: "'Courier New', monospace",
  },
  box: {
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    opacity: 0,
    transform: 'translateY(6px)',
    width: '100%',
  },
  text: {
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '4px',
  },
  sub: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#aaa',
    letterSpacing: '2px',
    marginTop: '4px',
  },
};
