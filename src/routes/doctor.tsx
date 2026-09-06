import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, Plus, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addPatient,
  avg,
  flags,
  getPatients,
  getSessions,
  improvement,
  patientSessions,
  weeklySeries,
  type Patient,
} from "@/lib/neuplay-store";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Clinician Dashboard — NEUPLAY Rehab Analytics" },
      {
        name: "description",
        content:
          "Track patient finger-rehab progress: exercises completed, accuracy, repetitions, weekly charts and flagged concerns.",
      },
      { property: "og:title", content: "Clinician Dashboard — NEUPLAY Rehab Analytics" },
      {
        property: "og:description",
        content: "Patient profiles, progress charts and auto-generated weekly rehab reports.",
      },
    ],
  }),
  component: DoctorDashboard,
});

function useStore() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("neuplay:update", h);
    window.addEventListener("storage", h);
    setTick((t) => t + 1);
    return () => {
      window.removeEventListener("neuplay:update", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return useMemo(
    () => ({ patients: getPatients(), sessions: getSessions(), tick }),
    [tick],
  );
}

function DoctorDashboard() {
  const { patients, sessions } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const activeId = selected ?? patients[0]?.id ?? null;
  const active = patients.find((p) => p.id === activeId) ?? null;
  const activeRows = active ? patientSessions(active.id, sessions) : [];
  const concerns = useMemo(() => flags(patients, sessions), [patients, sessions]);

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-card sticky top-0 z-10 border-b">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span
              className="text-primary-foreground grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{ background: "var(--gradient-calm)" }}
            >
              <Activity className="h-5 w-5" />
            </span>
            <span className="truncate font-semibold">NEUPLAY Clinician</span>
          </Link>
          <div className="text-muted-foreground text-sm">Dr. R. Iyer · Neuro-rehab unit</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <Tabs defaultValue="patients">
          <TabsList>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="mt-6 space-y-6">
            <SummaryRow patients={patients} sessions={sessions} concerns={concerns.length} />
            <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="space-y-6">
                <PatientList patients={patients} activeId={activeId} onSelect={setSelected} />
                <NewPatientForm onCreated={(id) => setSelected(id)} />
              </div>
              <div className="space-y-6">
                {active ? (
                  <PatientDetail patient={active} rows={activeRows} />
                ) : (
                  <Card>
                    <CardContent className="text-muted-foreground p-8 text-sm">
                      Create a patient profile to begin tracking.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-6 space-y-6">
            <WeeklyReports patients={patients} sessions={sessions} />
            <Concerns concerns={concerns} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  patients,
  sessions,
  concerns,
}: {
  patients: Patient[];
  sessions: ReturnType<typeof getSessions>;
  concerns: number;
}) {
  const week = sessions.filter(
    (s) => Date.now() - new Date(s.date).getTime() < 7 * 86400000,
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Active patients" value={String(patients.length)} hint="Enrolled in finger protocol" />
      <Stat label="Sessions this week" value={String(week.length)} hint="Piano rehab sessions logged" />
      <Stat
        label="Mean accuracy"
        value={`${avg(week.map((s) => s.accuracy)) || avg(sessions.map((s) => s.accuracy))}%`}
        hint="Across all tracked keys"
      />
      <Stat label="Flagged concerns" value={String(concerns)} hint="Needs clinician review" />
    </div>
  );
}

function PatientList({
  patients,
  activeId,
  onSelect,
}: {
  patients: Patient[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Patient profiles</CardTitle>
        <CardDescription>Select a patient to view recovery data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {patients.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full rounded-xl border p-3 text-left transition-colors ${
              p.id === activeId
                ? "border-primary bg-secondary"
                : "border-border hover:bg-secondary/60"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{p.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">{p.id}</span>
            </div>
            <p className="text-muted-foreground mt-1 truncate text-xs">
              {p.age} yrs · {p.condition}
            </p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function NewPatientForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ id: "", name: "", age: "", condition: "", dob: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New patient profile</CardTitle>
        <CardDescription>Date of birth doubles as the patient login</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.id || !form.name) return;
            addPatient({
              id: form.id.trim(),
              name: form.name.trim(),
              age: Number(form.age) || 0,
              condition: form.condition.trim() || "Unspecified",
              dob: form.dob,
              createdAt: new Date().toISOString().slice(0, 10),
            });
            onCreated(form.id.trim());
            setForm({ id: "", name: "", age: "", condition: "", dob: "" });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pid">Patient ID</Label>
              <Input id="pid" value={form.id} onChange={set("id")} placeholder="NP-1004" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={form.age} onChange={set("age")} placeholder="45" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={set("name")} placeholder="Jane Cooper" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cond">Condition</Label>
            <Input
              id="cond"
              value={form.condition}
              onChange={set("condition")}
              placeholder="Post-stroke hemiparesis (left hand)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" value={form.dob} onChange={set("dob")} required />
          </div>
          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4" /> Create profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PatientDetail({
  patient,
  rows,
}: {
  patient: Patient;
  rows: ReturnType<typeof patientSessions>;
}) {
  const delta = improvement(rows);
  const trend = rows.slice(-12).map((r) => ({
    date: r.date.slice(5),
    accuracy: r.accuracy,
    rangeOfMotion: r.rangeOfMotion,
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="truncate">{patient.name}</CardTitle>
              <CardDescription className="truncate">
                {patient.id} · {patient.age} yrs · {patient.condition}
              </CardDescription>
            </div>
            <Badge variant={delta >= 3 ? "default" : "secondary"} className="shrink-0">
              {delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {delta >= 0 ? "+" : ""}
              {delta}% accuracy trend
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Stat label="Sessions" value={String(rows.length)} />
          <Stat label="Total reps" value={String(rows.reduce((a, r) => a + r.reps, 0))} />
          <Stat label="Avg range of motion" value={`${avg(rows.map((r) => r.rangeOfMotion))}%`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Improvement trend</CardTitle>
          <CardDescription>Accuracy vs range of motion, last 12 sessions</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="acc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis domain={[40, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="accuracy"
                name="Accuracy %"
                stroke="var(--chart-1)"
                fill="url(#acc)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="rangeOfMotion"
                name="Range of motion %"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completed exercises</CardTitle>
          <CardDescription>Most recent sessions first</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead className="text-right">Reps</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">ROM</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...rows].reverse().slice(0, 10).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                  <TableCell>{r.exercise}</TableCell>
                  <TableCell className="text-right">{r.reps}</TableCell>
                  <TableCell className="text-right">{r.accuracy}%</TableCell>
                  <TableCell className="text-right">{r.rangeOfMotion}%</TableCell>
                  <TableCell className="text-right">
                    {Math.round(r.durationSec / 60)}m {r.durationSec % 60}s
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No sessions recorded yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function WeeklyReports({
  patients,
  sessions,
}: {
  patients: Patient[];
  sessions: ReturnType<typeof getSessions>;
}) {
  const [id, setId] = useState<string | null>(null);
  const activeId = id ?? patients[0]?.id ?? null;
  const rows = activeId ? patientSessions(activeId, sessions) : [];
  const series = weeklySeries(rows);
  const patient = patients.find((p) => p.id === activeId);

  return (
    <Card>
      <CardHeader>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">Auto-generated weekly report</CardTitle>
            <CardDescription className="truncate">
              {patient ? `${patient.name} · ${patient.id}` : "No patient selected"} · 4-week window
            </CardDescription>
          </div>
          <select
            value={activeId ?? ""}
            onChange={(e) => setId(e.target.value)}
            className="border-border bg-background shrink-0 rounded-lg border px-3 py-2 text-sm"
            aria-label="Select patient for report"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="h-64">
            <p className="mb-2 text-sm font-medium">Range of motion & accuracy</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Line dataKey="rangeOfMotion" name="Range of motion %" stroke="var(--chart-2)" strokeWidth={2} />
                <Line dataKey="accuracy" name="Accuracy %" stroke="var(--chart-1)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <p className="mb-2 text-sm font-medium">Consistency & volume</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="consistency" name="Consistency %" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reps" name="Total reps" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-secondary/60 rounded-2xl p-5 text-sm">
          <p className="font-medium">Clinical summary</p>
          <p className="text-muted-foreground mt-2">
            {patient?.name ?? "Patient"} completed {rows.length} finger-rehab sessions in the last 4
            weeks with a mean accuracy of {avg(rows.map((r) => r.accuracy))}% and mean range of
            motion of {avg(rows.map((r) => r.rangeOfMotion))}%. Accuracy trend is{" "}
            {improvement(rows) >= 0 ? "improving" : "declining"} by{" "}
            {Math.abs(improvement(rows))} percentage points across the cycle. Recommend{" "}
            {improvement(rows) >= 5
              ? "progressing to five-finger sequencing at higher tempo."
              : "maintaining current tempo and adding thumb opposition holds."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Concerns({ concerns }: { concerns: ReturnType<typeof flags> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Flagged concerns</CardTitle>
        <CardDescription>Automatically detected from session telemetry</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {concerns.length === 0 ? (
          <p className="text-muted-foreground text-sm">No concerns detected this cycle.</p>
        ) : (
          concerns.map((c, i) => (
            <div
              key={i}
              className="border-border flex items-start gap-3 rounded-xl border p-4"
            >
              <AlertTriangle
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  c.level === "high" ? "text-destructive" : "text-chart-3"
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {c.patientName}{" "}
                  <span className="text-muted-foreground font-normal">({c.patientId})</span>
                </p>
                <p className="text-muted-foreground text-sm">{c.text}</p>
              </div>
              <Badge variant={c.level === "high" ? "destructive" : "secondary"} className="ml-auto shrink-0">
                {c.level}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SettingsPanel() {
  const rows = [
    { t: "Weekly report email", d: "Send auto-generated PDF summaries every Monday 08:00." },
    { t: "Missed-session alerts", d: "Flag a patient after 3 days without a logged session." },
    { t: "Mobility threshold alerts", d: "Flag when 5-session range of motion falls under 65%." },
    { t: "Game sound effects", d: "Enable audio feedback by default for new patients." },
  ];
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Clinic settings</CardTitle>
        <CardDescription>Applies to all patients in this care unit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.map((r, i) => (
          <div key={r.t} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{r.t}</p>
              <p className="text-muted-foreground text-sm">{r.d}</p>
            </div>
            <Switch defaultChecked={i !== 3} aria-label={r.t} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
