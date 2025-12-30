'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe,
  Plus,
  Trash2,
  Settings,
  ExternalLink,
  Search,
  MoreHorizontal,
  Pin,
  PinOff,
  X,
  Loader2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { formatDistanceToNow } from 'date-fns'
import { useDomain } from '@/contexts/DomainContext'

interface Domain {
  id: string
  name: string
  domain: string
  isPinned: boolean
  createdAt: string
  _count?: {
    audits: number
    siteAuditScans: number
    localCampaigns: number
  }
}

export default function DomainManagementPage() {
  const router = useRouter()
  const { refreshDomains } = useDomain()
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [newDomainName, setNewDomainName] = useState('')
  const [newDomainUrl, setNewDomainUrl] = useState('')

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/domains?includeCounts=true')
      const data = await response.json()
      
      if (data.success) {
        setDomains(data.data)
      } else {
        setError(data.error || 'Failed to load domains')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomainName.trim() || !newDomainUrl.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDomainName.trim(),
          domain: newDomainUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
        }),
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchDomains()
        await refreshDomains()
        setShowAddDialog(false)
        setNewDomainName('')
        setNewDomainUrl('')
      } else {
        setError(data.error || 'Failed to add domain')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDomain = async () => {
    if (!selectedDomain) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/domains/${selectedDomain.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchDomains()
        await refreshDomains()
        setShowDeleteDialog(false)
        setSelectedDomain(null)
      } else {
        setError(data.error || 'Failed to delete domain')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePin = async (domain: Domain) => {
    try {
      const response = await fetch(`/api/domains/${domain.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !domain.isPinned }),
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchDomains()
        await refreshDomains()
      }
    } catch {
      setError('Failed to update domain')
    }
  }

  const filteredDomains = domains.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.domain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedDomains = filteredDomains.filter((d) => d.isPinned)
  const unpinnedDomains = filteredDomains.filter((d) => !d.isPinned)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your projects and domains in one place
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-[#FF6B35] hover:bg-[#E85A2A]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search domains..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Empty State */}
      {domains.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-xl mt-4">No domains yet</h3>
            <p className="text-muted-foreground mt-1">
              Add your first domain to start tracking SEO performance
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="mt-4 bg-[#FF6B35] hover:bg-[#E85A2A]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pinned Domains */}
          {pinnedDomains.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned ({pinnedDomains.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pinnedDomains.map((domain) => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    onPin={() => handleTogglePin(domain)}
                    onDelete={() => {
                      setSelectedDomain(domain)
                      setShowDeleteDialog(true)
                    }}
                    onSelect={() => router.push(`/d/${domain.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Domains */}
          {unpinnedDomains.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Globe className="h-4 w-4" />
                All Domains ({unpinnedDomains.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unpinnedDomains.map((domain) => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    onPin={() => handleTogglePin(domain)}
                    onDelete={() => {
                      setSelectedDomain(domain)
                      setShowDeleteDialog(true)
                    }}
                    onSelect={() => router.push(`/d/${domain.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {filteredDomains.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No domains found matching &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </>
      )}

      {/* Add Domain Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Domain</DialogTitle>
            <DialogDescription>
              Enter the details for the domain you want to track
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., My Dental Practice"
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain URL</Label>
              <Input
                id="domain"
                placeholder="e.g., example.com"
                value={newDomainUrl}
                onChange={(e) => setNewDomainUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the domain without http:// or https://
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddDomain} 
              disabled={isSubmitting || !newDomainName.trim() || !newDomainUrl.trim()}
              className="bg-[#FF6B35] hover:bg-[#E85A2A]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedDomain?.name}&quot;? This will remove all
              associated audits, scans, and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDomain}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Domain Card Component
interface DomainCardProps {
  domain: Domain
  onPin: () => void
  onDelete: () => void
  onSelect: () => void
}

function DomainCard({ domain, onPin, onDelete, onSelect }: DomainCardProps) {
  const totalItems = 
    (domain._count?.audits || 0) +
    (domain._count?.siteAuditScans || 0) +
    (domain._count?.localCampaigns || 0)

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={onSelect}
    >
      {/* Pin indicator */}
      {domain.isPinned && (
        <div className="absolute top-2 right-2">
          <Pin className="h-4 w-4 text-[#FF6B35]" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {domain.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                {domain.domain}
                <ExternalLink className="h-3 w-3" />
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{totalItems} items</Badge>
            <span>•</span>
            <span>
              Added {formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onPin}>
                {domain.isPinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin to Top
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSelect}>
                <Settings className="mr-2 h-4 w-4" />
                View Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

