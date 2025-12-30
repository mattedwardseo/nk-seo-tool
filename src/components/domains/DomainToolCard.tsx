'use client';

/**
 * DomainToolCard Component
 * Shows tool status and quick actions for a specific tool
 */

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DomainToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  lastRunDate?: Date;
  viewAllHref: string;
  runNewHref: string;
  isEmpty?: boolean;
}

export function DomainToolCard({
  title,
  description,
  icon: Icon,
  count,
  lastRunDate,
  viewAllHref,
  runNewHref,
  isEmpty = false,
}: DomainToolCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          {count > 0 && (
            <Badge variant="secondary" className="ml-2">
              {count}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No data yet. Run your first {title.toLowerCase()} to get started.
            </p>
            <Button asChild className="w-full">
              <Link href={runNewHref}>Run First {title}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total runs:</span>
              <span className="font-medium">{count}</span>
            </div>
            {lastRunDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last run:</span>
                <span className="font-medium">
                  {lastRunDate.toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <Link href={viewAllHref}>View All</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={runNewHref}>Run New</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
