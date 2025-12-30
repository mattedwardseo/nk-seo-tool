'use client';

/**
 * New Domain Page
 * Full-page form for creating a new domain/project
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDomain } from '@/contexts/DomainContext';
import { toast } from 'sonner';
import { ArrowLeft, Globe } from 'lucide-react';
import Link from 'next/link';

const createDomainSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(255)
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      'Invalid domain format'
    ),
  businessName: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional().or(z.literal('')),
});

type CreateDomainFormData = z.infer<typeof createDomainSchema>;

export default function NewDomainPage(): React.ReactElement {
  const router = useRouter();
  const { createDomain, selectDomain } = useDomain();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateDomainFormData>({
    resolver: zodResolver(createDomainSchema),
    defaultValues: {
      name: '',
      domain: '',
      businessName: '',
      city: '',
      state: '',
    },
  });

  const onSubmit = async (data: CreateDomainFormData): Promise<void> => {
    try {
      setIsSubmitting(true);

      const newDomain = await createDomain({
        name: data.name,
        domain: data.domain,
        businessName: data.businessName || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
      });

      toast.success('Domain created successfully!');

      // Auto-select the newly created domain
      selectDomain(newDomain.id);

      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Error creating domain:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create domain'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create New SEO Project</h1>
            <p className="text-muted-foreground">
              Add a new domain to track SEO performance and run audits
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Enter the basic information for your new SEO project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Main Dental Practice"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A friendly name for this project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., example.com"
                        {...field}
                        onChange={(e) => {
                          // Auto-remove http/https and trailing slash
                          const cleaned = e.target.value
                            .replace(/^https?:\/\//, '')
                            .replace(/\/$/, '');
                          field.onChange(cleaned);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Without http:// or www. (e.g., fielderparkdental.com)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-4">
                  Optional Business Information
                </h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Smile Bright Dentistry"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Legal business name or DBA
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Austin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., TX"
                              maxLength={2}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value.toUpperCase());
                              }}
                            />
                          </FormControl>
                          <FormDescription>2-letter code</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Project...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="text-sm font-medium mb-2">What happens next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your new project will be created with default settings</li>
            <li>• You can run SEO audits, site scans, and local campaigns</li>
            <li>• All data is isolated per project for clean organization</li>
            <li>• You can update settings or ROI defaults anytime</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
