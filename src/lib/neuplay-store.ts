export type Patient = {
  id: string;
  name: string;
  age: number;
  condition: string;
  dob: string; // yyyy-mm-dd
  createdAt: string;
};

export type Session = {
  id: string;
  patientId: string;
  date: string; // yyyy-mm-dd
  exercise: string;
  reps: number;
  accuracy: number; // 0-100
  rangeOfMotion: number; // 0-100
  durationSec: number;
};

const PATIENTS_KEY = "neuplay.patients.v1";
const SESSIONS_KEY = "neuplay.sessions.v1";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("neuplay:update"));
}

const dayISO = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
};

const EXERCISES = [
  "Piano Scale Run",
  "Thumb Opposition Taps",
  "Index Finger Isolation",
  "Chord Press Hold",
  "Five-Finger Sequence",
];

export const SEED_PATIENTS: Patient[] = [
  {
    id: "NP-1001",
    name: "Aarav Menon",
    age: 54,
    condition: "Post-stroke hemiparesis (right hand)",
    dob: "1972-03-14",
    createdAt: dayISO(60),
  },
  {
    id: "NP-1002",
    name: "Sofia Rivera",
    age: 37,
    condition: "Carpal tunnel post-surgical recovery",
    dob: "1989-11-02",
    createdAt: dayISO(45),
  },
  {
    id: "NP-1003",
    name: "Daniel Okafor",
    age: 66,
    condition: "Parkinson's – fine motor tremor",
    dob: "1960-06-21",
    createdAt: dayISO(30),
  },
];

function seedSessions(): Session[] {
  const out: Session[] = [];
  SEED_PATIENTS.forEach((p, pi) => {
    for (let d = 27; d >= 0; d--) {
      // patient 3 misses many sessions -> flagged
      const skip = pi === 2 ? d % 3 !== 0 || d < 6 : d % 2 === 1;
      if (skip) continue;
      const progress = (27 - d) / 27;
      const base = [58, 66, 48][pi] ?? 58;
      out.push({
        id: `${p.id}-${d}`,
        patientId: p.id,
        date: dayISO(d),
        exercise: EXERCISES[(d + pi) % EXERCISES.length] ?? "Piano Scale Run",
        reps: Math.round(24 + progress * 30 + ((d * 7) % 6)),
        accuracy: Math.min(99, Math.round(base + progress * 28 + ((d * 3) % 5))),
        rangeOfMotion: Math.min(98, Math.round(base - 6 + progress * 30 + ((d * 5) % 7))),
        durationSec: 180 + ((d * 11) % 120),
      });
    }
  });
  return out;
}

export function getPatients(): Patient[] {
  if (!isBrowser()) return SEED_PATIENTS;
  const existing = read<Patient[] | null>(PATIENTS_KEY, null);
  if (existing) return existing;
  write(PATIENTS_KEY, SEED_PATIENTS);
  return SEED_PATIENTS;
}

export function getSessions(): Session[] {
  if (!isBrowser()) return [];
  const existing = read<Session[] | null>(SESSIONS_KEY, null);
  if (existing) return existing;
  const seeded = seedSessions();
  write(SESSIONS_KEY, seeded);
  return seeded;
}

export function addPatient(p: Patient) {
  write(PATIENTS_KEY, [...getPatients(), p]);
}

export function addSession(s: Session) {
  write(SESSIONS_KEY, [...getSessions(), s]);
}

export function findPatient(id: string, dob: string) {
  return getPatients().find(
    (p) => p.id.toLowerCase() === id.trim().toLowerCase() && p.dob === dob,
  );
}

/* ---------- analytics ---------- */

export function patientSessions(patientId: string, all = getSessions()) {
  return all
    .filter((s) => s.patientId === patientId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function weeklySeries(sessions: Session[]) {
  const weeks: Record<string, Session[]> = {};
  sessions.forEach((s) => {
    const d = new Date(s.date);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    const w = Math.min(3, Math.floor(diff / 7));
    const key = `Week ${4 - w}`;
    (weeks[key] ||= []).push(s);
  });
  return ["Week 1", "Week 2", "Week 3", "Week 4"].map((label) => {
    const rows = weeks[label] ?? [];
    return {
      week: label,
      accuracy: avg(rows.map((r) => r.accuracy)),
      rangeOfMotion: avg(rows.map((r) => r.rangeOfMotion)),
      consistency: Math.min(100, Math.round((rows.length / 4) * 100)),
      reps: rows.reduce((a, r) => a + r.reps, 0),
    };
  });
}

export function improvement(sessions: Session[]) {
  if (sessions.length < 2) return 0;
  const half = Math.max(1, Math.floor(sessions.length / 2));
  const first = avg(sessions.slice(0, half).map((s) => s.accuracy));
  const last = avg(sessions.slice(-half).map((s) => s.accuracy));
  return last - first;
}

export type Flag = { patientId: string; patientName: string; level: "high" | "medium"; text: string };

export function flags(patients = getPatients(), all = getSessions()): Flag[] {
  const out: Flag[] = [];
  patients.forEach((p) => {
    const rows = patientSessions(p.id, all);
    const last = rows[rows.length - 1];
    const daysSince = last
      ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000)
      : 99;
    if (daysSince >= 4)
      out.push({
        patientId: p.id,
        patientName: p.name,
        level: "high",
        text: `Missed sessions — no activity for ${daysSince} days`,
      });
    const recentRom = avg(rows.slice(-5).map((r) => r.rangeOfMotion));
    if (rows.length && recentRom < 65)
      out.push({
        patientId: p.id,
        patientName: p.name,
        level: "medium",
        text: `Limited finger mobility — average range of motion ${recentRom}%`,
      });
    if (rows.length && improvement(rows) < 3)
      out.push({
        patientId: p.id,
        patientName: p.name,
        level: "medium",
        text: "Plateau detected — accuracy improvement under 3% this cycle",
      });
  });
  return out;
}
