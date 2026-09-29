import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function Placeholder({ title, description }) {
  return (
    <div className="py-12">
      <Card className="max-w-xl mx-auto p-8 text-center flex flex-col items-center gap-4">
        <Badge tone="neutral">Coming Soon</Badge>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
          {description || 'This feature is scheduled for implementation in upcoming phases.'}
        </p>
      </Card>
    </div>
  );
}
