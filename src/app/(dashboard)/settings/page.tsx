import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Archive, ChevronRight } from 'lucide-react'

export default function SettingsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Archive Management */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Data Archive
            </CardTitle>
            <CardDescription>
              Manage unassigned data and view archived items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/settings/archive">
                Manage Archive
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Coming Soon Card */}
        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Profile, notifications, and API configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
