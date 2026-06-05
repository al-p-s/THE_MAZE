import { useEffect, useRef } from 'react';

const COLOR = {
  text: '#a89070',
  textDim: '#5a4a38',
  border: '#4a3a22',
  empty: '#333',
  index: '#333',
};

export default function EventLog({ events }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div style={styles.root}>
      <div style={styles.header}>LOG</div>
      <div style={styles.list} className="event-log-list">
        {events.length === 0
          ? <div style={styles.empty}>— no events —</div>
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
    color: COLOR.textDim,
    padding: '10px 12px 6px',
    fontFamily: "'Cinzel', serif",
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
    color: COLOR.empty,
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '20px',
    letterSpacing: '1px',
  },
  entry: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    lineHeight: '1.4',
  },
  index: {
    color: COLOR.index,
    minWidth: '16px',
    textAlign: 'right',
    flexShrink: 0,
  },
  msg: {
    color: COLOR.text,
    wordBreak: 'break-word',
  },
};
