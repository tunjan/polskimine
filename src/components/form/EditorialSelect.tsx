import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import clsx from 'clsx';

export interface EditorialSelectOption {
  value: string;
  label: string;
}

interface EditorialSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: EditorialSelectOption[];
  placeholder?: string;
  className?: string;
}

export const EditorialSelect: React.FC<EditorialSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder,
  className 
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className={clsx("w-full", className)}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);