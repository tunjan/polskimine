import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EditorialTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const EditorialTextarea: React.FC<EditorialTextareaProps> = (props) => (
  <Textarea {...props} />
);
