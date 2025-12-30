'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Globe, Info } from 'lucide-react';

export interface ScanFormData {
  domain: string;
  maxCrawlPages: number;
  startUrl?: string;
  storeRawHtml: boolean;
  calculateKeywordDensity: boolean;
}

interface ScanFormProps {
  onSubmit?: (data: ScanFormData) => Promise<void>;
}

export function ScanForm({ onSubmit }: ScanFormProps): React.ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [domain, setDomain] = useState('');
  const [maxCrawlPages, setMaxCrawlPages] = useState(100);
  const [startUrl, setStartUrl] = useState('');
  const [storeRawHtml, setStoreRawHtml] = useState(false);
  const [calculateKeywordDensity, setCalculateKeywordDensity] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!domain.trim()) {
      setError('Domain is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({
          domain: domain.trim(),
          maxCrawlPages,
          startUrl: startUrl.trim() || undefined,
          storeRawHtml,
          calculateKeywordDensity,
        });
      } else {
        // Default behavior: call API
        const response = await fetch('/api/site-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: domain.trim(),
            maxCrawlPages,
            startUrl: startUrl.trim() || undefined,
            storeRawHtml,
            calculateKeywordDensity,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to start scan');
        }

        // Redirect to scan detail page
        router.push(`/site-audit/${data.data.scanId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimate API cost (rough estimate based on page count)
  const estimatedCost = (maxCrawlPages * 0.002).toFixed(2);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          New Site Audit Scan
        </CardTitle>
        <CardDescription>
          Crawl an entire website to analyze technical SEO issues, page performance, and
          content quality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domain *</Label>
            <Input
              id="domain"
              type="text"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Enter the domain without http:// or www.
            </p>
          </div>

          {/* Max Crawl Pages Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Maximum Pages to Crawl</Label>
              <span className="text-sm font-medium">{maxCrawlPages} pages</span>
            </div>
            <Slider
              value={[maxCrawlPages]}
              onValueChange={(value) => setMaxCrawlPages(value[0] ?? 100)}
              min={10}
              max={500}
              step={10}
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10 pages</span>
              <span>500 pages</span>
            </div>
          </div>

          {/* Start URL (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="startUrl">Start URL (Optional)</Label>
            <Input
              id="startUrl"
              type="url"
              placeholder="https://example.com/specific-page"
              value={startUrl}
              onChange={(e) => setStartUrl(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to start from the homepage. Specify to start crawling from a
              specific page.
            </p>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Advanced Options</h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rawHtml">Store Raw HTML</Label>
                <p className="text-xs text-muted-foreground">
                  Store the raw HTML of each page for deeper analysis
                </p>
              </div>
              <Switch
                id="rawHtml"
                checked={storeRawHtml}
                onCheckedChange={setStoreRawHtml}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="keywordDensity">Calculate Keyword Density</Label>
                <p className="text-xs text-muted-foreground">
                  Analyze keyword frequency on each page
                </p>
              </div>
              <Switch
                id="keywordDensity"
                checked={calculateKeywordDensity}
                onCheckedChange={setCalculateKeywordDensity}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">Estimated API Cost: ~${estimatedCost}</p>
              <p className="text-muted-foreground">
                Based on {maxCrawlPages} pages with JavaScript rendering enabled.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting Scan...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Start Site Audit
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
