'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface DuplicatePage {
  id: string;
  url: string;
  statusCode: number;
  onpageScore: number | null;
  title?: string | null;
}

interface DuplicateGroup {
  title?: string;
  description?: string;
  count: number;
  pages: DuplicatePage[];
}

interface DuplicatesData {
  duplicateTitles: DuplicateGroup[];
  duplicateDescriptions: DuplicateGroup[];
  totalDuplicateTitleGroups: number;
  totalDuplicateDescriptionGroups: number;
  totalDuplicateTitlePages: number;
  totalDuplicateDescriptionPages: number;
}

interface DuplicatesTableProps {
  scanId: string;
}

export function DuplicatesTable({ scanId }: DuplicatesTableProps) {
  const [data, setData] = useState<DuplicatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchDuplicates() {
      try {
        setLoading(true);
        const response = await fetch(`/api/site-audit/scans/${scanId}/duplicates`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || 'Failed to fetch duplicates');
          return;
        }

        setData(result.data);
      } catch (err) {
        setError('Failed to fetch duplicate data');
      } finally {
        setLoading(false);
      }
    }

    fetchDuplicates();
  }, [scanId]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.totalDuplicateTitleGroups === 0 && data.totalDuplicateDescriptionGroups === 0)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            No duplicate content found.
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderGroup = (group: DuplicateGroup, type: 'title' | 'description', index: number) => {
    const groupId = `${type}-${index}`;
    const isExpanded = expandedGroups.has(groupId);
    const content = type === 'title' ? group.title : group.description;

    return (
      <div key={groupId} className="border rounded-lg">
        <button
          onClick={() => toggleGroup(groupId)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate" title={content || ''}>
                {content || '(empty)'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="ml-2">
            {group.count} pages
          </Badge>
        </button>

        {isExpanded && (
          <div className="border-t bg-muted/30 p-4">
            <div className="space-y-2">
              {group.pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between bg-background rounded p-3 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge
                      variant={page.statusCode >= 400 ? 'destructive' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {page.statusCode}
                    </Badge>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                      title={page.url}
                    >
                      {page.url}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {page.onpageScore !== null && (
                      <Badge variant="outline">
                        Score: {Math.round(page.onpageScore)}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(page.url);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={page.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Duplicate Content
        </CardTitle>
        <CardDescription>
          Pages sharing the same title or meta description
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="titles">
          <TabsList className="mb-4">
            <TabsTrigger value="titles" className="gap-2">
              Duplicate Titles
              {data.totalDuplicateTitleGroups > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {data.totalDuplicateTitleGroups}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="descriptions" className="gap-2">
              Duplicate Descriptions
              {data.totalDuplicateDescriptionGroups > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {data.totalDuplicateDescriptionGroups}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="titles" className="space-y-3">
            {data.duplicateTitles.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No duplicate titles found.
              </div>
            ) : (
              data.duplicateTitles.map((group, i) => renderGroup(group, 'title', i))
            )}
          </TabsContent>

          <TabsContent value="descriptions" className="space-y-3">
            {data.duplicateDescriptions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No duplicate descriptions found.
              </div>
            ) : (
              data.duplicateDescriptions.map((group, i) => renderGroup(group, 'description', i))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
