import React from 'react';
import { LucideProps } from 'lucide-react';
import * as Icons from 'lucide-react';

interface IconProps extends LucideProps {
  name: keyof typeof Icons;
  className?: string;
  size?: number | string;
  strokeWidth?: number | string;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = Icons[name] as React.ComponentType<LucideProps>;

  if (!LucideIcon) {
    return null;
  }

  return <LucideIcon {...props} />;
};