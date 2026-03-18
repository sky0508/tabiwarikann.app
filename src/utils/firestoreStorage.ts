import { doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Trip } from "../types";

const LOCAL_KEY = "tabiwari:mytrips";

// Firestoreにトリップを保存
export async function saveTrip(trip: Trip): Promise<void> {
  await setDoc(doc(db, "trips", trip.id), trip);
}

// Firestoreのトリップをリアルタイム購読
export function subscribeToTrip(
  id: string,
  callback: (trip: Trip | null) => void
): () => void {
  return onSnapshot(doc(db, "trips", id), (snap) => {
    callback(snap.exists() ? (snap.data() as Trip) : null);
  });
}

// Firestoreからトリップを削除
export async function deleteTripFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "trips", id));
}

// ローカルに「参加済みトリップIDリスト」を保存
export function getLocalTripIds(): string[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addLocalTripId(id: string): void {
  const ids = getLocalTripIds();
  if (!ids.includes(id)) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([...ids, id]));
  }
}

export function removeLocalTripId(id: string): void {
  const ids = getLocalTripIds().filter((x) => x !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
}
