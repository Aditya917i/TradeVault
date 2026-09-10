"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  LineChart,
  CalendarDays,
  TrendingUp,
  Brain,
  FlaskConical,
  Users,
  Wrench,
  Settings,
  HelpCircle,
  CreditCard,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Trades", href: "/trades", icon: BarChart3 },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Analysis", href: "/analysis", icon: LineChart },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Market", href: "/market", icon: TrendingUp },
  { name: "AI Report", href: "/ai-report", icon: Brain },
  { name: "Backtesting", href: "/backtesting", icon: FlaskConical },
  { name: "Traders Lounge", href: "/traders-lounge", icon: Users },
  { name: "Tools", href: "/tools", icon: Wrench },
];

const accountNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
  { name: "Subscription", href: "/subscription", icon: CreditCard },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-white/10 bg-[#0a0d12] lg:flex">
      
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 font-black text-black">
            TV
          </div>

          <div>
            <div className="text-lg font-bold">
              Trade<span className="text-yellow-400">Vault</span>
            </div>

            <div className="text-[10px] uppercase tracking-wider text-gray-500">
              Trading Journal
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          Main Menu
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          Account
        </p>

        <div className="space-y-1">
          {accountNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
            AD
          </div>

          <div>
            <div className="text-sm font-semibold">Trader</div>
            <div className="text-xs text-gray-500">
              Personal Account
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}