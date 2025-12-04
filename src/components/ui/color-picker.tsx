import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hexToHSL, hslToHex } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string; 
  onChange: (value: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const hexValue = React.useMemo(() => {
    try {
      
      if (!value) return '#000000';
      const [h, s, l] = value.split(' ').map(v => parseFloat(v));
      
      if (isNaN(h) || isNaN(s) || isNaN(l)) return '#000000';
      
      return hslToHex(h, s, l);
    } catch (e) {
      return '#000000';
    }
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    const { h, s, l } = hexToHSL(newHex);
    
    onChange(`${h} ${s}% ${l}%`);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;

    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
        const { h, s, l } = hexToHSL(newHex);
        
        onChange(`${h} ${s}% ${l}%`);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-none  hover:scale-110 transition-transform">
          <input
            type="color"
            value={hexValue}
            onChange={handleColorChange}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
          />
        </div>
        <Input 
            defaultValue={hexValue}
            key={hexValue} 
            onBlur={handleTextChange}
            className="w-24 font-mono uppercase rounded-xl border-transparent bg-secondary/30"
            maxLength={7}
        />
      </div>
    </div>
  );
};