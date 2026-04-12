// components/dashboard/DashboardModals.tsx
// All overlay/modal components for the dashboard.

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  CheckCircle,
  Lock,
  Calendar,
  Swords,
  Clock,
  Flame,
  Crown,
  Wifi,
  Copy,
  ArrowRight,
} from "lucide-react";

import {
  RANKS,
  ACHIEVEMENTS,
  getRankByXP,
  getNextRank,
  getXPProgress,
  UserStats,
  RankInfo,
} from "./RankSystem";
import { RankBadge, StatBar } from "./UIComponents";

// ============================================================
// RANK MODAL — Full rank progression overview
// ============================================================
interface RankModalProps {
  onClose: () => void;
  currentXP: number;
}

export function RankModal({ onClose, currentXP }: RankModalProps) {
  const currentRank = getRankByXP(currentXP);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: "#080613",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          maxWidth: 520,
          width: "100%",
          padding: 28,
          maxHeight: "85vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.05)",
            border: "none",
            color: "white",
            borderRadius: 8,
            padding: 6,
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "#22d3ee",
              marginBottom: 8,
            }}
          >
            SYSTEM · RANK PROGRESSION
          </p>
          <h2
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "0.1em",
            }}
          >
            Hunter Rank System
          </h2>
        </div>

        {/* Rank list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RANKS.map((r) => {
            const isCurrent = r.id === currentRank.id;
            const isUnlocked = currentXP >= r.minXP;
            return (
              <div
                key={r.id}
                className="rank-card-hover"
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: isCurrent
                    ? r.bgColor
                    : "rgba(255,255,255,0.02)",
                  border: isCurrent
                    ? `1px solid ${r.color}66`
                    : "1px solid rgba(255,255,255,0.05)",
                  opacity: isUnlocked ? 1 : 0.45,
                  boxShadow: isCurrent
                    ? `0 0 20px ${r.glowColor}`
                    : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      width: 32,
                      textAlign: "center",
                    }}
                  >
                    {r.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: 12,
                          fontWeight: 900,
                          color: r.color,
                          letterSpacing: "0.1em",
                        }}
                      >
                        {r.name}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: `${r.color}88`,
                          fontStyle: "italic",
                        }}
                      >
                        {r.title}
                      </p>
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: r.bgColor,
                            border: `1px solid ${r.color}44`,
                            color: r.color,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                          }}
                        >
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {r.description}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {r.maxXP === Infinity
                        ? `${r.minXP.toLocaleString()}+`
                        : `${r.minXP.toLocaleString()} – ${r.maxXP.toLocaleString()}`}
                    </p>
                    <p
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.2)",
                      }}
                    >
                      XP
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// PROFILE MODAL
// ============================================================
interface ProfileModalProps {
  onClose: () => void;
  user: any;
  stats: UserStats;
}

type ProfileTab = "overview" | "stats" | "achievements";

export function ProfileModal({ onClose, user, stats }: ProfileModalProps) {
  const rank = getRankByXP(stats.xp);
  const nextRank = getNextRank(rank);
  const xpPct = getXPProgress(stats.xp, rank);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  const tabStyle = (t: ProfileTab): React.CSSProperties => ({
    flex: 1,
    padding: "10px",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background:
      activeTab === t ? "rgba(34,211,238,0.1)" : "transparent",
    border:
      activeTab === t
        ? "1px solid rgba(34,211,238,0.3)"
        : "1px solid transparent",
    color: activeTab === t ? "#22d3ee" : "rgba(255,255,255,0.3)",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "#06040f",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 28,
          maxWidth: 560,
          width: "100%",
          overflow: "hidden",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* ── Header BG ── */}
        <div
          style={{
            height: 120,
            background: `linear-gradient(135deg, ${rank.bgColor}, rgba(0,0,0,0))`,
            borderBottom: `1px solid ${rank.color}22`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: rank.color,
              opacity: 0.06,
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 16,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 48,
              fontWeight: 900,
              opacity: 0.06,
              letterSpacing: "-2px",
            }}
          >
            {rank.name.toUpperCase()}
          </div>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "0 24px 28px", marginTop: -48 }}>
          {/* ── Avatar Row ── */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  border: `3px solid ${rank.color}`,
                  boxShadow: `0 0 24px ${rank.glowColor}`,
                  overflow: "hidden",
                }}
              >
                <img
                  src={
                    user?.photoURL ||
                    "https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  alt="avatar"
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: -4,
                  background: `linear-gradient(135deg, ${rank.color}, ${rank.color}bb)`,
                  borderRadius: 8,
                  padding: "3px 7px",
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 9,
                  fontWeight: 900,
                  border: "2px solid #06040f",
                }}
              >
                LVL {stats.level}
              </div>
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <h2
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                {user?.displayName || "CYBER HUNTER"}
              </h2>
              <RankBadge rank={rank} size="sm" />
            </div>
          </div>

          {/* ── XP Bar ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 18,
                    fontWeight: 900,
                    color: rank.color,
                  }}
                >
                  {stats.xp.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    marginLeft: 6,
                  }}
                >
                  XP
                </span>
              </div>
              {nextRank && (
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.3)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    NEXT RANK
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: nextRank.color,
                      fontFamily: "'Orbitron', sans-serif",
                    }}
                  >
                    {nextRank.name}
                  </p>
                </div>
              )}
            </div>
            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                className="xp-bar"
                style={{
                  height: "100%",
                  width: `${xpPct}%`,
                  background: `linear-gradient(90deg, ${rank.color}, ${rank.color}bb)`,
                  borderRadius: 3,
                  boxShadow: `0 0 8px ${rank.glowColor}`,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
              }}
            >
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
                {xpPct}% to {nextRank?.name || "MAX"}
              </span>
              {nextRank && (
                <span
                  style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}
                >
                  {(nextRank.minXP - stats.xp).toLocaleString()} XP needed
                </span>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              padding: 4,
              marginBottom: 18,
            }}
          >
            {(["overview", "stats", "achievements"] as ProfileTab[]).map(
              (t) => (
                <button
                  key={t}
                  style={tabStyle(t)}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              )
            )}
          </div>

          {/* ── Tab: Overview ── */}
          {activeTab === "overview" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  {
                    l: "Member since",
                    v: stats.joinDate,
                    Icon: Calendar,
                    c: "#22d3ee",
                  },
                  {
                    l: "Total battles",
                    v: stats.totalBattles,
                    Icon: Swords,
                    c: "#f59e0b",
                  },
                  {
                    l: "Hours studied",
                    v: `${stats.totalHoursStudied}h`,
                    Icon: Clock,
                    c: "#a855f7",
                  },
                  {
                    l: "Daily streak",
                    v: `${stats.streak} days 🔥`,
                    Icon: Flame,
                    c: "#f97316",
                  },
                ].map((item) => (
                  <div
                    key={item.l}
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
                    <item.Icon
                      size={16}
                      color={item.c}
                      style={{ flexShrink: 0 }}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: 9,
                          color: "rgba(255,255,255,0.3)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.l}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "white",
                          marginTop: 2,
                        }}
                      >
                        {item.v}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rank Journey */}
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 14,
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Rank Journey
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                  }}
                >
                  {RANKS.map((r, i) => {
                    const unlocked = stats.xp >= r.minXP;
                    const isCurrent =
                      r.id === getRankByXP(stats.xp).id;
                    return (
                      <React.Fragment key={r.id}>
                        <div
                          title={r.name}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            flex: "0 0 auto",
                          }}
                        >
                          <div
                            style={{
                              width: isCurrent ? 34 : 26,
                              height: isCurrent ? 34 : 26,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: unlocked
                                ? r.bgColor
                                : "rgba(255,255,255,0.04)",
                              border: isCurrent
                                ? `2px solid ${r.color}`
                                : unlocked
                                ? `1px solid ${r.color}55`
                                : "1px solid rgba(255,255,255,0.08)",
                              fontSize: isCurrent ? 16 : 12,
                              boxShadow: isCurrent
                                ? `0 0 14px ${r.glowColor}`
                                : "none",
                              transition: "all 0.3s",
                            }}
                          >
                            {r.icon}
                          </div>
                          {isCurrent && (
                            <div
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                background: r.color,
                              }}
                            />
                          )}
                        </div>
                        {i < RANKS.length - 1 && (
                          <div
                            style={{
                              height: 1,
                              flex: 1,
                              background:
                                stats.xp >= RANKS[i + 1].minXP
                                  ? `linear-gradient(90deg, ${r.color}66, ${RANKS[i + 1].color}66)`
                                  : "rgba(255,255,255,0.06)",
                              minWidth: 4,
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Stats ── */}
          {activeTab === "stats" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  {
                    l: "Questions attempted",
                    v: stats.questionsAttempted.toLocaleString(),
                    c: "#22d3ee",
                  },
                  {
                    l: "Correct answers",
                    v: stats.correctAnswers.toLocaleString(),
                    c: "#34d399",
                  },
                  { l: "Accuracy", v: `${stats.accuracy}%`, c: "#f59e0b" },
                  {
                    l: "Total XP earned",
                    v: stats.xp.toLocaleString(),
                    c: "#a855f7",
                  },
                ].map((s) => (
                  <div
                    key={s.l}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                      padding: "14px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 20,
                        fontWeight: 900,
                        color: s.c,
                      }}
                    >
                      {s.v}
                    </p>
                    <p
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>

              {/* Neural Attributes inside stats tab */}
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 14,
                  padding: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  Neural Attributes
                </p>
                <div className="flex flex-col gap-3">
                  <StatBar
                    label="Accuracy"
                    value={stats.accuracy}
                    display={`${stats.accuracy}%`}
                    color="#22d3ee"
                  />
                  <StatBar
                    label="Speed"
                    value={stats.speed}
                    display={`${stats.speed}%`}
                    color="#0ea5e9"
                  />
                  <StatBar
                    label="Logic"
                    value={stats.logic}
                    display={`${stats.logic}%`}
                    color="#34d399"
                  />
                  <StatBar
                    label="Focus"
                    value={stats.focus}
                    display={`${stats.focus}%`}
                    color="#a855f7"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Achievements ── */}
          {activeTab === "achievements" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.title}
                  style={{
                    borderRadius: 14,
                    padding: "14px 12px",
                    textAlign: "center",
                    background: a.unlocked
                      ? "rgba(34,211,238,0.05)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${
                      a.unlocked
                        ? "rgba(34,211,238,0.2)"
                        : "rgba(255,255,255,0.05)"
                    }`,
                    opacity: a.unlocked ? 1 : 0.45,
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 8 }}>
                    {a.icon}
                  </div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: a.unlocked ? "#22d3ee" : "white",
                      marginBottom: 2,
                    }}
                  >
                    {a.title}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: 6,
                    }}
                  >
                    {a.desc}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: "#f59e0b",
                    }}
                  >
                    +{a.xp} XP
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// PRO UPGRADE MODAL
// ============================================================
interface ProUpgradeModalProps {
  onClose: () => void;
}

export function ProUpgradeModal({ onClose }: ProUpgradeModalProps) {
  const features = [
    "Unlimited questions — all subjects",
    "S-Rank & above unlocked",
    "Rival Battle System (1v1 real-time)",
    "Boss Fight mode",
    "Detailed analytics & heatmaps",
    "Unlimited power-ups",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(10px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: "linear-gradient(135deg, #0a0f1e, #111827)",
          border: "1px solid rgba(168,85,247,0.4)",
          borderRadius: 24,
          maxWidth: 420,
          width: "100%",
          padding: 32,
          position: "relative",
          boxShadow: "0 0 60px rgba(168,85,247,0.2)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.05)",
            border: "none",
            color: "white",
            borderRadius: 8,
            padding: 6,
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
          <h2
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 22,
              color: "#a855f7",
              marginBottom: 8,
            }}
          >
            UPGRADE TO PRO
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            Unlock your full potential
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {features.map((f) => (
            <div
              key={f}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <CheckCircle size={16} color="#a855f7" />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                {f}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              flex: 1,
              padding: "14px 0",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ৳১৯৯/month
          </button>
          <button
            style={{
              flex: 1,
              padding: "14px 0",
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: 12,
              color: "#a855f7",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ৳১৪৯৯/year
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: 11,
            marginTop: 12,
          }}
        >
          bKash • Nagad • Card accepted
        </p>
      </motion.div>
    </div>
  );
}

// ============================================================
// RIVAL MODAL
// ============================================================
interface RivalModalProps {
  onClose: () => void;
}

export function RivalModal({ onClose }: RivalModalProps) {
  const [copied, setCopied] = useState(false);
  const link = "https://rank-push.vercel.app/rival/abc123";

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(10px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: "linear-gradient(135deg, #0a0f1e, #111827)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 24,
          maxWidth: 400,
          width: "100%",
          padding: 32,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.05)",
            border: "none",
            color: "white",
            borderRadius: 8,
            padding: 6,
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
          <h2
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 20,
              color: "#ef4444",
              marginBottom: 8,
            }}
          >
            RIVAL BATTLE
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            Challenge a friend to 1v1 MCQ battle
          </p>
        </div>

        <div
          style={{
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            wordBreak: "break-all",
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {link}
        </div>

        <button
          onClick={handleCopy}
          style={{
            width: "100%",
            padding: "14px 0",
            background: copied
              ? "rgba(34,197,94,0.2)"
              : "linear-gradient(135deg, #dc2626, #ef4444)",
            border: copied ? "1px solid #22c55e" : "none",
            borderRadius: 12,
            color: "white",
            fontWeight: 900,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {copied ? "✓ Copied!" : "Copy Battle Link"}
        </button>

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: 11,
            marginTop: 12,
          }}
        >
          PRO feature — Share via WhatsApp
        </p>
      </motion.div>
    </div>
  );
}