import { useState } from "react";
import type { Trip } from "../types";
import { computeSettlement } from "../utils/settlement";
import { getMemberColor, getInitial, formatJPY } from "../constants";
import { S } from "../styles";

const APP_URL = "https://tabiwarikannapp.vercel.app";

interface Props {
  trips: Record<string, Trip>;
  tripIds: string[];
  onOpenTrip: (id: string) => void;
  onCreate: () => void;
  onDeleteTrip: (id: string) => void;
  onJoinTrip: (id: string) => void;
}

export function Home({ trips, tripIds, onOpenTrip, onCreate, onDeleteTrip, onJoinTrip }: Props) {
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const url = `${APP_URL}/?t=${id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleJoin = () => {
    const id = joinCode.trim();
    if (!id) return;
    onJoinTrip(id);
    setJoinCode("");
    setJoinError("");
  };

  return (
    <div style={S.container}>
      <div style={S.heroSection}>
        <div style={S.heroIcon}>✈</div>
        <h1 style={S.heroTitle}>TabiWari</h1>
        <p style={S.heroSub}>旅の割り勘、みんなでスマートに</p>
      </div>

      {tripIds.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={S.sectionTitle}>マイトリップ</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tripIds.map((id) => {
              const t = trips[id];
              if (!t) return (
                <div key={id} style={{ ...S.tripCard, opacity: 0.5 }}>
                  <div style={S.tripCardMeta}>読み込み中...</div>
                </div>
              );
              const s = computeSettlement(t);
              return (
                <div key={id} style={{ position: "relative" }}>
                  <button style={S.tripCard} onClick={() => onOpenTrip(id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={S.tripCardName}>{t.name}</div>
                        <div style={S.tripCardMeta}>{t.members.length}人 · {t.foreignCurrency}</div>
                      </div>
                      <div style={S.tripCardAmount}>{formatJPY(s.total)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      {t.members.map((m, i) => (
                        <div key={m} style={{ ...S.avatarTiny, background: getMemberColor(i) }}>
                          {getInitial(m)}
                        </div>
                      ))}
                    </div>
                  </button>
                  {/* シェア・削除ボタン */}
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button
                      style={{ ...S.exportBtn, flex: 1 }}
                      onClick={() => handleCopyLink(id)}
                    >
                      {copied === id ? "✓ コピーしました" : "🔗 招待リンクをコピー"}
                    </button>
                    <button
                      style={{ ...S.exportBtn, color: "#C25E4A" }}
                      onClick={() => {
                        if (confirm(`「${t.name}」をリストから削除しますか？`)) {
                          onDeleteTrip(id);
                        }
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button style={S.createTripBtn} onClick={onCreate}>
        <span style={{ fontSize: 24 }}>+</span>
        <span>新しいトリップを作成</span>
      </button>

      {/* 招待リンクから参加 */}
      <div style={{ ...S.card, marginTop: 12 }}>
        <h2 style={S.cardTitle}>🔗 招待コードで参加</h2>
        <p style={{ fontSize: 13, color: "#8B7E6A", margin: "0 0 10px" }}>
          友達から送られたトリップIDを入力
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            placeholder="トリップID"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value); setJoinError(""); }}
          />
          <button
            style={{ ...S.primaryBtn, width: "auto", padding: "0 20px", fontSize: 14 }}
            onClick={handleJoin}
          >
            参加
          </button>
        </div>
        {joinError && <p style={{ color: "#C25E4A", fontSize: 12, marginTop: 6 }}>{joinError}</p>}
      </div>
    </div>
  );
}
