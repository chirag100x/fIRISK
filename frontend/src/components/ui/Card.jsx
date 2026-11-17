import React from 'react';
import GlassPanel from './GlassPanel';

export default function Card({ children, className = '', style = {}, ...props }) {
  return (
    <GlassPanel className={className} style={style} {...props}>
      {children}
    </GlassPanel>
  );
}
