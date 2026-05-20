import { useEffect, useRef } from 'react';

export default function EventLog({ events }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div style={styles.root}>
      <div style={styles.header}>ЛОГ</div>
      <div style={styles.list}>
        {events.length === 0
          ? <div style={styles.empty}>— нет событий —</div>
          : events.map((msg, i) => (
            <div key={i} style={{ ...styles.entry, opacity: 0.4 + 0.6 * ((i + 1) / events.length) }}>
              <span style={styles.index}>{i + 1}</span>
              <span style={styles.msg}>{msg}</span>
            </div>
          ))
        }
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles = {
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: "'Courier New', monospace",
  },
  header: {
    fontSize: '9px',
    letterSpacing: '3px',
    color: '#444',
    padding: '8px 12px 4px',
    borderBottom: '1px solid #1a1a1a',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '6px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  empty: {
    color: '#333',
    fontSize: '10px',
    textAlign: 'center',
    marginTop: '20px',
    letterSpacing: '1px',
  },
  entry: {
    display: 'flex',
    gap: '8px',
    fontSize: '10px',
    lineHeight: '1.4',
  },
  index: {
    color: '#333',
    minWidth: '16px',
    textAlign: 'right',
    flexShrink: 0,
  },
  msg: {
    color: '#888',
    wordBreak: 'break-word',
  },
};
