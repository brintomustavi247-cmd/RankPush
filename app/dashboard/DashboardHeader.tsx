// components/dashboard/DashboardHeader.tsx
// Top navigation bar: logo, nav links, XP pill, notifications, PRO button, logout.

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Bell,
  Crown,
  LogOut,
  TrendingUp,
  ChevronDown,
  LayoutDashboard,
  User,
  Timer,
  Trophy,
  BarChart2,
} from "lucide-react";

import { RankInfo, UserStats } from "./RankSystem";

// ============================================================
// PROPS
// ============================================================
interface DashboardHeaderProps {
  user: any;
  stats: UserStats;
  rank: RankInfo;
  selectedSub: string;
  showNotif: boolean;
  isMobileMenuOpen: boolean;
  setShowNotif: (v: boolean) => void;
  setMobileMenu: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowProModal: (v: boolean) => void;
  setShowProfile: (v: boolean) => void;
  onSignOut: () => void;
}

// ============================================================
// COMPONENT
// ============================================================
export function DashboardHeader({
  user,
  stats,
  rank,
  selectedSub,
  showNotif,
  isMobileMenuOpen,
  setShowNotif,
  setMobileMenu,
  setShowProModal,
  setShowProfile,
  onSignOut,
}: DashboardHeaderProps) {
  const router = useRouter();

  const notifications = [
    {
      msg: "You ranked up to B-Rank! ⚡",
      time: "2m ago",
      color: "#22d3ee",
    },
    {
      msg: "Daily quest reset — new challenges!",
      time: "1h ago",
      color: "#f59e0b",
    },
    {
      msg: "ZeroOne challenged you ⚔️",
      time: "3h ago",
      color: "#ef4444",
    },
  ];

  const mobileMenuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      fn: () => { router.push("/"); setMobileMenu(false); },
      active: true,
    },
    {
      label: "Profile",
      icon: User,
      fn: () => { setShowProfile(true); setMobileMenu(false); },
      active: false,
    },
    {
      label: "Battle Arena",
      icon: Swords,
      fn: () => {
        router.push(`/arena/${selectedSub.toLowerCase()}`);
        setMobileMenu(false);
      },
      active: false,
    },
    {
      label: "Shadow Focus",
      icon: Timer,
      fn: () => { router.push("/timer"); setMobileMenu(false); },
      active: false,
    },
    {
      label: "Leaderboard",
      icon: Trophy,
      fn: () => {},
      active: false,
    },
    {
      label: "Analytics",
      icon: BarChart2,
      fn: () => {},
      active: false,
    },
  ];

  return (
    <header className="flex justify-between items-center mb-8 md:mb-10">
      {/* ── Left: Logo + Nav ── */}
      <div className="flex items-center gap-6 md:gap-10">
        {/* Logo / Mobile menu trigger */}
        <div className="relative">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenu((v) => !v);
            }}
          >
            <div className="p-2 md:p-2.5 bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.5)] border border-white/20 group-hover:scale-105 transition-transform">
              <Swords size={18} color="white" />
            </div>
            <span className="font-logo text-lg md:text-[22px] tracking-tight">
              RANKPUSH
            </span>
            <ChevronDown
              size={14}
              className={`text-white/40 transition-transform duration-300 xl:hidden ${
                isMobileMenuOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Mobile dropdown menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-4 w-64 bg-[#0a0f1e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-1 xl:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {mobileMenuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.fn}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs tracking-widest uppercase transition-colors ${
                      item.active
                        ? "bg-cyan-400/10 text-cyan-400"
                        : "hover:bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden xl:flex gap-7">
          <a href="#" className="nav-link active">
            Dashboard
          </a>
          <a
            href="#"
            className="nav-link"
            onClick={() =>
              router.push(`/arena/${selectedSub.toLowerCase()}`)
            }
          >
            Battle Arena
          </a>
          <a
            href="#"
            className="nav-link"
            onClick={() => router.push("/timer")}
          >
            Shadow Focus
          </a>
          <a href="#" className="nav-link">
            Leaderboard
          </a>
          <a href="#" className="nav-link">
            Analytics
          </a>
        </nav>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Weekly XP pill */}
        <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
          <TrendingUp size={14} color="#22c55e" />
          <span className="text-[11px] font-extrabold text-green-500 tracking-widest">
            +{stats.weeklyXP.toLocaleString()} THIS WEEK
          </span>
        </div>

        {/* Online count */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <div
            className="w-2 h-2 rounded-full bg-green-500"
            style={{ boxShadow: "0 0 8px #22c55e" }}
          />
          <span className="text-[11px] font-extrabold tracking-widest opacity-70">
            3,892 ONLINE
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="bg-white/5 border border-white/10 rounded-xl p-2.5 cursor-pointer text-white flex"
          >
            <Bell size={18} />
          </button>
          {/* Badge */}
          <div className="badge-bounce absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-[#02010a]">
            3
          </div>
          {/* Dropdown */}
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-12 -right-14 md:right-0 w-[270px] md:w-72 bg-[#0d1420] border border-white/10 rounded-2xl p-4 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              >
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className={`py-2.5 ${
                      i < notifications.length - 1
                        ? "border-b border-white/5"
                        : ""
                    }`}
                  >
                    <p className="text-xs text-white/80 mb-1">{n.msg}</p>
                    <p className="text-[10px]" style={{ color: n.color }}>
                      {n.time}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PRO / Plan button */}
        {stats.plan === "free" ? (
          <button
            onClick={() => setShowProModal(true)}
            className="bg-gradient-to-br from-violet-600 to-purple-500 border-none rounded-xl px-3 py-2 md:px-4 md:py-2.5 cursor-pointer text-white font-black text-[10px] md:text-xs tracking-widest flex items-center gap-1.5"
          >
            <Crown size={14} />
            <span className="hidden sm:inline">GO PRO</span>
          </button>
        ) : (
          <div className="bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl px-3 py-2 text-[10px] font-black tracking-widest flex items-center gap-1.5">
            <Crown size={14} /> PRO
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 cursor-pointer text-red-500 flex"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}