import { DashboardLayout } from '@/components/layout'

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return <DashboardLayout>{children}</DashboardLayout>
}
