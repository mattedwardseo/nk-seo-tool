'use client';

/**
 * CreateDomainDialog Component
 * Dialog form for creating new domains/projects
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface CreateDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDomainDialog({
  open,
  onOpenChange,
}: CreateDomainDialogProps) {
  const { createDomain } = useDomain();
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

      await createDomain({
        name: data.name,
        domain: data.domain,
        businessName: data.businessName || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
      });

      toast.success('Domain created successfully!');
      form.reset();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New SEO Project</DialogTitle>
          <DialogDescription>
            Add a new domain to track SEO performance and run audits.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
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
                  <FormLabel>Domain</FormLabel>
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
                    Without http:// or www.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Smile Bright Dentistry"
                      {...field}
                    />
                  </FormControl>
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
                    <FormLabel>City (Optional)</FormLabel>
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
                    <FormLabel>State (Optional)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
