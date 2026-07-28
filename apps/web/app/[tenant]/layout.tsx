import type { Metadata } from 'next';
import DashboardShell from './dashboard-shell';

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant } = await params;
  return {
    title: {
      default: tenant.toUpperCase(),
      template: `%s — ${tenant.toUpperCase()} | Assos 2.0`,
    },
  };
}

export default async function TenantLayout({ children, params }: Props) {
  const { tenant } = await params;

  return (
    <div data-tenant={tenant}>
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
