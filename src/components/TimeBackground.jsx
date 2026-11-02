import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Each phase is a full scene: sky, sun/moon, three mountain layers and the town's lights.
const SCENES = {
  night: {
    sky: ['#020617', '#0b1033', '#1e1b4b'], body: 'moon', bodyPos: [1250, 170], bodyColor: '#f1f5f9',
    hills: ['#1e1b4b', '#151236', '#0b0a24'], lights: 1,
  },
  dawn: {
    sky: ['#1e1b4b', '#9d174d', '#fb923c'], body: 'sun', bodyPos: [350, 560], bodyColor: '#fdba74',
    hills: ['#6b2c4a', '#4a1f3d', '#2a1230'], lights: 0.4,
  },
  morning: {
    sky: ['#0c4a6e', '#0284c7', '#7dd3fc'], body: 'sun', bodyPos: [420, 220], bodyColor: '#fde047',
    hills: ['#3f7a6a', '#2c5e55', '#1b3f3d'], lights: 0,
  },
  afternoon: {
    sky: ['#1e40af', '#2563eb', '#93c5fd'], body: 'sun', bodyPos: [1150, 150], bodyColor: '#fef08a',
    hills: ['#4b7d63', '#355f50', '#1f3d36'], lights: 0,
  },
  dusk: {
    sky: ['#3b0764', '#be185d', '#f97316'], body: 'sun', bodyPos: [1300, 590], bodyColor: '#fb923c',
    hills: ['#5b2140', '#3d1735', '#220d24'], lights: 0.6,
  },
  evening: {
    sky: ['#0f172a', '#312e81', '#6d28d9'], body: 'moon', bodyPos: [1350, 230], bodyColor: '#e2e8f0',
    hills: ['#2e2a5c', '#1f1c45', '#120f2b'], lights: 1,
  },
};

const OVERCAST = ['cloudy', 'rain', 'storm', 'fog', 'snow'];

const CLOUD_COUNT = { clear: 1, partly: 4, cloudy: 7, fog: 5, rain: 8, storm: 9, snow: 6 };

export const getPhase = (hour) => {
  if (hour >= 21 || hour < 5) return 'night';
  if (hour < 7) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 19) return 'dusk';
  return 'evening';
};

// Deterministic pseudo-random so the scene doesn't reshuffle on every render.
const seeded = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const Cloud = ({ x, y, scale, color, opacity, duration }) => (
  <motion.g
    initial={{ x: 0 }}
    animate={{ x: [0, 120, 0] }}
    transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    opacity={opacity}
  >
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={color}>
      <ellipse cx="0" cy="0" rx="90" ry="38" />
      <ellipse cx="-55" cy="12" rx="60" ry="30" />
      <ellipse cx="60" cy="10" rx="70" ry="32" />
      <ellipse cx="10" cy="-25" rx="55" ry="35" />
    </g>
  </motion.g>
);

function SceneImage({ phase, condition }) {
  const scene = SCENES[phase];
  const overcast = OVERCAST.includes(condition);
  const isNight = phase === 'night' || phase === 'evening';

  const stars = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: 90 }, () => ({ x: rand() * 1600, y: rand() * 480, r: rand() * 1.6 + 0.4, d: rand() * 4 }));
  }, []);

  const clouds = useMemo(() => {
    const rand = seeded(42);
    const count = CLOUD_COUNT[condition] ?? 2;
    return Array.from({ length: count }, (_, i) => ({
      x: (i + 0.5) * (1600 / count) + (rand() - 0.5) * 120,
      y: 90 + rand() * (overcast ? 180 : 260),
      scale: 0.8 + rand() * (overcast ? 1.2 : 0.7),
      duration: 40 + rand() * 40,
    }));
  }, [condition, overcast]);

  const windows = useMemo(() => {
    const rand = seeded(3);
    return Array.from({ length: 40 }, () => ({ x: 80 + rand() * 1440, y: 760 + rand() * 110 }));
  }, []);

  const cloudColor = overcast
    ? (isNight ? '#334155' : '#94a3b8')
    : (isNight ? '#475569' : phase === 'dawn' || phase === 'dusk' ? '#fecaca' : '#f8fafc');

  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={scene.sky[0]} />
          <stop offset="55%" stopColor={scene.sky[1]} />
          <stop offset="100%" stopColor={scene.sky[2]} />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0%" stopColor={scene.bodyColor} stopOpacity="0.55" />
          <stop offset="100%" stopColor={scene.bodyColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#sky)" />

      {isNight && !overcast && stars.map((s, i) => (
        <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff"
          animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: s.d }} />
      ))}

      <g opacity={overcast ? 0.25 : 1}>
        <circle cx={scene.bodyPos[0]} cy={scene.bodyPos[1]} r={scene.body === 'sun' ? 220 : 160} fill="url(#glow)" />
        <circle cx={scene.bodyPos[0]} cy={scene.bodyPos[1]} r={scene.body === 'sun' ? 70 : 55} fill={scene.bodyColor} />
        {scene.body === 'moon' && (
          <>
            <circle cx={scene.bodyPos[0] - 18} cy={scene.bodyPos[1] - 10} r="10" fill="#cbd5e1" />
            <circle cx={scene.bodyPos[0] + 15} cy={scene.bodyPos[1] + 18} r="7" fill="#cbd5e1" />
          </>
        )}
      </g>

      {clouds.map((c, i) => (
        <Cloud key={i} {...c} color={cloudColor} opacity={overcast ? 0.9 : 0.75} />
      ))}

      <path d="M0 620 L180 470 L330 560 L520 400 L700 540 L880 430 L1060 560 L1250 420 L1420 530 L1600 450 L1600 900 L0 900 Z" fill={scene.hills[0]} />
      <path d="M0 700 L220 590 L420 680 L640 580 L860 690 L1080 600 L1300 690 L1600 590 L1600 900 L0 900 Z" fill={scene.hills[1]} />
      <path d="M0 780 Q400 700 800 770 T1600 750 L1600 900 L0 900 Z" fill={scene.hills[2]} />

      {scene.lights > 0 && windows.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width="5" height="7" rx="1" fill="#fde68a" opacity={scene.lights * (0.5 + (i % 3) * 0.2)} />
      ))}

      {condition === 'fog' && <rect width="1600" height="900" fill="url(#fog)" />}
      {condition === 'storm' && (
        <motion.path d="M900 260 L860 400 L910 400 L870 540" stroke="#fef9c3" strokeWidth="5" fill="none"
          animate={{ opacity: [0, 0, 1, 0, 1, 0, 0] }} transition={{ duration: 6, repeat: Infinity }} />
      )}
    </svg>
  );
}

const Precipitation = ({ type }) => {
  const drops = useMemo(() => Array.from({ length: type === 'snow' ? 50 : 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: type === 'snow' ? 6 + Math.random() * 4 : 0.8 + Math.random() * 0.6,
  })), [type]);

  return drops.map((d) => (
    <motion.span
      key={d.id}
      style={{
        position: 'absolute',
        top: -20,
        left: `${d.left}%`,
        width: type === 'snow' ? 4 : 1,
        height: type === 'snow' ? 4 : 16,
        borderRadius: type === 'snow' ? '50%' : 1,
        background: type === 'snow' ? 'rgba(255,255,255,0.8)' : 'rgba(186, 230, 253, 0.45)',
      }}
      animate={{ y: '110vh', x: type === 'snow' ? [0, 15, -15, 0] : 0 }}
      transition={{ duration: d.duration, repeat: Infinity, delay: d.delay, ease: 'linear' }}
    />
  ));
};

function TimeBackground({ enabled = true, condition, children }) {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const phase = getPhase(hour);
  const precipitation = condition === 'rain' || condition === 'storm' ? 'rain' : condition === 'snow' ? 'snow' : null;

  return (
    <>
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none', background: '#0f172a' }}>
        {enabled ? (
          <>
            <AnimatePresence>
              <motion.div
                key={`${phase}-${condition}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <SceneImage phase={phase} condition={condition} />
              </motion.div>
            </AnimatePresence>
            {precipitation && <Precipitation type={precipitation} />}
            {/* Scrim keeps the app's white text and glass cards readable over bright scenes. */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.45) 0%, rgba(2, 6, 23, 0.25) 50%, rgba(2, 6, 23, 0.55) 100%)' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%)' }} />
        )}
      </div>
      {children}
    </>
  );
}

export default TimeBackground;
