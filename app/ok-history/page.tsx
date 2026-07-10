"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────
interface Question {
  id: number;
  text: string;
  place: string;
  fact: string;
  lat: number;
  lon: number;
}
interface Answer {
  qid: number;
  distance: number;
  score: number;
  tapLat: number;
  tapLon: number;
}
interface DayResult {
  date: string;
  answers: Answer[];
  total: number;
}
interface Stats {
  played: number;
  totalScore: number;
  bestScore: number;
  streak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
}

// ─── Question bank ────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  { id: 1, place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "On April 22, 1889, thousands of settlers raced to stake claims here in the very first Oklahoma Land Run, turning open prairie into a tent city of 10,000 people by nightfall.",
    fact: "Oklahoma City became the state capital in 1910, after a contested vote moved it from Guthrie." },
  { id: 2, place: "Guthrie", lat: 35.8786, lon: -97.4256,
    text: "This city served as Oklahoma's first state capital when statehood was declared in 1907 — before the capital was moved in a controversial 1910 election.",
    fact: "Guthrie's downtown is one of the largest contiguous urban historic districts in the U.S., largely because the town was frozen in time after losing the capital." },
  { id: 3, place: "Tulsa", lat: 36.1540, lon: -95.9928,
    text: "Once known as the 'Oil Capital of the World,' this city's Greenwood District — nicknamed 'Black Wall Street' — was destroyed in the 1921 race massacre.",
    fact: "Greenwood was one of the wealthiest Black communities in America before the massacre destroyed over 35 city blocks." },
  { id: 4, place: "Boise City", lat: 36.7267, lon: -102.5171,
    text: "This remote Panhandle town holds a strange WWII distinction: it's the only place in the continental U.S. bombed by the American military — by accident, in 1943.",
    fact: "A B-17 crew mistook the town's lights for a practice bombing range and dropped six practice bombs on it." },
  { id: 5, place: "Anadarko", lat: 35.0723, lon: -98.2437,
    text: "This city calls itself the 'Indian Capital of the Nation' and hosts the American Indian Exposition, one of the oldest Native gatherings in the country, every summer.",
    fact: "Anadarko is headquarters to several tribal nations, including the Caddo, Delaware, and Wichita." },
  { id: 6, place: "Tahlequah", lat: 35.9151, lon: -94.9700,
    text: "This is the capital of the Cherokee Nation and one of the endpoints of the Trail of Tears into Indian Territory.",
    fact: "Tahlequah was founded in 1839, shortly after the forced removal of the Cherokee from the southeastern United States." },
  { id: 7, place: "Bartlesville", lat: 36.7473, lon: -95.9808,
    text: "In 1897, the Nellie Johnstone No. 1 well blew in here, launching Oklahoma's first commercial oil boom.",
    fact: "Bartlesville later became headquarters to Phillips Petroleum, one of the giants of the American oil industry." },
  { id: 8, place: "Ardmore", lat: 34.1743, lon: -97.1436,
    text: "On September 27, 1915, a massive nitroglycerin explosion tore through this southern Oklahoma oil town, killing dozens and leveling much of downtown.",
    fact: "The blast was heard over 75 miles away and remains one of the deadliest industrial disasters in state history." },
  { id: 9, place: "Enid", lat: 36.3956, lon: -97.8784,
    text: "This city sprang up almost overnight after the Cherokee Outlet Land Run of 1893 — one of the largest land runs in U.S. history.",
    fact: "Nearly 100,000 people raced for claims in the Cherokee Outlet on a single day, September 16, 1893." },
  { id: 10, place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "Home to the University of Oklahoma and the National Weather Center, this city is a global hub for meteorology and severe storm research.",
    fact: "Norman sits in the heart of 'Tornado Alley' and is where modern storm-chasing and Doppler weather radar research took shape." },
  { id: 11, place: "Moore", lat: 35.3395, lon: -97.4867,
    text: "An EF5 tornado tore through this Oklahoma City suburb on May 20, 2013, one of the costliest and deadliest tornadoes in U.S. history.",
    fact: "Moore was hit by violent tornadoes in 1999, 2003, and again in 2013 — an unusual repeat target for EF5-strength storms." },
  { id: 12, place: "Spiro Mounds", lat: 35.2848, lon: -94.6252,
    text: "This ancient Native American mound complex near the Arkansas border was a major trade and ceremonial center over 1,000 years ago.",
    fact: "Spiro Mounds produced some of the finest pre-Columbian art and artifacts ever found in North America." },
  { id: 13, place: "Fort Gibson", lat: 35.7998, lon: -95.2530,
    text: "Founded in 1824 along the Grand River, this was the first permanent U.S. military post established in what is now Oklahoma.",
    fact: "Fort Gibson later served as a staging point for tribes arriving at the end of the Trail of Tears." },
  { id: 14, place: "Idabel", lat: 33.8935, lon: -94.8232,
    text: "This town in the far southeastern corner of the state, near the Texas and Arkansas borders, sits deep in traditional Choctaw Nation territory.",
    fact: "Idabel is the seat of McCurtain County, Oklahoma's most heavily forested county." },
  { id: 15, place: "El Reno", lat: 35.5322, lon: -97.9550,
    text: "Known as the birthplace of the onion-fried burger and a stop on historic Route 66, this town west of Oklahoma City is also home to an Air Force base.",
    fact: "El Reno hosts an annual Fried Onion Burger Day festival celebrating the Depression-era invention." },
  { id: 16, place: "Wewoka", lat: 35.1470, lon: -96.4956,
    text: "This is the capital of the Seminole Nation, established after the tribe's forced removal to Indian Territory in the 1830s and 40s.",
    fact: "Wewoka means 'barking water' in the Seminole language, named for a nearby waterfall." },
  { id: 17, place: "Ponca City", lat: 36.7065, lon: -97.0856,
    text: "The famous 101 Ranch — once one of the largest diversified ranches in the U.S. and home to a touring Wild West show — was headquartered near this city.",
    fact: "The 101 Ranch Wild West Show toured the world and featured performers like Bill Pickett and Tom Mix." },
  { id: 18, place: "Lawton (Fort Sill)", lat: 34.6036, lon: -98.3959,
    text: "This army post, established in 1869, is the historic home of the U.S. Army Field Artillery — and the burial site of the Apache leader Geronimo.",
    fact: "Fort Sill has trained U.S. artillery soldiers continuously since the Indian Wars era of the 19th century." },
  { id: 19, place: "Woodward", lat: 36.4336, lon: -99.3904,
    text: "On April 9, 1947, one of the deadliest tornadoes in U.S. history killed over 100 people in and around this northwestern Oklahoma city.",
    fact: "The 1947 Woodward tornado struck before modern warning systems existed, giving residents almost no notice." },
  { id: 20, place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This city is home to Oklahoma's first institution of higher learning, a land-grant university founded in 1890.",
    fact: "Oklahoma State University's original name was the Oklahoma Agricultural and Mechanical College." },
];

const POINT_VALUES = [100, 100, 200, 300, 300];

// ─── Oklahoma outline (simplified) ───────────────────────────────────
const LON_MIN = -103.2, LON_MAX = -94.3, LAT_MIN = 33.5, LAT_MAX = 37.15;
const MAP_W = 780, MAP_H = 390;
const OK_OUTLINE: [number, number][] = [
  [-103.00, 37.00], [-94.62, 37.00], [-94.43, 36.50], [-94.55, 35.00],
  [-94.43, 33.85], [-95.50, 33.85], [-96.90, 33.90], [-98.20, 34.00],
  [-99.20, 34.30], [-100.00, 34.56], [-100.00, 36.50], [-103.00, 36.50],
];

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return [x, y];
}
function unproject(x: number, y: number): [number, number] {
  const lon = LON_MIN + (x / MAP_W) * (LON_MAX - LON_MIN);
  const lat = LAT_MAX - (y / MAP_H) * (LAT_MAX - LAT_MIN);
  return [lon, lat];
}
function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function scoreFor(distance: number, max: number): number {
  return Math.round(max * Math.exp(-distance / 55));
}

// ─── Deterministic daily seed ─────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return h;
}
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function questionsForDate(dateKey: string): Question[] {
  const rand = mulberry32(hashStr(dateKey));
  const pool = [...QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5);
}

// ─── Storage ──────────────────────────────────────────────────────────
function loadStats(): Stats {
  try {
    const raw = localStorage.getItem("okh-stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { played: 0, totalScore: 0, bestScore: 0, streak: 0, bestStreak: 0, lastPlayedDate: null };
}
function saveStats(s: Stats) { try { localStorage.setItem("okh-stats", JSON.stringify(s)); } catch {} }
function loadResult(dateKey: string): DayResult | null {
  try {
    const raw = localStorage.getItem(`okh-result-${dateKey}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function saveResult(r: DayResult) { try { localStorage.setItem(`okh-result-${r.date}`, JSON.stringify(r)); } catch {} }

function yesterdayKey(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tierEmoji(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.85) return "🟩";
  if (pct >= 0.5) return "🟨";
  if (pct >= 0.2) return "🟧";
  return "🟥";
}

// ─── Component ────────────────────────────────────────────────────────
export default function OKHistoryGame() {
  const dateKey = useMemo(() => todayKey(), []);
  const questions = useMemo(() => questionsForDate(dateKey), [dateKey]);

  const [phase, setPhase] = useState<"loading" | "intro" | "playing" | "reveal" | "done">("loading");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pendingTap, setPendingTap] = useState<{ x: number; y: number } | null>(null);
  const [lastAnswer, setLastAnswer] = useState<Answer | null>(null);
  const [stats, setStats] = useState<Stats>({ played: 0, totalScore: 0, bestScore: 0, streak: 0, bestStreak: 0, lastPlayedDate: null });
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const s = loadStats();
    setStats(s);
    const existing = loadResult(dateKey);
    if (existing) {
      setAnswers(existing.answers);
      setPhase("done");
    } else {
      setPhase("intro");
    }
  }, [dateKey]);

  const current = questions[qIndex];

  const handleMapClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (phase !== "playing" || pendingTap) return;
    const svg = svgRef.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MAP_W;
    const y = ((e.clientY - rect.top) / rect.height) * MAP_H;
    setPendingTap({ x, y });
  }, [phase, pendingTap]);

  const lockInGuess = () => {
    if (!pendingTap || !current) return;
    const [lon, lat] = unproject(pendingTap.x, pendingTap.y);
    const distance = haversineMiles(lat, lon, current.lat, current.lon);
    const max = POINT_VALUES[qIndex];
    const score = scoreFor(distance, max);
    const answer: Answer = { qid: current.id, distance, score, tapLat: lat, tapLon: lon };
    setLastAnswer(answer);
    setAnswers(p => [...p, answer]);
    setPhase("reveal");
  };

  const nextQuestion = () => {
    setPendingTap(null);
    setLastAnswer(null);
    if (qIndex + 1 >= questions.length) {
      const finalTotal = answers.reduce((sum, a) => sum + a.score, 0);
      const result: DayResult = { date: dateKey, answers, total: finalTotal };
      saveResult(result);
      const wasYesterday = stats.lastPlayedDate === yesterdayKey(dateKey);
      const newStreak = wasYesterday ? stats.streak + 1 : 1;
      const newStats: Stats = {
        played: stats.played + 1,
        totalScore: stats.totalScore + finalTotal,
        bestScore: Math.max(stats.bestScore, finalTotal),
        streak: newStreak,
        bestStreak: Math.max(stats.bestStreak, newStreak),
        lastPlayedDate: dateKey,
      };
      saveStats(newStats);
      setStats(newStats);
      setPhase("done");
    } else {
      setQIndex(i => i + 1);
      setPhase("playing");
    }
  };

  const startGame = () => { setQIndex(0); setAnswers([]); setPhase("playing"); };

  const shareText = useMemo(() => {
    const total = answers.reduce((s, a) => s + a.score, 0);
    const squares = answers.map((a, i) => tierEmoji(a.score, POINT_VALUES[i])).join("");
    return `OK History ${dateKey} — ${total}/1000\n${squares}\nhttps://geohistory.gg`;
  }, [answers, dateKey]);

  const doShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
    }
  };

  const outlinePoints = OK_OUTLINE.map(([lon, lat]) => project(lon, lat).join(",")).join(" ");
  const guessPt = pendingTap;
  const actualPt = current ? project(current.lon, current.lat) : null;

  return (
    <div style={{ minHeight: "100vh", maxWidth: 520, margin: "0 auto", position: "relative",
      background: "linear-gradient(180deg,#fbf3e3 0%,#f5e6c8 100%)", fontFamily: "system-ui, -apple-system, sans-serif", color: "#3a2a18" }}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .okh-fade{animation:fadeIn .35s ease both}
        button{font-family:inherit}
      `}</style>

      <header style={{ padding: "22px 20px 14px", textAlign: "center", background: "#1a3a5c", color: "#fbf3e3" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.75, fontWeight: 700 }}>DAILY TRIVIA</div>
        <h1 style={{ fontSize: 30, margin: "4px 0 2px", fontWeight: 800, letterSpacing: -0.5 }}>OK History</h1>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Tap the map. Guess where it happened in Oklahoma.</div>
      </header>

      {phase === "loading" && <div style={{ padding: 60, textAlign: "center" }}>Loading today&apos;s round…</div>}

      {phase === "intro" && (
        <div className="okh-fade" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5a4630" }}>
            5 questions about Oklahoma history &amp; geography. Tap the spot on the map where you think each event happened —
            the closer you are, the more points you score. Everyone gets the same 5 questions each day.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 18, margin: "18px 0", fontSize: 13, color: "#7a6548" }}>
            <div><b style={{ display: "block", fontSize: 20, color: "#1a3a5c" }}>{stats.streak}</b>Day streak</div>
            <div><b style={{ display: "block", fontSize: 20, color: "#1a3a5c" }}>{stats.bestScore}</b>Best score</div>
            <div><b style={{ display: "block", fontSize: 20, color: "#1a3a5c" }}>{stats.played}</b>Played</div>
          </div>
          <button onClick={startGame} style={{ background: "#b5451f", color: "#fff", border: "none", borderRadius: 14,
            padding: "14px 36px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(181,69,31,0.35)" }}>
            Play Today&apos;s Round
          </button>
        </div>
      )}

      {(phase === "playing" || phase === "reveal") && current && (
        <div className="okh-fade" style={{ padding: "14px 16px 24px" }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{ width: 30, height: 6, borderRadius: 3,
                background: i < qIndex ? "#1a3a5c" : i === qIndex ? "#b5451f" : "#e3d3ae" }} />
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#b5451f", textAlign: "center", marginBottom: 4 }}>
            QUESTION {qIndex + 1} OF {questions.length} · WORTH UP TO {POINT_VALUES[qIndex]} PTS
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, textAlign: "center", margin: "6px 0 14px", fontWeight: 600 }}>
            {current.text}
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", border: "3px solid #1a3a5c", background: "#dff0f7" }}>
            <svg ref={svgRef} viewBox={`0 0 ${MAP_W} ${MAP_H}`} onClick={handleMapClick}
              style={{ width: "100%", display: "block", cursor: phase === "playing" && !pendingTap ? "crosshair" : "default" }}>
              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#dff0f7" />
              <polygon points={outlinePoints} fill="#e9d9ae" stroke="#1a3a5c" strokeWidth="3" strokeLinejoin="round" />
              {guessPt && (
                <g>
                  <circle cx={guessPt.x} cy={guessPt.y} r="9" fill="#b5451f" stroke="#fff" strokeWidth="2.5" />
                </g>
              )}
              {phase === "reveal" && actualPt && (
                <g>
                  {guessPt && <line x1={guessPt.x} y1={guessPt.y} x2={actualPt[0]} y2={actualPt[1]} stroke="#3a2a18" strokeWidth="1.5" strokeDasharray="4,3" />}
                  <circle cx={actualPt[0]} cy={actualPt[1]} r="9" fill="#1a7a3a" stroke="#fff" strokeWidth="2.5" />
                </g>
              )}
            </svg>
          </div>

          {phase === "playing" && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={lockInGuess} disabled={!pendingTap} style={{
                background: pendingTap ? "#1a3a5c" : "#ccc", color: "#fff", border: "none", borderRadius: 14,
                padding: "13px 32px", fontSize: 15, fontWeight: 800, cursor: pendingTap ? "pointer" : "default" }}>
                {pendingTap ? "Lock In Guess" : "Tap the map to guess"}
              </button>
            </div>
          )}

          {phase === "reveal" && lastAnswer && (
            <div className="okh-fade" style={{ marginTop: 16, textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1a3a5c" }}>+{lastAnswer.score} pts</div>
              <div style={{ fontSize: 13.5, color: "#7a6548", marginBottom: 6 }}>
                {Math.round(lastAnswer.distance)} miles from {current.place}
              </div>
              <p style={{ fontSize: 13, color: "#5a4630", lineHeight: 1.5, maxWidth: 380, margin: "0 auto 14px" }}>💡 {current.fact}</p>
              <button onClick={nextQuestion} style={{ background: "#b5451f", color: "#fff", border: "none", borderRadius: 14,
                padding: "12px 30px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                {qIndex + 1 >= questions.length ? "See Results" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="okh-fade" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#b5451f", letterSpacing: 1 }}>TODAY&apos;S SCORE</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: "#1a3a5c", margin: "2px 0 10px" }}>
            {answers.reduce((s, a) => s + a.score, 0)}<span style={{ fontSize: 20, color: "#9a8a68" }}>/1000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            {answers.map((a, i) => (
              <div key={a.qid} style={{ fontSize: 26 }}>{tierEmoji(a.score, POINT_VALUES[i])}</div>
            ))}
          </div>
          <div style={{ textAlign: "left", maxWidth: 380, margin: "0 auto 18px" }}>
            {answers.map((a, i) => {
              const q = QUESTIONS.find(q => q.id === a.qid);
              return (
                <div key={a.qid} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px",
                  background: "rgba(255,255,255,0.55)", borderRadius: 10, marginBottom: 6, fontSize: 13.5 }}>
                  <span>{q?.place}</span>
                  <span style={{ color: "#7a6548" }}>{Math.round(a.distance)} mi</span>
                  <b style={{ color: "#1a3a5c" }}>+{a.score}</b>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 18, margin: "10px 0 20px", fontSize: 13, color: "#7a6548" }}>
            <div><b style={{ display: "block", fontSize: 18, color: "#1a3a5c" }}>{stats.streak}</b>Day streak</div>
            <div><b style={{ display: "block", fontSize: 18, color: "#1a3a5c" }}>{stats.bestScore}</b>Best score</div>
            <div><b style={{ display: "block", fontSize: 18, color: "#1a3a5c" }}>{stats.played}</b>Played</div>
          </div>
          <button onClick={doShare} style={{ background: "#1a3a5c", color: "#fff", border: "none", borderRadius: 14,
            padding: "13px 30px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            {copied ? "Copied!" : "Share Result"}
          </button>
          <p style={{ fontSize: 12, color: "#9a8a68", marginTop: 16 }}>Come back tomorrow for a new round.</p>
        </div>
      )}
    </div>
  );
}
