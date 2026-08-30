import React from 'react';
import { motion } from 'motion/react';

export const BunnyPeeking: React.FC = () => {
  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-11 right-8 z-20 pointer-events-none select-none flex flex-col items-center"
    >
      <svg width="110" height="70" viewBox="0 0 110 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_8px_14px_rgba(132,76,91,.18)]">
        <motion.g animate={{ rotate: [-2, 3, -2] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '32px 35px' }}>
          <path d="M 22 38 C 12 20, 16 0, 32 4 C 38 18, 34 32, 28 38 Z" fill="#FFF9F3" stroke="#F3D6D2" strokeWidth="1.5" />
          <path d="M 23 34 C 17 22, 20 8, 30 10 C 33 20, 30 30, 27 34 Z" fill="#FFB6C4" opacity="0.9" />
        </motion.g>
        <motion.g animate={{ rotate: [2, -3, 2] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '78px 35px' }}>
          <path d="M 88 38 C 98 20, 94 0, 78 4 C 72 18, 76 32, 82 38 Z" fill="#FFF9F3" stroke="#F3D6D2" strokeWidth="1.5" />
          <path d="M 87 34 C 93 22, 90 8, 80 10 C 77 20, 80 30, 83 34 Z" fill="#FFB6C4" opacity="0.9" />
        </motion.g>
        <path d="M 20 52 C 20 30, 90 30, 90 52 C 90 62, 20 62, 20 52 Z" fill="#FFF9F3" stroke="#F3D6D2" strokeWidth="1.5" />
        <circle cx="33" cy="48" r="6" fill="#FF9DB1" opacity="0.55" />
        <circle cx="77" cy="48" r="6" fill="#FF9DB1" opacity="0.55" />
        <ellipse cx="40" cy="42" rx="3.5" ry="4.5" fill="#4A343E" />
        <circle cx="38.5" cy="40" r="1.5" fill="#FFFFFF" />
        <ellipse cx="70" cy="42" rx="3.5" ry="4.5" fill="#4A343E" />
        <circle cx="68.5" cy="40" r="1.5" fill="#FFFFFF" />
        <path d="M 52 46 C 53 45, 57 45, 58 46 C 58.5 47.5, 55 50, 55 50 C 55 50, 51.5 47.5, 52 46 Z" fill="#EF6681" />
        <path d="M 50 51 C 52 53, 55 53, 55 51 C 55 53, 58 53, 60 51" stroke="#76515F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M 18 45 L 28 46 M 16 50 L 27 49" stroke="#E9CBCD" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 92 45 L 82 46 M 94 50 L 83 49" stroke="#E9CBCD" strokeWidth="1.2" strokeLinecap="round" />
        <g>
          <rect x="36" y="55" width="14" height="14" rx="7" fill="#FFF9F3" stroke="#E9CBCD" strokeWidth="1.2" />
          <path d="M 40 60 L 40 65 M 43 61 L 43 66 M 46 60 L 46 65" stroke="#F5E1DE" strokeWidth="1" />
        </g>
        <g>
          <rect x="60" y="55" width="14" height="14" rx="7" fill="#FFF9F3" stroke="#E9CBCD" strokeWidth="1.2" />
          <path d="M 64 60 L 64 65 M 67 61 L 67 66 M 70 60 L 70 65" stroke="#F5E1DE" strokeWidth="1" />
        </g>
      </svg>
    </motion.div>
  );
};
