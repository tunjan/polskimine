import React from 'react';
import { Input } from '@/components/ui/input';

interface EditorialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const EditorialInput: React.FC<EditorialInputProps> = (props) => (
  <Input {...props} />
);
