import { ReactNode } from 'react';
import { HTMLMotionProps } from 'framer-motion';

interface DecryptedTextProps extends HTMLMotionProps<'span'> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  parentClassName?: string;
  animateOn?: 'view' | 'hover';
}

declare const DecryptedText: (props: DecryptedTextProps) => ReactNode;
export default DecryptedText;