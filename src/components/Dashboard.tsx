import { useState } from "react";
import type { Trip, Expense, Settlement } from "../types";
import { CATEGORIES, CURRENCIES } from "../constants";
import { getMemberColor, getInitial, formatJPY } from "../constants";
import { exportCSV } from "../utils/csv";
import { S } from "../styles";

const APP_URL = "https://tabiwarikannapp.vercel.app";

interface Props {
  trip: Trip;
  settlement: Settlement;
  onBack: () => void;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenMember: (name: string) => void;
}

export function Dashboard({
  trip,
  settlement,
  onBack,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onOpenMember,
}: Props) {
  const [copied, setCopied] = useState(false);
  const foreignCurrency = CURRENCIES.find((c) => c.code === trip.foreignCurrency);
  const foreignSymbol = foreignCurrency?.symbol || "$";

  const toJPY = (amt: number, cur: string) =>
    cur === "JPY" ? amt : amt * (parseFloat(String(trip.exchangeRate)) || 0);

  const handleCopyLink = () => {
    const url = `${APP_URL}/?t=${trip.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={S.container}>
      <div style={S.topBar}>
        <button style={S.navBtn} onClick={onBack}>← 一覧</button>
        <div style={S.topTitle}>{trip.name}</div>
        <button style={S.exportBtn} onClick={() => exportCSV(trip)}>
          CSV
        </button>
      </div>

      {/* 招待バナー */}
      <div style={{
        textAlign: "center", padding: "10px 16px", borderRadius: 14,
        background: "rgba(255,255,255,0.6)", border: "1px dashed #C4B9A5", marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, color: "#A89F8E", marginBottom: 6 }}>
          このリンクを友達にシェアして一緒に入力しよう
        </div>
        <button style={{
          ...S.exportBtn, width: "100%", padding: "8px 0",
          background: copied ? "#2D7A4F" : "#FDFBF7",
          color: copied ? "#fff" : "#6B5F4F",
          borderColor: copied ? "#2D7A4F" : "#C4B9A5",
        }} onClick={handleCopyLink}>
          {copied ? "✓ コピーしました！" : "🔗 招待リンクをコピー"}
        </button>
      </div>

      {/* Live settlement summary */}
      <div style={S.liveSettlement}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#FDFBF7", opacity: 0.8, letterSpacing: 1 }}>
            LIVE STATUS
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#FDFBF7" }}>
            {formatJPY(settlement?.total || 0)}
          </span>
        </div>

        {settlement?.transfers?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {settlement.transfers.map((t, i) => (
              <div key={i} style={S.liveTransfer}>
                <span style={{ fontWeight: 600 }}>{t.from}</span>
                <span style={{ flex: 1, textAlign: "center", fontSize: 12, opacity: 0.7 }}>
                  → {formatJPY(t.amount)} →
                </span>
                <span style={{ fontWeight: 600 }}>{t.to}</span>
              </div>
            ))}
          </div>
        ) : trip.expenses.length > 0 ? (
          <div style={{ textAlign: "center", color: "#FDFBF7", opacity: 0.8, fontSize: 13, padding: "6px 0" }}>
            全員イーブン 🎉
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#FDFBF7", opacity: 0.6, fontSize: 13, padding: "6px 0" }}>
            支出を追加すると精算状況が表示されます
          </div>
        )}
      </div>

      {/* Member cards row */}
      <div style={S.memberRow}>
        {trip.members.map((m, i) => {
          const bal = settlement?.balances?.[m] || 0;
          return (
            <button key={m} style={S.memberCard} onClick={() => onOpenMember(m)}>
              <div style={{ ...S.avatarMd, background: getMemberColor(i) }}>{getInitial(m)}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#3A3228",
                  marginTop: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 70,
                }}
              >
                {m}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  marginTop: 2,
                  color: bal > 0.5 ? "#2D7A4F" : bal < -0.5 ? "#C25E4A" : "#8B7E6A",
                }}
              >
                {bal > 0.5 ? `+${formatJPY(bal)}` : bal < -0.5 ? formatJPY(bal) : "±0"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expense list */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, color: "#3A3228" }}>
          支出一覧（{trip.expenses.length}件）
        </h3>
      </div>

      {trip.expenses.length === 0 ? (
        <div style={S.emptyBlock}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
          <p style={{ color: "#8B7E6A", margin: 0, fontSize: 14 }}>まだ支出がありません</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...trip.expenses].reverse().map((exp) => {
            const cat = CATEGORIES.find((c) => c.id === exp.category);
            const pi = trip.members.indexOf(exp.payer);
            return (
              <div key={exp.id} style={S.expCard}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{ ...S.avatarSm, background: getMemberColor(pi), flexShrink: 0, marginTop: 2 }}
                  >
                    {getInitial(exp.payer)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13 }}>{cat?.emoji}</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#3A3228" }}>{exp.title}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#8B7E6A", marginTop: 2 }}>
                      {exp.payer} が支払い →{" "}
                      {exp.splitAmong.length === trip.members.length
                        ? "全員"
                        : exp.splitAmong.join(", ")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#3A3228" }}>
                      {exp.currency === "JPY"
                        ? formatJPY(exp.amount)
                        : foreignSymbol +
                          exp.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    {exp.currency !== "JPY" && (
                      <div style={{ fontSize: 11, color: "#8B7E6A" }}>
                        ≈ {formatJPY(toJPY(exp.amount, exp.currency))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
                  <button style={S.tinyBtn} onClick={() => onEditExpense(exp)}>
                    編集
                  </button>
                  <button
                    style={{ ...S.tinyBtn, color: "#C25E4A" }}
                    onClick={() => onDeleteExpense(exp.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 80 }} />
      <button style={S.fab} onClick={onAddExpense}>
        + 支出を追加
      </button>
    </div>
  );
}
