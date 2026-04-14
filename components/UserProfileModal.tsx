"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  X,
  Clock,
  Flame,
  Zap,
  BookOpen,
  UserPlus,
  Loader2,
  AlertCircle,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ============================================================
// RANK SYSTEM (duplicated locally to avoid circular imports)
// ============================================================
interface RankInfo {
  id: string;
  name: string;
  title: string;
  color: string;
  glowColor: string;
  bgColor: string;
  icon: string;
  minXP: number;
  maxXP: number;
}

const RANKS: RankInfo[] = [
  { id: "e",              name: "E-Rank",         title: "Weakest Hunter",   color: "#6b7280", glowColor: "rgba(107,114,128,0.4)", bgColor: "rgba(107,114,128,0.08)", icon: "🪨",  minXP: 0,      maxXP: 1999     },
  { id: "d",              name: "D-Rank",         title: "Awakened Hunter",  color: "#b45309", glowColor: "rgba(180,83,9,0.4)",    bgColor: "rgba(180,83,9,0.08)",    icon: "🔰",  minXP: 2000,   maxXP: 5999     },
  { id: "c",              name: "C-Rank",         title: "Gate Raider",      color: "#0ea5e9", glowColor: "rgba(14,165,233,0.4)",  bgColor: "rgba(14,165,233,0.08)",  icon: "🌀",  minXP: 6000,   maxXP: 13999    },
  { id: "b",              name: "B-Rank",         title: "Elite Fighter",    color: "#22d3ee", glowColor: "rgba(34,211,238,0.4)",  bgColor: "rgba(34,211,238,0.08)",  icon: "⚡",  minXP: 14000,  maxXP: 27999    },
  { id: "a",              name: "A-Rank",         title: "Dungeon Breaker",  color: "#a855f7", glowColor: "rgba(168,85,247,0.4)",  bgColor: "rgba(168,85,247,0.08)",  icon: "💜",  minXP: 28000,  maxXP: 49999    },
  { id: "s",              name: "S-Rank",         title: "Sovereign Hunter", color: "#f59e0b", glowColor: "rgba(245,158,11,0.5)",  bgColor: "rgba(245,158,11,0.08)",  icon: "👑",  minXP: 50000,  maxXP: 79999    },
  { id: "national",       name: "National Level", title: "Absolute Monarch", color: "#ec4899", glowColor: "rgba(236,72,153,0.5)",  bgColor: "rgba(236,72,153,0.08)",  icon: "🔱",  minXP: 80000,  maxXP: 119999   },
  { id: "shadow_monarch", name: "Shadow Monarch", title: "Arise.",           color: "#c084fc", glowColor: "rgba(192,132,252,0.6)", bgColor: "rgba(192,132,252,0.08)", icon: "⚔️", minXP: 120000, maxXP: Infinity },
];

const getRankByXP = (xp: number): RankInfo =>
  RANKS.find((r) => xp >= r.minXP && xp <= r.maxXP) || RANKS[0];

// ============================================================
// WEEKLY CHART TOOLTIP
// ============================================================
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(8,6,19,0.95)",
          border: "1px solid rgba(34,211,238,0.25)",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 10,
          color: "#22d3ee",
          fontWeight: 800,
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        {label}: {payload[0].value.toFixed(1)}h
      </div>
    );
  }
  return null;
};

// ============================================================
// PROPS
// ============================================================
interface UserProfileModalProps {
  /** Firestore uid of the user to display */
  userId: string;
  /** Uid of the currently logged-in viewer (to prevent self-request) */
  viewerUid?: string;
  onClose: () => void;
}

// ============================================================
// COMPONENT
// ============================================================
export function UserProfileModal({
  userId,
  viewerUid,
  onClose,
}: UserProfileModalProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  // Real-time subscription to the target user's Firestore document
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      doc(db, "users", userId),
      (snap) => {
        if (snap.exists()) {
          setProfileData({ uid: snap.id, ...snap.data() });
        } else {
          setError("User profile not found.");
        }
        setLoading(false);
      },
      () => {
        setError("Failed to load profile. Please try again.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Send friend request — writes to target user's friendRequests sub-collection
  const handleSendRequest = async () => {
    if (requestSent || requestLoading || !viewerUid) return;
    setRequestLoading(true);
    try {
      await addDoc(collection(db, "users", userId, "friendRequests"), {
        fromUid: viewerUid,
        createdAt: serverTimestamp(),
        status: "pending",
      });
      setRequestSent(true);
    } catch {
      // Silently fail — button resets
    } finally {
      setRequestLoading(false);
    }
  };

  const rank = profileData ? getRankByXP(profileData.xp || 0) : RANKS[0];

  // Build last-7-days weekly activity
  const weeklyData = (() => {
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const raw: number[] = Array.isArray(profileData?.weeklyStudyHours)
      ? profileData.weeklyStudyHours
      : Array(7).fill(0);
    // Pad or trim to exactly 7 entries
    const padded = [...raw, ...Array(7).fill(0)].slice(0, 7);
    return dayLabels.map((day, i) => ({ day, hours: +(padded[i] || 0).toFixed(2) }));
  })();

  const isSelf = viewerUid === userId;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(14px)",
        }}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "#06040f",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 28,
            maxWidth: 480,
            width: "100%",
            overflow: "hidden",
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          {/* ── Header Banner ── */}
          <div
            style={{
              height: 110,
              background: `linear-gradient(135deg, ${rank.bgColor}, rgba(0,0,0,0))`,
              borderBottom: `1px solid ${rank.color}22`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow orb */}
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: rank.color,
                opacity: 0.07,
                filter: "blur(40px)",
              }}
            />
            {/* Watermark rank name */}
            {!loading && profileData && (
              <div
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 14,
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 40,
                  fontWeight: 900,
                  opacity: 0.07,
                  letterSpacing: "-1px",
                  color: "white",
                  userSelect: "none",
                }}
              >
                {rank.name.toUpperCase()}
              </div>
            )}
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                borderRadius: 8,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "0 24px 28px", marginTop: -48 }}>
            {/* ── Loading state ── */}
            {loading && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 0",
                  gap: 12,
                }}
              >
                <Loader2
                  size={32}
                  color="#22d3ee"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <p
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.15em",
                  }}
                >
                  LOADING PROFILE...
                </p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* ── Error state ── */}
            {!loading && error && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 0",
                  gap: 10,
                }}
              >
                <AlertCircle size={32} color="#ef4444" />
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    textAlign: "center",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* ── Profile content ── */}
            {!loading && profileData && (
              <>
                {/* Avatar + Name row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 82,
                        height: 82,
                        borderRadius: "50%",
                        border: `3px solid ${rank.color}`,
                        boxShadow: `0 0 20px ${rank.glowColor}`,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={
                          profileData.photoURL ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`
                        }
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        alt={profileData.displayName || "User"}
                      />
                    </div>
                    {/* Rank icon badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: -4,
                        background: `linear-gradient(135deg, ${rank.color}, ${rank.color}bb)`,
                        borderRadius: 8,
                        padding: "2px 7px",
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 8,
                        fontWeight: 900,
                        border: "2px solid #06040f",
                        color: "white",
                      }}
                    >
                      {rank.icon}
                    </div>
                  </div>

                  {/* Name + rank */}
                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <h2
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 16,
                        fontWeight: 900,
                        letterSpacing: "0.04em",
                        marginBottom: 4,
                        color: "white",
                        lineHeight: 1.2,
                      }}
                    >
                      {profileData.displayName || "HUNTER"}
                    </h2>
                    {/* Rank badge */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: rank.bgColor,
                        border: `1px solid ${rank.color}44`,
                        borderRadius: 20,
                        padding: "3px 10px",
                      }}
                    >
                      <span style={{ fontSize: 10 }}>{rank.icon}</span>
                      <span
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: 8,
                          fontWeight: 900,
                          color: rank.color,
                          letterSpacing: "0.1em",
                        }}
                      >
                        {rank.name} · {rank.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Bio ── */}
                {profileData.bio && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      marginBottom: 16,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.6,
                        fontStyle: "italic",
                      }}
                    >
                      "{profileData.bio}"
                    </p>
                  </div>
                )}

                {/* ── XP strip ── */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Trophy size={14} color="#f59e0b" />
                    <span
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 18,
                        fontWeight: 900,
                        color: rank.color,
                      }}
                    >
                      {(profileData.xp || 0).toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      EXP
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: rank.color,
                      background: rank.bgColor,
                      border: `1px solid ${rank.color}33`,
                      borderRadius: 20,
                      padding: "3px 9px",
                      fontFamily: "'Orbitron', sans-serif",
                      letterSpacing: "0.1em",
                    }}
                  >
                    LVL {profileData.level || 1}
                  </span>
                </div>

                {/* ── Stats grid ── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  {[
                    {
                      label: "Study Hours",
                      value: `${(profileData.totalHoursStudied || 0).toFixed(1)}h`,
                      icon: Clock,
                      color: "#22d3ee",
                    },
                    {
                      label: "Daily Streak",
                      value: `${profileData.streak || 0} 🔥`,
                      icon: Flame,
                      color: "#f59e0b",
                    },
                    {
                      label: "Total XP",
                      value: (profileData.xp || 0).toLocaleString(),
                      icon: Zap,
                      color: "#a855f7",
                    },
                    {
                      label: "Questions",
                      value: (profileData.questionsAttempted || 0).toLocaleString(),
                      icon: BookOpen,
                      color: "#34d399",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <s.icon size={16} color={s.color} style={{ flexShrink: 0 }} />
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: s.color,
                            lineHeight: 1,
                            marginBottom: 2,
                          }}
                        >
                          {s.value}
                        </p>
                        <p
                          style={{
                            fontSize: 8,
                            color: "rgba(255,255,255,0.35)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {s.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Weekly Study Activity ── */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16,
                    padding: "14px 16px",
                    marginBottom: 20,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      marginBottom: 12,
                    }}
                  >
                    📅 Weekly Study Activity
                  </p>

                  {weeklyData.every((d) => d.hours === 0) ? (
                    <p
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.2)",
                        textAlign: "center",
                        padding: "12px 0",
                      }}
                    >
                      No study activity recorded this week.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart
                        data={weeklyData}
                        margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="day"
                          tick={{
                            fill: "rgba(255,255,255,0.35)",
                            fontSize: 9,
                            fontWeight: 700,
                            fontFamily: "'Orbitron', sans-serif",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fill: "rgba(255,255,255,0.2)",
                            fontSize: 8,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                          {weeklyData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.hours > 0 ? rank.color : "rgba(255,255,255,0.08)"}
                              opacity={entry.hours > 0 ? 0.85 : 1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* ── Action buttons ── */}
                {!isSelf && (
                  <button
                    onClick={handleSendRequest}
                    disabled={requestSent || requestLoading}
                    style={{
                      width: "100%",
                      padding: "12px 0",
                      borderRadius: 14,
                      border: requestSent
                        ? "1px solid rgba(34,197,94,0.4)"
                        : "1px solid rgba(34,211,238,0.35)",
                      background: requestSent
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(34,211,238,0.1)",
                      color: requestSent ? "#22c55e" : "#22d3ee",
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      cursor: requestSent || requestLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s",
                      opacity: requestLoading ? 0.7 : 1,
                    }}
                  >
                    {requestLoading ? (
                      <Loader2
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <UserPlus size={14} />
                    )}
                    {requestSent
                      ? "Request Sent ✓"
                      : requestLoading
                      ? "Sending..."
                      : "Send Friend Request"}
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
