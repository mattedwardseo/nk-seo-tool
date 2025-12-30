'use client';

/**
 * EmptyToolState Component
 * Shows empty state when a tool hasn't been run yet for the selected domain
 */

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface EmptyToolStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
}

export function EmptyToolState({
  title,
  description,
  icon: Icon,
  actionLabel,
  actionHref,
  action,
}: EmptyToolStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mb-4 text-sm text-muted-foreground max-w-md">
            {description}
          </p>
          {action}
          {actionLabel && actionHref && (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
