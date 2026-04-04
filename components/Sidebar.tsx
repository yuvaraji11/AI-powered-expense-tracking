'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Wallet,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useCurrency } from '@/lib/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const symbol = useCurrency();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-foreground">Nebula AI</h1>
          <p className="text-xs text-muted-foreground">Expense Tracker</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-2">Quick tip</p>
          <p className="text-sm text-muted-foreground">
            Type &quot;spent {symbol}200 on lunch&quot; in the chat to add expenses instantly!
          </p>
        </div>
      </div>
    </aside>
  );
}
