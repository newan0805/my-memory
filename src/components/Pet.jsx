import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nextQuote, ensureQuotes } from '../hooks/quotes';

export const PETS = [
  { value: 'blob', label: 'Blob', body: '#8b5cf6', accent: '#c4b5fd' },
  { value: 'cat', label: 'Cat', body: '#f59e0b', accent: '#fde68a' },
  { value: 'ghost', label: 'Ghost', body: '#e2e8f0', accent: '#ffffff' },
  { value: 'robot', label: 'Robot', body: '#38bdf8', accent: '#bae6fd' },
];

const Face = ({ blinking, happy }) => (
  <>
    {blinking ? (
      <>
        <rect x="18" y="26" width="8" height="2" rx="1" fill="#1e1b4b" />
        <rect x="38" y="26" width="8" height="2" rx="1" fill="#1e1b4b" />
      </>
    ) : (
      <>
        <circle cx="22" cy="27" r="4" fill="#1e1b4b" />
        <circle cx="42" cy="27" r="4" fill="#1e1b4b" />
        <circle cx="23.5" cy="25.5" r="1.3" fill="#fff" />
        <circle cx="43.5" cy="25.5" r="1.3" fill="#fff" />
      </>
    )}
    <circle cx="15" cy="35" r="3" fill="#f472b6" opacity="0.5" />
    <circle cx="49" cy="35" r="3" fill="#f472b6" opacity="0.5" />
    <path d={happy ? 'M25 36 Q32 44 39 36' : 'M27 37 Q32 41 37 37'} stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </>
);

export const PetSvg = ({ petId, blinking, happy }) => {
  const pet = PETS.find((p) => p.value === petId) || PETS[0];
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ overflow: 'visible' }}>
      {petId === 'cat' && (
        <>
          <path d="M10 22 L14 4 L26 14 Z" fill={pet.body} />
          <path d="M54 22 L50 4 L38 14 Z" fill={pet.body} />
          <path d="M14 18 L16 9 L22 14 Z" fill={pet.accent} />
          <path d="M50 18 L48 9 L42 14 Z" fill={pet.accent} />
        </>
      )}
      {petId === 'robot' && (
        <>
          <line x1="32" y1="10" x2="32" y2="2" stroke={pet.body} strokeWidth="3" />
          <circle cx="32" cy="2" r="3" fill="#f87171" />
        </>
      )}
      {petId === 'ghost' ? (
        <path d="M8 34 Q8 8 32 8 Q56 8 56 34 L56 58 L48 52 L40 58 L32 52 L24 58 L16 52 L8 58 Z" fill={pet.body} opacity="0.92" />
      ) : petId === 'robot' ? (
        <rect x="8" y="10" width="48" height="46" rx="10" fill={pet.body} />
      ) : (
        <ellipse cx="32" cy="34" rx="25" ry="23" fill={pet.body} />
      )}
      <ellipse cx="32" cy={petId === 'robot' ? 44 : 46} rx="12" ry="6" fill={pet.accent} opacity="0.4" />
      <Face blinking={blinking} happy={happy} />
    </svg>
  );
};

function Pet({ petId = 'blob', petName, size = 44, phase }) {
  const [blinking, setBlinking] = useState(false);
  const [message, setMessage] = useState(null);
  const dragged = useRef(false);
  const messageTimer = useRef(null);

  useEffect(() => {
    const blink = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3500);
    ensureQuotes();
    return () => {
      clearInterval(blink);
      clearTimeout(messageTimer.current);
    };
  }, []);

  const handleClick = async () => {
    if (dragged.current) return;
    const quote = await nextQuote();
    setMessage(quote);
    clearTimeout(messageTimer.current);
    // Longer quotes stay up longer.
    messageTimer.current = setTimeout(() => setMessage(null), Math.min(4000 + quote.q.length * 50, 12000));
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => { dragged.current = true; }}
      onDragEnd={() => { setTimeout(() => { dragged.current = false; }, 0); }}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{ position: 'fixed', right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom))', width: size, height: size, zIndex: 300, cursor: 'grab', touchAction: 'none' }}
      title={`${petName || 'Your pet'} — click for a quote, drag to move`}
    >
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            style={{
              position: 'absolute',
              bottom: size + 10,
              right: 0,
              width: 'max-content',
              maxWidth: 260,
              padding: '8px 12px',
              borderRadius: 12,
              background: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              color: '#f1f5f9',
              fontSize: 13,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }}
          >
            {petName && <div style={{ fontWeight: 700, color: '#c4b5fd', marginBottom: 4 }}>{petName} says:</div>}
            <div>“{message.q}”</div>
            <div style={{ marginTop: 4, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>— {message.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{ y: [0, -6, 0], scaleY: [1, 1.04, 1] }}
        transition={{ duration: phase === 'night' ? 4 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))' }}
      >
        <PetSvg petId={petId} blinking={blinking || phase === 'night'} happy={!!message} />
      </motion.div>
    </motion.div>
  );
}

export default Pet;
