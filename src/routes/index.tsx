import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, HandMetal, ShieldCheck, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEUPLAY — AI Rehabilitation Gaming for Hand Recovery" },
      {
        name: "description",
        content:
          "NEUPLAY pairs a clinician dashboard with an AI-tracked piano rehab game so finger exercises are measured, charted and reported weekly.",
      },
      { property: "og:title", content: "NEUPLAY — AI Rehabilitation Gaming for Hand Recovery" },
      {
        property: "og:description",
        content: "Clinician dashboard plus an AI-tracked piano rehab game for fine motor recovery.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-calm)" }}
          >
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-lg">NEUPLAY</span>
        </div>
        <Link
          to="/doctor"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          Clinician login
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-8 pb-14">
        <p className="text-sm font-medium tracking-widest text-primary uppercase">
          AI-powered hand rehabilitation
        </p>
        <h1 className="mt-3 max-w-3xl text-5xl leading-tight font-semibold tracking-tight sm:text-7xl">
          NEUPLAY
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
          Patients play a piano rehab game with AI finger tracking in the browser. Clinicians see
          accuracy, repetitions, range of motion and flagged concerns in one dashboard.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link
            to="/doctor"
            className="group rounded-3xl border border-border bg-card p-7 transition-transform hover:-translate-y-1"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <span className="bg-secondary text-secondary-foreground grid h-12 w-12 place-items-center rounded-2xl">
              <Stethoscope className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Doctor dashboard</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Patient profiles, exercise logs, weekly charted reports and flagged concerns.
            </p>
            <p className="text-primary mt-4 text-sm font-medium">Open dashboard →</p>
          </Link>

          <Link
            to="/play"
            className="group text-play-foreground rounded-3xl p-7 transition-transform hover:-translate-y-1"
            style={{ background: "var(--gradient-play)", boxShadow: "var(--shadow-soft)" }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
              <HandMetal className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Patient Dashboard</h2>
            <p className="mt-4 text-sm font-medium">Start playing →</p>
          </Link>
        </div>

        <div className="text-muted-foreground mt-14 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: HandMetal,
              t: "Fingers-only protocol",
              d: "Isolation, opposition and sequencing drills built into play.",
            },
            {
              icon: BarChart3,
              t: "Auto weekly reports",
              d: "Range of motion, accuracy and consistency charted per patient.",
            },
            {
              icon: ShieldCheck,
              t: "Any browser",
              d: "No install. Works on smartphones, tablets and clinic desktops.",
            },
          ].map((f) => (
            <div key={f.t} className="flex gap-3">
              <f.icon className="text-primary mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-foreground font-medium">{f.t}</p>
                <p className="text-sm">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
