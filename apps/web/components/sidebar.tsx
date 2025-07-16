import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  createdAt: string;
}

interface SidebarProps {
  user: User | null;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

const sidebarItems: SidebarItem[] = [
  { id: 'profile', label: 'Public Profile', icon: '👤' },
  { id: 'ai-keys', label: 'AI API Keys', icon: '🤖' },
  { id: 'trading-keys', label: 'Trading Keys', icon: '📈' },
];

export default function Sidebar({ user, activeSection, onSectionChange, onLogout }: SidebarProps) {
  return (
    <div className="w-96 bg-white shadow-lg min-h-screen">
      <div className="p-6">
        {/* Profile Section */}
        <div className="flex items-center space-x-3 mb-8">
          <Image
            src={user?.profilePicture || '/profile-picture.svg'}
            alt="Profile Picture"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">
              {user?.firstName || user?.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'User'}
            </h3>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-2">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="mt-8 pt-8 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be redirected to the login page and will need to sign in again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onLogout}>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
