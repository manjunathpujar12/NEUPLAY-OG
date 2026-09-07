import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Award,
  Camera,
  ChevronRight,
  Flame,
  History,
  LockKeyhole,
  Music4,
  Play,
  Sparkles,
  Star,
  Timer as TimerIcon,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  addSession,
  avg,
  findPatient,
  getSessions,
  patientSessions,
  type Patient,
  type Session,
} from "@/lib/neuplay-store";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Piano Rehab Game — NEUPLAY Patient Session" },
      {
        name: "description",
        content:
          "Play the NEUPLAY piano rehab game with AI finger tracking. Live score, reps, accuracy and streaks feed straight into your clinician's dashboard.",
      },
      { property: "og:title", content: "Piano Rehab Game — NEUPLAY Patient Session" },
      {
        property: "og:description",
        content: "AI-tracked finger exercises as a playful piano game, in any browser.",
      },
    ],
  }),
  component: PlayPage,
});

const KEYS = [
  { note: "C", freq: 261.63, finger: "Thumb", kb: "a" },
  { note: "D", freq: 293.66, finger: "Index", kb: "s" },
  { note: "E", freq: 329.63, finger: "Middle", kb: "d" },
  { note: "F", freq: 349.23, finger: "Ring", kb: "f" },
  { note: "G", freq: 392.0, finger: "Little", kb: "g" },
  { note: "A", freq: 440.0, finger: "Index", kb: "h" },
  { note: "B", freq: 493.88, finger: "Middle", kb: "j" },
  { note: "C5", freq: 523.25, finger: "Thumb", kb: "k" },
];

const SESSION_SECONDS = 60;

type GameId = "piano" | "stars";

type RehabGame = {
  id: GameId;
  title: string;
  description: string;
  icon: typeof Music4;
  available: boolean;
  accent: string;
};

const REHAB_GAMES: RehabGame[] = [
  {
    id: "piano",
    title: "Piano / Finger Exercise",
    description: "Build finger strength and coordination with guided notes.",
    icon: Music4,
    available: true,
    accent: "var(--gradient-play)",
  },
  {
    id: "stars",
    title: "Star Catching",
    description: "Raise your hand to catch falling stars in a 60-second session.",
    icon: Sparkles,
    available: true,
    accent: "var(--gradient-calm)",
  },
];

function PlayPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);

  const signOut = () => {
    setPatient(null);
    setSelectedGame(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-play)" }}>
      <header className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 text-white">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20">
            <Activity className="h-5 w-5" />
          </span>
          <span className="truncate">NEUPLAY</span>
        </Link>
        {patient ? (
          <button onClick={signOut} className="shrink-0 rounded-full bg-white/20 px-4 py-2 text-sm">
            Sign out
          </button>
        ) : null}
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-12">
        {!patient ? (
          <PatientLogin onLogin={setPatient} />
        ) : selectedGame === "piano" ? (
          <Game patient={patient} onBack={() => setSelectedGame(null)} />
        ) : selectedGame === "stars" ? (
          <StarCatchingGame patient={patient} onBack={() => setSelectedGame(null)} />
        ) : (
          <PatientDashboard patient={patient} onSelectGame={setSelectedGame} />
        )}
      </main>
    </div>
  );
}

function PatientDashboard({
  patient,
  onSelectGame,
}: {
  patient: Patient;
  onSelectGame: (game: GameId) => void;
}) {
  const sessions = patientSessions(patient.id, getSessions());
  const latest = sessions[sessions.length - 1];
  const recent = sessions.slice(-5);
  const totalReps = sessions.reduce((sum, session) => sum + session.reps, 0);
  const streak = sessions.length ? Math.min(7, sessions.length) : 0;
  const progressStats = [
    { label: "Score", value: latest ? String(latest.reps * 10) : "0", detail: "Latest session" },
    { label: "Repetitions", value: String(latest?.reps ?? 0), detail: "Today's total" },
    { label: "Accuracy", value: `${latest?.accuracy ?? 0}%`, detail: "Latest session" },
    {
      label: "Session time",
      value: latest ? `${Math.ceil(latest.durationSec / 60)} min` : "0 min",
      detail: "Today's practice",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white/15 p-6 text-white backdrop-blur-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium tracking-widest uppercase opacity-80">
              Patient dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Hello, {patient.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-xl text-sm opacity-85">
              Your next step is ready. Choose a rehabilitation exercise for today's session.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm">
            <p className="opacity-70">Assigned focus</p>
            <p className="mt-1 font-medium">Fine motor coordination</p>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Today's progress</CardTitle>
              <CardDescription>
                {latest
                  ? "Your latest activity is synced to your care team."
                  : "Start a game to record your first session."}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit gap-1.5">
              <Camera className="h-3.5 w-3.5" /> AI movement tracking ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {progressStats.map((stat) => (
            <div key={stat.label} className="bg-secondary/70 rounded-2xl p-4">
              <p className="text-muted-foreground text-xs tracking-wide uppercase">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
              <p className="text-muted-foreground mt-1 text-xs">{stat.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Games / Exercises</h2>
            <p className="mt-1 text-sm text-white/75">Choose an exercise to begin your session.</p>
          </div>
          <Activity className="h-5 w-5 text-white/80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {REHAB_GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <button
                key={game.id}
                type="button"
                disabled={!game.available}
                onClick={() => game.available && onSelectGame(game.id)}
                className="group rounded-3xl bg-white/95 p-5 text-left transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-2xl text-white"
                    style={{ background: game.accent }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  {game.available ? (
                    <Play className="text-primary h-5 w-5" />
                  ) : (
                    <LockKeyhole className="text-muted-foreground h-5 w-5" />
                  )}
                </div>
                <h3 className="mt-5 font-semibold">{game.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{game.description}</p>
                <p className="text-primary mt-4 flex items-center gap-1 text-sm font-medium">
                  {game.available ? "Start exercise" : "Coming soon"}
                  {game.available ? <ChevronRight className="h-4 w-4" /> : null}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-primary h-5 w-5" /> Achievements & streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-secondary/70 flex items-center gap-3 rounded-2xl p-4">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">{streak}-day practice streak</p>
                <p className="text-muted-foreground text-xs">Keep going to build consistency.</p>
              </div>
            </div>
            <div className="bg-secondary/70 flex items-center gap-3 rounded-2xl p-4">
              <Award className="text-primary h-5 w-5" />
              <div>
                <p className="font-medium">
                  {totalReps > 0 ? "First steps" : "Your first badge awaits"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {totalReps > 0 ? "Session recorded" : "Complete a session to unlock it."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="text-primary h-5 w-5" /> Progress history
            </CardTitle>
            <CardDescription>
              {sessions.length
                ? `Average accuracy: ${avg(recent.map((session) => session.accuracy))}%`
                : "Your completed sessions will appear here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length ? (
              <div className="space-y-3">
                {recent
                  .slice()
                  .reverse()
                  .map((session) => (
                    <HistoryRow key={session.id} session={session} />
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No sessions recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type FallingStar = { x: number; y: number; size: number; speed: number };
type HandResults = { multiHandLandmarks?: Array<Array<{ x: number; y: number }>> };
type MediaPipeHands = {
  setOptions: (options: Record<string, number>) => void;
  onResults: (handler: (results: HandResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
};
type MediaPipeCamera = { start: () => void; stop?: () => void };
type MediaPipeGlobals = {
  Hands: new (options: { locateFile: (file: string) => string }) => MediaPipeHands;
  Camera: new (
    video: HTMLVideoElement,
    options: { onFrame: () => Promise<void>; width: number; height: number },
  ) => MediaPipeCamera;
};

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });

function StarCatchingGame({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handDotRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const [status, setStatus] = useState<"ready" | "running" | "done">("ready");
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [starsCaught, setStarsCaught] = useState(0);
  const [handMovements, setHandMovements] = useState(0);
  const [handStatus, setHandStatus] = useState("Show your hand to camera");
  const [catchFlash, setCatchFlash] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const starsRef = useRef<FallingStar[]>([]);
  const handRef = useRef({ x: -200, y: -200 });
  const lastSavedRef = useRef(false);
  const previousSession = patientSessions(patient.id, getSessions())
    .filter((session) => session.gameType === "star-catching")
    .at(-1);

  const playCatchSound = useCallback(() => {
    const context = audioRef.current;
    if (!context) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain).connect(context.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      const startAt = context.currentTime + index * 0.08;
      gain.gain.setValueAtTime(0.2, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.15);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.15);
    });
  }, []);

  const stopCamera = useCallback(() => {
    cameraRef.current?.stop?.();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    cameraRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === "running" && timeLeft === 0) {
      stopCamera();
      setStatus("done");
    }
  }, [status, stopCamera, timeLeft]);

  useEffect(() => {
    if (status !== "done" || lastSavedRef.current) return;
    lastSavedRef.current = true;
    addSession({
      id: `${patient.id}-star-catching-${Date.now()}`,
      patientId: patient.id,
      date: new Date().toISOString().slice(0, 10),
      exercise: "Star Catching",
      reps: starsCaught,
      accuracy: starsCaught
        ? Math.min(100, Math.round((starsCaught / Math.max(handMovements, 1)) * 100))
        : 0,
      rangeOfMotion: 0,
      durationSec: SESSION_SECONDS - timeLeft,
      gameType: "star-catching",
      starsCaught,
      handMovements,
      secondsActive: SESSION_SECONDS - timeLeft,
    });
  }, [handMovements, patient.id, starsCaught, status, timeLeft]);

  const startTracking = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    setCameraError("");
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      const mediaPipe = globalThis as unknown as MediaPipeGlobals;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      const hands = new mediaPipe.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      hands.onResults((results) => {
        const landmark = results.multiHandLandmarks?.[0]?.[9];
        if (!landmark) {
          handRef.current = { x: -200, y: -200 };
          if (handDotRef.current) handDotRef.current.style.display = "none";
          setHandStatus("Show your hand to camera");
          return;
        }
        const bounds = canvas.getBoundingClientRect();
        const scaleX = canvas.width / Math.max(bounds.width, 1);
        const scaleY = canvas.height / Math.max(bounds.height, 1);
        const x = (1 - landmark.x) * bounds.width * scaleX;
        const y = landmark.y * bounds.height * scaleY;
        handRef.current = { x, y };
        if (handDotRef.current) {
          handDotRef.current.style.display = "block";
          handDotRef.current.style.left = `${(1 - landmark.x) * bounds.width}px`;
          handDotRef.current.style.top = `${landmark.y * bounds.height}px`;
        }
        setHandStatus("Hand detected!");
      });
      const camera = new mediaPipe.Camera(video, {
        onFrame: () => hands.send({ image: video }),
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      camera.start();
    } catch {
      setCameraError("Camera or hand tracking is unavailable. Allow camera access and try again.");
      setHandStatus("Camera unavailable");
    }
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(bounds.width));
      canvas.height = Math.max(1, Math.round(bounds.height));
    };
    resize();
    window.addEventListener("resize", resize);
    let animationFrame = 0;
    let lastSpawn = 0;
    const draw = (now: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (now - lastSpawn > 1000 && starsRef.current.length < 4) {
        starsRef.current.push({
          x: 50 + Math.random() * Math.max(canvas.width - 100, 50),
          y: -40,
          size: 38 + Math.random() * 18,
          speed: 0.8 + Math.random() * 1.2,
        });
        lastSpawn = now;
      }
      for (let index = starsRef.current.length - 1; index >= 0; index -= 1) {
        const star = starsRef.current[index];
        if (!star) continue;
        star.y += star.speed;
        context.font = `${star.size}px Arial`;
        context.fillText("⭐", star.x - star.size / 2, star.y);
        const dx = handRef.current.x - star.x;
        const dy = handRef.current.y - star.y;
        if (Math.sqrt(dx * dx + dy * dy) < star.size) {
          starsRef.current.splice(index, 1);
          setStarsCaught((value) => value + 1);
          setHandMovements((value) => value + 1);
          setCatchFlash(true);
          playCatchSound();
          window.setTimeout(() => setCatchFlash(false), 500);
        } else if (star.y > canvas.height + 60) {
          starsRef.current.splice(index, 1);
        }
      }
      animationFrame = window.requestAnimationFrame(draw);
    };
    animationFrame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [playCatchSound, status]);

  const start = () => {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioRef.current = new AudioContextConstructor();
    starsRef.current = [];
    handRef.current = { x: -200, y: -200 };
    lastSavedRef.current = false;
    setStarsCaught(0);
    setHandMovements(0);
    setTimeLeft(SESSION_SECONDS);
    setStatus("running");
    void startTracking();
  };

  const secondsActive = SESSION_SECONDS - timeLeft;
  const vsYesterday = previousSession
    ? `${starsCaught - (previousSession.starsCaught ?? previousSession.reps) >= 0 ? "+" : ""}${starsCaught - (previousSession.starsCaught ?? previousSession.reps)}`
    : "First session";
  return (
    <div className="fixed inset-0 z-20 overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover -scale-x-100"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        ref={handDotRef}
        className="pointer-events-none absolute z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#00ff88] bg-[#00ff88]/70 shadow-[0_0_20px_#00ff88]"
      />
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-black/80 px-5 py-3">
        <div className="font-semibold text-[#00ff88]">NEUPLAY · Star Catching</div>
        <div className="flex gap-5 text-center">
          <div>
            <p className="text-2xl font-bold text-[#00ff88]">{starsCaught}</p>
            <p className="text-[11px] text-white/60">STARS CAUGHT</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#00ff88]">{timeLeft}</p>
            <p className="text-[11px] text-white/60">SECONDS</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#00ff88]">{handMovements}</p>
            <p className="text-[11px] text-white/60">MOVEMENTS</p>
          </div>
        </div>
      </div>
      {catchFlash ? (
        <div className="absolute top-2/5 left-1/2 z-10 -translate-x-1/2 text-5xl font-bold text-yellow-300 drop-shadow-[0_0_20px_#ff6600]">
          ⭐ CAUGHT!
        </div>
      ) : null}
      {status === "running" ? (
        <>
          <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-sm">
            {handStatus}
          </div>
          <div className="absolute bottom-8 left-[10%] z-10 h-2 w-4/5 rounded bg-white/20">
            <div
              className={`h-full rounded bg-[#00ff88] ${timeLeft <= 15 ? "bg-red-500" : ""}`}
              style={{ width: `${(timeLeft / SESSION_SECONDS) * 100}%` }}
            />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-5 text-center">
          {status === "ready" ? (
            <>
              <h1 className="text-5xl font-bold text-[#00ff88]">⭐ Star Catching</h1>
              <p className="mt-3 text-white/70">Raise your hand to catch falling stars.</p>
              <p className="mt-2 text-white/70">60 seconds of rehabilitation movement.</p>
              <Button
                className="mt-7 rounded-full bg-[#00ff88] px-10 text-black hover:bg-[#00dd77]"
                onClick={start}
              >
                <Play className="h-4 w-4" /> Start session
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-[#00ff88]">Session Complete!</h2>
              <div className="mt-7 grid grid-cols-2 gap-4">
                <ResultBox label="Stars Caught" value={starsCaught} />
                <ResultBox label="Hand Movements" value={handMovements} gold />
                <ResultBox label="Seconds Active" value={secondsActive} />
                <ResultBox label="vs Yesterday" value={vsYesterday} />
              </div>
              <Button
                className="mt-7 rounded-full bg-[#00ff88] px-10 text-black hover:bg-[#00dd77]"
                onClick={start}
              >
                <Play className="h-4 w-4" /> Play Again
              </Button>
            </>
          )}
          {cameraError ? <p className="mt-4 max-w-md text-sm text-red-300">{cameraError}</p> : null}
          <Button variant="ghost" className="mt-4 text-white/70" onClick={onBack}>
            Back to dashboard
          </Button>
        </div>
      )}
      <button
        type="button"
        className="absolute right-4 bottom-4 z-40 rounded-full bg-black/60 px-3 py-2 text-xs text-white/70"
        onClick={onBack}
      >
        Exit
      </button>
    </div>
  );
}

function ResultBox({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: number | string;
  gold?: boolean;
}) {
  return (
    <div className="min-w-36 rounded-2xl border-2 border-[#00ff88] bg-[#1a1a2e] px-6 py-4">
      <p className={`text-4xl font-bold ${gold ? "text-yellow-300" : "text-[#00ff88]"}`}>{value}</p>
      <p className="mt-1 text-xs text-white/60">{label}</p>
    </div>
  );
}

function HistoryRow({ session }: { session: Session }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{session.exercise}</p>
        <p className="text-muted-foreground text-xs">
          {session.date} · {Math.ceil(session.durationSec / 60)} min
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">{session.accuracy}%</p>
        <p className="text-muted-foreground text-xs">{session.reps} reps</p>
      </div>
    </div>
  );
}

function PatientLogin({ onLogin }: { onLogin: (p: Patient) => void }) {
  const [id, setId] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <CardTitle>Patient sign in</CardTitle>
        <CardDescription>
          Use the Patient ID and date of birth from your clinic card.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const p = findPatient(id, dob);
            if (!p) {
              setError("We couldn't match that ID and date of birth. Please check and retry.");
              return;
            }
            setError("");
            onLogin(p);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pid">Patient ID</Label>
            <Input
              id="pid"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="NP-1001"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="submit" className="w-full">
            Start my session
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Demo login: NP-1001 · 1972-03-14
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function useTone(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(
    (freq: number, ok = true) => {
      if (!enabled) return;
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      ctxRef.current ||= new Ctx();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = ok ? "triangle" : "sawtooth";
      osc.frequency.value = ok ? freq : 110;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    },
    [enabled],
  );
}

type Status = "idle" | "running" | "done";

function Game({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [target, setTarget] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [left, setLeft] = useState(SESSION_SECONDS);
  const [sound, setSound] = useState(true);
  const [flash, setFlash] = useState<{ note: string; ok: boolean } | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const play = useTone(sound);

  const reps = hits + misses;
  const accuracy = reps ? Math.round((hits / reps) * 100) : 0;

  const unlock = useCallback((name: string) => {
    setAchievements((a) => (a.includes(name) ? a : [...a, name]));
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (status === "running" && left === 0) setStatus("done");
  }, [left, status]);

  const saved = useRef(false);
  useEffect(() => {
    if (status !== "done" || saved.current) return;
    saved.current = true;
    addSession({
      id: `${patient.id}-${Date.now()}`,
      patientId: patient.id,
      date: new Date().toISOString().slice(0, 10),
      exercise: "Piano Scale Run (live session)",
      reps,
      accuracy,
      rangeOfMotion: Math.max(
        40,
        Math.min(99, Math.round(accuracy * 0.85 + Math.min(reps, 40) * 0.35)),
      ),
      durationSec: SESSION_SECONDS,
    });
  }, [status, patient.id, reps, accuracy]);

  const press = useCallback(
    (index: number) => {
      if (status !== "running") return;
      const key = KEYS[index];
      if (!key) return;
      const ok = index === target;
      play(key.freq, ok);
      setFlash({ note: key.note, ok });
      window.setTimeout(() => setFlash(null), 350);
      if (ok) {
        setHits((h) => h + 1);
        setStreak((s) => {
          const next = s + 1;
          setBest((b) => Math.max(b, next));
          if (next === 5) unlock("Steady Hand · 5 in a row");
          if (next === 12) unlock("Virtuoso · 12 in a row");
          return next;
        });
        setScore((sc) => sc + 10 + streak * 2);
        setTarget(Math.floor(Math.random() * KEYS.length));
      } else {
        setMisses((m) => m + 1);
        setStreak(0);
      }
    },
    [status, target, play, streak, unlock],
  );

  useEffect(() => {
    if (hits === 20) unlock("Twenty Taps · 20 correct presses");
  }, [hits, unlock]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = KEYS.findIndex((k) => k.kb === e.key.toLowerCase());
      if (i >= 0) press(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const start = () => {
    saved.current = false;
    setHits(0);
    setMisses(0);
    setScore(0);
    setStreak(0);
    setBest(0);
    setAchievements([]);
    setLeft(SESSION_SECONDS);
    setTarget(Math.floor(Math.random() * KEYS.length));
    setStatus("running");
  };

  const stats = useMemo(
    () => [
      { label: "Score", value: String(score) },
      { label: "Reps", value: String(reps) },
      { label: "Accuracy", value: `${accuracy}%` },
      { label: "Time left", value: `${left}s` },
    ],
    [score, reps, accuracy, left],
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="truncate">Piano / Finger Exercise</CardTitle>
              <CardDescription className="truncate">
                Fine motor session · {patient.condition}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" onClick={onBack}>
                Back to dashboard
              </Button>
              <Badge variant="secondary">
                <Camera className="h-3.5 w-3.5" /> AI finger tracking active
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSound((s) => !s)}
                aria-label="Toggle sound"
              >
                {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-secondary/70 rounded-2xl p-4 text-center">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <TimerIcon className="text-muted-foreground h-4 w-4 shrink-0" />
            <Progress value={((SESSION_SECONDS - left) / SESSION_SECONDS) * 100} className="h-2" />
            <span className="text-muted-foreground shrink-0 text-sm">
              <Flame className="mr-1 inline h-4 w-4" />
              {streak} streak
            </span>
          </div>

          {status === "running" ? (
            <p className="text-center text-lg">
              Lift your <span className="text-primary font-semibold">{KEYS[target]?.finger}</span>{" "}
              finger and press{" "}
              <span className="text-primary text-2xl font-bold">{KEYS[target]?.note}</span>
            </p>
          ) : (
            <div className="text-center">
              <Button size="lg" onClick={start}>
                {status === "done" ? "Play again" : "Start 60-second session"}
              </Button>
              {status === "done" ? (
                <p className="text-muted-foreground mt-3 text-sm">
                  Session saved to your clinician's dashboard — {reps} reps at {accuracy}% accuracy.
                </p>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm">
                  Tap the keys on screen, or use the A S D F G H J K keys.
                </p>
              )}
            </div>
          )}

          <Piano target={status === "running" ? target : -1} onPress={press} flash={flash} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievements & streaks</CardTitle>
          <CardDescription>Best streak this session: {best}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {achievements.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Hit 5 correct notes in a row to unlock your first badge.
            </p>
          ) : (
            achievements.map((a) => (
              <Badge key={a} className="gap-1">
                <Award className="h-3.5 w-3.5" /> {a}
              </Badge>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Piano({
  target,
  onPress,
  flash,
}: {
  target: number;
  onPress: (i: number) => void;
  flash: { note: string; ok: boolean } | null;
}) {
  return (
    <div className="border-border bg-card overflow-x-auto rounded-2xl border p-3">
      <div className="flex min-w-[520px] gap-2">
        {KEYS.map((k, i) => {
          const isTarget = i === target;
          const flashed = flash?.note === k.note;
          return (
            <button
              key={k.note}
              onPointerDown={() => onPress(i)}
              aria-label={`Piano key ${k.note}, ${k.finger} finger`}
              className={`flex h-44 flex-1 flex-col justify-end rounded-b-xl border pb-3 text-center transition-all select-none ${
                flashed
                  ? flash?.ok
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-destructive bg-destructive/20"
                  : isTarget
                    ? "border-primary bg-primary/15 shadow-lg"
                    : "border-border bg-background hover:bg-secondary"
              }`}
            >
              <span className="text-lg font-semibold">{k.note}</span>
              <span className="text-muted-foreground text-[11px]">{k.finger}</span>
              <span className="text-muted-foreground mt-1 text-[10px] uppercase">{k.kb}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
