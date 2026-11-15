"use client";

import { usePathname, useRouter } from "next/navigation";
import { translations, Language } from "@/lib/translations";
import {
  Home,
  TrendingUp,
  PackageCheck,
  Users,
  BotMessageSquare,
} from "lucide-react";

interface NavigationProps {
  currentLang: Language;
}

export default function Navigation({ currentLang }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = translations[currentLang].tabs;

  const tabs = [
    { name: t.home, path: "/home", icon: Home },
    { name: t.sales, path: "/sales", icon: TrendingUp },
    { name: t.stock, path: "/inventory", icon: PackageCheck },
    { name: t.customers, path: "/customers", icon: Users },
    { name: t.copilot, path: "/copilot", icon: BotMessageSquare, highlight: true },
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-white border-t border-slate-100 shadow-[0_-2px_12px_rgba(0,46,110,0.08)]">
      <div className="flex items-end justify-around px-1 pt-1 pb-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;

          if (tab.highlight) {
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className="flex flex-col items-center justify-center -mt-5 relative"
              >
                {/* Floating Copilot button — Paytm style raised CTA */}
                <div
                  className={`w-13 h-13 w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                    isActive
                      ? "bg-[#002E6E] ring-2 ring-[#00BAF2] ring-offset-1"
                      : "bg-[#00BAF2] hover:bg-[#00a3d4]"
                  }`}
                  style={{ boxShadow: "0 4px 16px rgba(0, 186, 242, 0.45)" }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 ${
                    isActive ? "text-[#002E6E]" : "text-slate-500"
                  }`}
                >
                  {tab.name}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className="flex flex-col items-center justify-center py-1 px-3 relative transition-all active:scale-95"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-[#00BAF2]" : "text-slate-400"
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive ? "text-[#00BAF2] font-bold" : "text-slate-400"
                }`}
              >
                {tab.name}
              </span>
              {/* Active dot indicator — Paytm style */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00BAF2]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
