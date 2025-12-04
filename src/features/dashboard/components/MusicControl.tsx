import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { cn } from '@/lib/utils';

export const MusicControl = () => {
  const { isPlaying, togglePlay } = useMusic();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex items-center justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="mr-3 bg-[#3B4255]/90 backdrop-blur-md text-[#ECE5D8] px-3 py-1.5 rounded-lg border border-[#D3BC8E]/30 text-xs font-serif tracking-wider shadow-lg whitespace-nowrap"
          >
            {isPlaying ? "Medieval Atmosphere" : "Music Paused"}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={togglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative w-12 h-12 rounded-full flex items-center justify-center",
          "bg-[#3B4255] border-2 border-[#D3BC8E]",
          "shadow-[0_0_15px_rgba(0,0,0,0.5)]",
          "cursor-pointer overflow-hidden transition-colors hover:bg-[#4B5265]"
        )}
      >
        {/* Inner decorative circle */}
        <div className="absolute inset-1 rounded-full border border-[#D3BC8E]/30" />
        
        {/* Icon */}
        <div className="relative z-10">
          {isPlaying ? (
            <Volume2 className="w-5 h-5 text-[#ECE5D8] drop-shadow-md" />
          ) : (
            <VolumeX className="w-5 h-5 text-[#ECE5D8]/70" />
          )}
        </div>
      </motion.button>
    </div>
  );
};

