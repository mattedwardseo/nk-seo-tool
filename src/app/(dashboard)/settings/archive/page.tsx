'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Archive,
  ArrowLeft,
  FileSearch,
  Globe,
  MapPin,
  Loader2,
  Trash2,
  FolderInput,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDomain } from '@/contexts/DomainContext';
import { format } from 'date-fns';

interface UnassignedAudit {
  id: string;
  domain: string;
  status: string;
  createdAt: string;
}

interface UnassignedSiteAuditScan {
  id: string;
  domain: string;
  status: string;
  createdAt: string;
  maxCrawlPages: number;
}

interface UnassignedLocalCampaign {
  id: string;
  businessName: string;
  keywords: string[];
  status: string;
  createdAt: string;
}

interface ArchivedAudit {
  id: string;
  domain: string;
  status: string;
  createdAt: string;
  archivedAt: string;
}

interface ArchivedSiteAuditScan {
  id: string;
  domain: string;
  status: string;
  createdAt: string;
  archivedAt: string;
}

interface ArchivedLocalCampaign {
  id: string;
  businessName: string;
  createdAt: string;
  archivedAt: string;
}

interface ArchiveData {
  unassigned: {
    audits: UnassignedAudit[];
    siteAuditScans: UnassignedSiteAuditScan[];
    localCampaigns: UnassignedLocalCampaign[];
    totalCount: number;
  };
  archived: {
    audits: ArchivedAudit[];
    siteAuditScans: ArchivedSiteAuditScan[];
    localCampaigns: ArchivedLocalCampaign[];
    totalCount: number;
  };
}

type DataType = 'audits' | 'siteAuditScans' | 'localCampaigns';

export default function ArchivePage(): React.ReactElement {
  const { data: session } = useSession();
  const { domains } = useDomain();
  const [data, setData] = React.useState<ArchiveData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<Record<DataType, Set<string>>>({
    audits: new Set(),
    siteAuditScans: new Set(),
    localCampaigns: new Set(),
  });
  const [selectedDomainId, setSelectedDomainId] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const fetchData = React.useCallback(async (): Promise<void> => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/archive');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Failed to load archive data');
      }
    } catch {
      toast.error('Failed to load archive data');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleSelection = (type: DataType, id: string): void => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev[type]);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { ...prev, [type]: newSet };
    });
  };

  const handleSelectAll = (type: DataType, items: { id: string }[]): void => {
    setSelectedIds((prev) => {
      const allSelected = items.every((item) => prev[type].has(item.id));
      if (allSelected) {
        return { ...prev, [type]: new Set() };
      } else {
        return { ...prev, [type]: new Set(items.map((item) => item.id)) };
      }
    });
  };

  const handleAssign = async (type: DataType): Promise<void> => {
    if (!selectedDomainId) {
      toast.error('Please select a domain');
      return;
    }

    const ids = Array.from(selectedIds[type]);
    if (ids.length === 0) {
      toast.error('Please select items to assign');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          type,
          ids,
          domainId: selectedDomainId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Assigned ${result.data.count} item(s) to domain`);
        setSelectedIds((prev) => ({ ...prev, [type]: new Set() }));
        fetchData();
      } else {
        toast.error(result.error || 'Failed to assign items');
      }
    } catch {
      toast.error('Failed to assign items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async (type: DataType): Promise<void> => {
    const ids = Array.from(selectedIds[type]);
    if (ids.length === 0) {
      toast.error('Please select items to archive');
      return;
    }

    if (!confirm(`Are you sure you want to archive ${ids.length} item(s)?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          type,
          ids,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Archived ${result.data.count} item(s)`);
        setSelectedIds((prev) => ({ ...prev, [type]: new Set() }));
        fetchData();
      } else {
        toast.error(result.error || 'Failed to archive items');
      }
    } catch {
      toast.error('Failed to archive items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (type: DataType): Promise<void> => {
    const ids = Array.from(selectedIds[type]);
    if (ids.length === 0) {
      toast.error('Please select items to delete');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete ${ids.length} archived item(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          type,
          ids,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Deleted ${result.data.count} item(s)`);
        setSelectedIds((prev) => ({ ...prev, [type]: new Set() }));
        fetchData();
      } else {
        toast.error(result.error || 'Failed to delete items');
      }
    } catch {
      toast.error('Failed to delete items');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Archive</h1>
          <p className="text-muted-foreground text-sm">
            Manage unassigned data and view archived items
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FolderInput className="h-4 w-4" />
              Unassigned Items
            </CardTitle>
            <CardDescription>
              Data not linked to any domain - assign or archive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data?.unassigned.totalCount ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archived Items
            </CardTitle>
            <CardDescription>Read-only archived data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data?.archived.totalCount ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unassigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unassigned">
            Unassigned ({data?.unassigned.totalCount ?? 0})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({data?.archived.totalCount ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Unassigned Tab */}
        <TabsContent value="unassigned" className="space-y-4">
          {data?.unassigned.totalCount === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FolderInput className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Unassigned Data</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  All your data is assigned to domains.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Domain Selector for Assignment */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">
                    Assign to Domain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a domain..." />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.name} ({domain.domain})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Unassigned Audits */}
              {(data?.unassigned?.audits?.length ?? 0) > 0 && data && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <FileSearch className="h-4 w-4" />
                        SEO Audits ({data.unassigned.audits.length})
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssign('audits')}
                          disabled={
                            isProcessing ||
                            selectedIds.audits.size === 0 ||
                            !selectedDomainId
                          }
                        >
                          <FolderInput className="mr-2 h-4 w-4" />
                          Assign ({selectedIds.audits.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleArchive('audits')}
                          disabled={isProcessing || selectedIds.audits.size === 0}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive ({selectedIds.audits.size})
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                data.unassigned.audits.length > 0 &&
                                data.unassigned.audits.every((a) =>
                                  selectedIds.audits.has(a.id)
                                )
                              }
                              onCheckedChange={() =>
                                handleSelectAll('audits', data.unassigned.audits)
                              }
                            />
                          </TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.unassigned.audits.map((audit) => (
                          <TableRow key={audit.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.audits.has(audit.id)}
                                onCheckedChange={() =>
                                  handleToggleSelection('audits', audit.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {audit.domain}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(audit.status)}>
                                {audit.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(audit.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Unassigned Site Audit Scans */}
              {(data?.unassigned?.siteAuditScans?.length ?? 0) > 0 && data && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Site Audit Scans ({data.unassigned.siteAuditScans.length})
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssign('siteAuditScans')}
                          disabled={
                            isProcessing ||
                            selectedIds.siteAuditScans.size === 0 ||
                            !selectedDomainId
                          }
                        >
                          <FolderInput className="mr-2 h-4 w-4" />
                          Assign ({selectedIds.siteAuditScans.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleArchive('siteAuditScans')}
                          disabled={
                            isProcessing || selectedIds.siteAuditScans.size === 0
                          }
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive ({selectedIds.siteAuditScans.size})
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                data.unassigned.siteAuditScans.length > 0 &&
                                data.unassigned.siteAuditScans.every((s) =>
                                  selectedIds.siteAuditScans.has(s.id)
                                )
                              }
                              onCheckedChange={() =>
                                handleSelectAll(
                                  'siteAuditScans',
                                  data.unassigned.siteAuditScans
                                )
                              }
                            />
                          </TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Max Pages</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.unassigned.siteAuditScans.map((scan) => (
                          <TableRow key={scan.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.siteAuditScans.has(scan.id)}
                                onCheckedChange={() =>
                                  handleToggleSelection('siteAuditScans', scan.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {scan.domain}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(scan.status)}>
                                {scan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{scan.maxCrawlPages}</TableCell>
                            <TableCell>{formatDate(scan.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Unassigned Local Campaigns */}
              {(data?.unassigned?.localCampaigns?.length ?? 0) > 0 && data && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Local Campaigns ({data.unassigned.localCampaigns.length})
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssign('localCampaigns')}
                          disabled={
                            isProcessing ||
                            selectedIds.localCampaigns.size === 0 ||
                            !selectedDomainId
                          }
                        >
                          <FolderInput className="mr-2 h-4 w-4" />
                          Assign ({selectedIds.localCampaigns.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleArchive('localCampaigns')}
                          disabled={
                            isProcessing || selectedIds.localCampaigns.size === 0
                          }
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive ({selectedIds.localCampaigns.size})
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                data.unassigned.localCampaigns.length > 0 &&
                                data.unassigned.localCampaigns.every((c) =>
                                  selectedIds.localCampaigns.has(c.id)
                                )
                              }
                              onCheckedChange={() =>
                                handleSelectAll(
                                  'localCampaigns',
                                  data.unassigned.localCampaigns
                                )
                              }
                            />
                          </TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Keywords</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.unassigned.localCampaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.localCampaigns.has(campaign.id)}
                                onCheckedChange={() =>
                                  handleToggleSelection('localCampaigns', campaign.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {campaign.businessName}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {campaign.keywords.slice(0, 2).join(', ')}
                              {campaign.keywords.length > 2 && '...'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(campaign.status)}>
                                {campaign.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived" className="space-y-4">
          {data?.archived.totalCount === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Archive className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Archived Data</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Archived items will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Archived Audits */}
              {(data?.archived?.audits?.length ?? 0) > 0 && data && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <FileSearch className="h-4 w-4" />
                        Archived SEO Audits ({data.archived.audits.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete('audits')}
                        disabled={isProcessing || selectedIds.audits.size === 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedIds.audits.size})
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                data.archived.audits.length > 0 &&
                                data.archived.audits.every((a) =>
                                  selectedIds.audits.has(a.id)
                                )
                              }
                              onCheckedChange={() =>
                                handleSelectAll('audits', data.archived.audits)
                              }
                            />
                          </TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Archived</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.archived.audits.map((audit) => (
                          <TableRow key={audit.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.audits.has(audit.id)}
                                onCheckedChange={() =>
                                  handleToggleSelection('audits', audit.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {audit.domain}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(audit.status)}>
                                {audit.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(audit.createdAt)}</TableCell>
                            <TableCell>{formatDate(audit.archivedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Archived Site Audit Scans */}
              {(data?.archived?.siteAuditScans?.length ?? 0) > 0 && data && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Archived Site Audits ({data.archived.siteAuditScans.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete('siteAuditScans')}
                        disabled={
                          isProcessing || selectedIds.siteAuditScans.size === 0
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedIds.siteAuditScans.size})
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                data.archived.siteAuditScans.length > 0 &&
                                data.archived.siteAuditScans.every((s) =>
                                  selectedIds.siteAuditScans.has(s.id)
                                )
                              }
                              onCheckedChange={() =>
                                handleSelectAll(
                                  'siteAuditScans',
                                  data.archived.siteAuditScans
                                )
                              }
                            />
                          </TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Archived</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.archived.siteAuditScans.map((scan) => (
                          <TableRow key={scan.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.siteAuditScans.has(scan.id)}
                                onCheckedChange={() =>
                                  handleToggleSelection('siteAuditScans', scan.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {scan.domain}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(scan.status)}>
                                {scan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(scan.createdAt)}</TableCell>
                            <TableCell>{formatDate(scan.archivedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Archived Local Campaigns */}
              {(data?.archived?.localCampaigns?.length ?? 0) > 0 && data && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Archived Local Campaigns (
                        {data.archived.localCampaigns.length})
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete('localCampaigns')}
                        disabled={
                          isProcessing || selectedIds.localCampaigns.size === 0
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedIds.localCampaigns.size})
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                data.archived.localCampaigns.length > 0 &&
                                data.archived.localCampaigns.every((c) =>
                                  selectedIds.localCampaigns.has(c.id)
                                )
                              }
                              onCheckedChange={() =>
                                handleSelectAll(
                                  'localCampaigns',
                                  data.archived.localCampaigns
                                )
                              }
                            />
                          </TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Archived</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.archived.localCampaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.localCampaigns.has(campaign.id)}
                                onCheckedChange={() =>
                                  handleToggleSelection('localCampaigns', campaign.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {campaign.businessName}
                            </TableCell>
                            <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                            <TableCell>{formatDate(campaign.archivedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
