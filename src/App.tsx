import { useState, useEffect, useMemo } from "react";
import type { Trip, Expense } from "./types";
import { computeSettlement } from "./utils/settlement";
import {
  saveTrip,
  subscribeToTrip,
  getLocalTripIds,
  addLocalTripId,
  removeLocalTripId,
  deleteTripFromFirestore,
} from "./utils/firestoreStorage";
import { Home } from "./components/Home";
import { CreateTrip } from "./components/CreateTrip";
import { Dashboard } from "./components/Dashboard";
import { ExpenseForm } from "./components/ExpenseForm";
import { MemberDetail } from "./components/MemberDetail";
import { S } from "./styles";

type Screen = "home" | "create" | "dashboard" | "expense" | "member";

export default function App() {
  const [tripIds, setTripIds] = useState<string[]>(getLocalTripIds());
  const [tripsMap, setTripsMap] = useState<Record<string, Trip>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [focusMember, setFocusMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // URLパラメータ ?t=TRIPID を確認して自動でトリップを開く
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get("t");
    if (tripId) {
      addLocalTripId(tripId);
      setTripIds(getLocalTripIds());
      setCurrentId(tripId);
      setScreen("dashboard");
      // URLをきれいにする
      window.history.replaceState({}, "", window.location.pathname);
    }
    setLoading(false);
  }, []);

  // 参加済みトリップを全てFirestoreからリアルタイム購読
  useEffect(() => {
    if (tripIds.length === 0) return;
    const unsubscribers = tripIds.map((id) =>
      subscribeToTrip(id, (trip) => {
        if (trip) {
          setTripsMap((prev) => ({ ...prev, [id]: trip }));
        }
      })
    );
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [tripIds]);

  const trip = currentId ? tripsMap[currentId] : null;
  const settlement = useMemo(() => (trip ? computeSettlement(trip) : null), [trip]);

  const handleTripCreated = async (newTrip: Trip) => {
    await saveTrip(newTrip);
    addLocalTripId(newTrip.id);
    setTripIds(getLocalTripIds());
    setCurrentId(newTrip.id);
    setScreen("dashboard");
  };

  const handleUpdateTrip = async (updater: (t: Trip) => Trip) => {
    if (!currentId || !trip) return;
    const updated = updater(trip);
    await saveTrip(updated);
  };

  const handleSaveExpense = async (expense: Expense) => {
    await handleUpdateTrip((t) => ({
      ...t,
      expenses: editExpense
        ? t.expenses.map((e) => (e.id === editExpense.id ? expense : e))
        : [...t.expenses, expense],
    }));
    setEditExpense(null);
    setScreen("dashboard");
  };

  const handleDeleteExpense = async (id: string) => {
    await handleUpdateTrip((t) => ({
      ...t,
      expenses: t.expenses.filter((e) => e.id !== id),
    }));
  };

  const handleDeleteTrip = async (id: string) => {
    await deleteTripFromFirestore(id);
    removeLocalTripId(id);
    setTripIds(getLocalTripIds());
    setTripsMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleJoinTrip = (id: string) => {
    addLocalTripId(id);
    setTripIds(getLocalTripIds());
    setCurrentId(id);
    setScreen("dashboard");
  };

  if (loading) {
    return (
      <div style={S.container}>
        <div style={S.loadingWrap}>
          <p style={{ color: "#8B7E6A" }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (screen === "home") {
    return (
      <Home
        trips={tripsMap}
        tripIds={tripIds}
        onOpenTrip={(id) => { setCurrentId(id); setScreen("dashboard"); }}
        onCreate={() => setScreen("create")}
        onDeleteTrip={handleDeleteTrip}
        onJoinTrip={handleJoinTrip}
      />
    );
  }

  if (screen === "create") {
    return (
      <CreateTrip
        onBack={() => setScreen("home")}
        onCreated={handleTripCreated}
      />
    );
  }

  if (!trip || !settlement) {
    return (
      <div style={S.container}>
        <div style={S.loadingWrap}>
          <p style={{ color: "#8B7E6A" }}>トリップを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (screen === "expense") {
    return (
      <ExpenseForm
        trip={trip}
        editExpense={editExpense}
        onBack={() => { setEditExpense(null); setScreen("dashboard"); }}
        onSave={handleSaveExpense}
      />
    );
  }

  if (screen === "member" && focusMember) {
    return (
      <MemberDetail
        trip={trip}
        memberName={focusMember}
        settlement={settlement}
        onBack={() => { setFocusMember(null); setScreen("dashboard"); }}
      />
    );
  }

  return (
    <Dashboard
      trip={trip}
      settlement={settlement}
      onBack={() => { setCurrentId(null); setScreen("home"); }}
      onAddExpense={() => { setEditExpense(null); setScreen("expense"); }}
      onEditExpense={(exp) => { setEditExpense(exp); setScreen("expense"); }}
      onDeleteExpense={handleDeleteExpense}
      onOpenMember={(name) => { setFocusMember(name); setScreen("member"); }}
    />
  );
}
