import PageLayout from '@/components/layout/page-layout';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">0 notifications</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      </div>
    </PageLayout>
  );
}
