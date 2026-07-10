"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import type { LatLon } from "./SatelliteMap";

const SatelliteMap = dynamic(() => import("./SatelliteMap"), { ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", color: "#7a6548", fontSize: 13 }}>Loading satellite map…</div> });

// ─── Types ────────────────────────────────────────────────────────────
type Category = "history" | "person" | "fun";
interface Question {
  id: number;
  category: Category;
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

const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  history: { label: "HISTORY", emoji: "🏛️", color: "#1a3a5c" },
  person: { label: "FAMOUS OKLAHOMAN", emoji: "⭐", color: "#7a4a1a" },
  fun: { label: "FUN TRIVIA", emoji: "🎉", color: "#8a1a5c" },
};

// ─── Question bank ────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  // ── History ──
  { id: 1, category: "history", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "On April 22, 1889, thousands of settlers raced to stake claims here in the very first Oklahoma Land Run, turning open prairie into a tent city of 10,000 people by nightfall.",
    fact: "Oklahoma City became the state capital in 1910, after a contested vote moved it from Guthrie." },
  { id: 2, category: "history", place: "Guthrie", lat: 35.8786, lon: -97.4256,
    text: "This city served as Oklahoma's first state capital when statehood was declared in 1907 — before the capital was moved in a controversial 1910 election.",
    fact: "Guthrie's downtown is one of the largest contiguous urban historic districts in the U.S., largely because the town was frozen in time after losing the capital." },
  { id: 3, category: "history", place: "Tulsa", lat: 36.1540, lon: -95.9928,
    text: "Once known as the 'Oil Capital of the World,' this city's Greenwood District — nicknamed 'Black Wall Street' — was destroyed in the 1921 race massacre.",
    fact: "Greenwood was one of the wealthiest Black communities in America before the massacre destroyed over 35 city blocks." },
  { id: 4, category: "history", place: "Boise City", lat: 36.7267, lon: -102.5171,
    text: "This remote Panhandle town holds a strange WWII distinction: it's the only place in the continental U.S. bombed by the American military — by accident, in 1943.",
    fact: "A B-17 crew mistook the town's lights for a practice bombing range and dropped six practice bombs on it." },
  { id: 5, category: "history", place: "Anadarko", lat: 35.0723, lon: -98.2437,
    text: "This city calls itself the 'Indian Capital of the Nation' and hosts the American Indian Exposition, one of the oldest Native gatherings in the country, every summer.",
    fact: "Anadarko is headquarters to several tribal nations, including the Caddo, Delaware, and Wichita." },
  { id: 6, category: "history", place: "Tahlequah", lat: 35.9151, lon: -94.9700,
    text: "This is the capital of the Cherokee Nation and one of the endpoints of the Trail of Tears into Indian Territory.",
    fact: "Tahlequah was founded in 1839, shortly after the forced removal of the Cherokee from the southeastern United States." },
  { id: 7, category: "history", place: "Bartlesville", lat: 36.7473, lon: -95.9808,
    text: "In 1897, the Nellie Johnstone No. 1 well blew in here, launching Oklahoma's first commercial oil boom.",
    fact: "Bartlesville later became headquarters to Phillips Petroleum, one of the giants of the American oil industry." },
  { id: 8, category: "history", place: "Ardmore", lat: 34.1743, lon: -97.1436,
    text: "On September 27, 1915, a massive nitroglycerin explosion tore through this southern Oklahoma oil town, killing dozens and leveling much of downtown.",
    fact: "The blast was heard over 75 miles away and remains one of the deadliest industrial disasters in state history." },
  { id: 9, category: "history", place: "Enid", lat: 36.3956, lon: -97.8784,
    text: "This city sprang up almost overnight after the Cherokee Outlet Land Run of 1893 — one of the largest land runs in U.S. history.",
    fact: "Nearly 100,000 people raced for claims in the Cherokee Outlet on a single day, September 16, 1893." },
  { id: 10, category: "history", place: "Moore", lat: 35.3395, lon: -97.4867,
    text: "An EF5 tornado tore through this Oklahoma City suburb on May 20, 2013, one of the costliest and deadliest tornadoes in U.S. history.",
    fact: "Moore was hit by violent tornadoes in 1999, 2003, and again in 2013 — an unusual repeat target for EF5-strength storms." },
  { id: 11, category: "history", place: "Spiro Mounds", lat: 35.2848, lon: -94.6252,
    text: "This ancient Native American mound complex near the Arkansas border was a major trade and ceremonial center over 1,000 years ago.",
    fact: "Spiro Mounds produced some of the finest pre-Columbian art and artifacts ever found in North America." },
  { id: 12, category: "history", place: "Fort Gibson", lat: 35.7998, lon: -95.2530,
    text: "Founded in 1824 along the Grand River, this was the first permanent U.S. military post established in what is now Oklahoma.",
    fact: "Fort Gibson later served as a staging point for tribes arriving at the end of the Trail of Tears." },
  { id: 13, category: "history", place: "Woodward", lat: 36.4336, lon: -99.3904,
    text: "On April 9, 1947, one of the deadliest tornadoes in U.S. history killed over 100 people in and around this northwestern Oklahoma city.",
    fact: "The 1947 Woodward tornado struck before modern warning systems existed, giving residents almost no notice." },
  { id: 14, category: "history", place: "Sallisaw", lat: 35.4609, lon: -94.7908,
    text: "Near this eastern Oklahoma town lived Sequoyah, who single-handedly created a writing system for the Cherokee language in the early 1820s.",
    fact: "Sequoyah's syllabary made the Cherokee Nation one of the most literate populations in North America within a few years of its adoption." },
  { id: 15, category: "history", place: "Okmulgee", lat: 35.6234, lon: -95.9538,
    text: "This city has served as the capital of the Muscogee (Creek) Nation since the tribe's forced removal from the southeastern U.S. in the 1830s.",
    fact: "Okmulgee's Creek Council House, built in 1878, still stands today as a museum." },

  // ── Famous Oklahomans ──
  { id: 16, category: "person", place: "Okemah", lat: 35.4323, lon: -96.3033,
    text: "A dust-bowl era folk singer who wrote 'This Land Is Your Land' was born in this small east-central Oklahoma town in 1912.",
    fact: "Woody Guthrie's songs about migrant workers and hard times went on to inspire Bob Dylan and generations of songwriters." },
  { id: 17, category: "person", place: "Oologah", lat: 36.4362, lon: -95.7080,
    text: "A rope-twirling cowboy humorist who famously said 'I never met a man I didn't like' was born on a ranch near this town in 1879.",
    fact: "Will Rogers became one of the most beloved entertainers and political commentators of the early 20th century." },
  { id: 18, category: "person", place: "Atoka", lat: 34.3878, lon: -96.1256,
    text: "A red-headed queen of country music grew up on a cattle ranch near this southeastern Oklahoma town — and in 2023 she opened a restaurant here bearing her first name.",
    fact: "Reba McEntire's restaurant, Reba's Place, opened in a century-old Masonic Temple in Atoka in partnership with the Choctaw Nation." },
  { id: 19, category: "person", place: "Yukon", lat: 35.5067, lon: -97.7395,
    text: "Born in Tulsa but raised from age four in this town just west of Oklahoma City, a future country superstar had a street renamed after him here in 1992: Garth Brooks Boulevard.",
    fact: "Garth Brooks went on to become one of the best-selling solo artists in U.S. history." },
  { id: 20, category: "person", place: "Shawnee", lat: 35.3273, lon: -96.9253,
    text: "A future Hollywood A-lister born here in 1963 can trace his Oklahoma roots back to the Land Run era.",
    fact: "Brad Pitt was born in Shawnee before his family later moved to Missouri." },
  { id: 21, category: "person", place: "Commerce", lat: 36.9384, lon: -94.8791,
    text: "A future New York Yankees legend, nicknamed 'The Commerce Comet,' grew up in this small mining town in Oklahoma's far northeast corner.",
    fact: "Mickey Mantle's father worked the lead and zinc mines here before Mickey became one of baseball's greatest switch-hitters." },
  { id: 22, category: "person", place: "Prague", lat: 35.4756, lon: -96.6825,
    text: "One of the greatest all-around athletes in history — an Olympic gold medalist in both the pentathlon and decathlon — was born on the Sac and Fox reservation near this town in 1888.",
    fact: "Jim Thorpe also played professional football and baseball, and the NFL's most valuable player trophy line traces its roots to his legacy." },
  { id: 23, category: "person", place: "Ryan", lat: 34.0273, lon: -97.9531,
    text: "A martial artist and action star known for roundhouse kicks — and for internet 'facts' claiming he can divide by zero — was born in this small southern Oklahoma town in 1940.",
    fact: "Chuck Norris trained in Tang Soo Do while stationed with the Air Force before launching his film career." },
  { id: 24, category: "person", place: "Checotah", lat: 35.4640, lon: -95.5305,
    text: "A country music powerhouse who won 'American Idol' in 2005 was born in nearby Muskogee but grew up on a farm in this small town, performing at the local talent show as a kid.",
    fact: "Carrie Underwood has since become one of the best-selling country artists of all time." },
  { id: 25, category: "person", place: "Clinton", lat: 35.5153, lon: -98.9679,
    text: "A country singer known for anthems like 'Should've Been a Cowboy' and 'Courtesy of the Red, White and Blue' was born in this Route 66 town in 1961.",
    fact: "Toby Keith was raised largely in Oklahoma City and often credited his Oklahoma roots for his songwriting." },

  // ── Fun trivia ──
  { id: 26, category: "fun", place: "Catoosa", lat: 36.1892, lon: -95.7469,
    text: "A big blue sea creature has called this landlocked Route 66 town home since 1972 — built out of iron and concrete as an anniversary gift, not an ocean in sight.",
    fact: "The Blue Whale of Catoosa was built by Hugh Davis as a surprise gift for his wife Zelta, who collected whale figurines." },
  { id: 27, category: "fun", place: "Tulsa", lat: 36.1478, lon: -95.9270,
    text: "A 76-foot-tall golden giant of a man, modeled after a real oilfield roughneck and engineered to survive 200-mph tornado winds, has towered over this city's fairgrounds since 1966.",
    fact: "The Golden Driller weighs 43,500 pounds and is one of the tallest statues in the United States." },
  { id: 28, category: "fun", place: "Foyil", lat: 36.3839, lon: -95.5127,
    text: "The world's largest concrete totem pole — 90 feet tall, covered in 200 carved images, and perched atop a giant turtle — rises from the prairie near this small town.",
    fact: "A retired art teacher named Ed Galloway spent over a decade, from 1937 to 1948, building Totem Pole Park by hand." },
  { id: 29, category: "fun", place: "Arcadia", lat: 35.6534, lon: -97.3239,
    text: "A 66-foot-tall soda bottle covered in LED lights glows over Route 66 at night in this small town, next to a shop selling more than 600 flavors of pop.",
    fact: "POPS sits beside Arcadia's century-old Round Barn, another beloved Route 66 landmark." },
  { id: 30, category: "fun", place: "Vinita", lat: 36.6417, lon: -95.1533,
    text: "For decades this town was home to the world's largest McDonald's — a restaurant built as a bridge spanning an entire interstate turnpike.",
    fact: "Opened in 1958 as 'The Glass House,' the building was renamed the Will Rogers Archway in 2014." },
];

const POINT_VALUES = [100, 100, 200, 300, 300];
const DAILY_MIX: Category[] = ["history", "history", "person", "person", "fun"];

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
function shuffled<T>(arr: T[], rand: () => number): T[] {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}
function questionsForDate(dateKey: string): Question[] {
  const rand = mulberry32(hashStr(dateKey));
  const used = new Set<number>();
  const picks: Question[] = [];
  for (const cat of DAILY_MIX) {
    const pool = QUESTIONS.filter(q => q.category === cat && !used.has(q.id));
    const pick = shuffled(pool, rand)[0] || shuffled(QUESTIONS.filter(q => !used.has(q.id)), rand)[0];
    if (pick) { picks.push(pick); used.add(pick.id); }
  }
  return shuffled(picks, rand);
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
  const [pendingTap, setPendingTap] = useState<LatLon | null>(null);
  const [lastAnswer, setLastAnswer] = useState<Answer | null>(null);
  const [stats, setStats] = useState<Stats>({ played: 0, totalScore: 0, bestScore: 0, streak: 0, bestStreak: 0, lastPlayedDate: null });
  const [copied, setCopied] = useState(false);

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

  const handlePick = useCallback((lat: number, lon: number) => {
    setPendingTap({ lat, lon });
  }, []);

  const lockInGuess = () => {
    if (!pendingTap || !current) return;
    const distance = haversineMiles(pendingTap.lat, pendingTap.lon, current.lat, current.lon);
    const max = POINT_VALUES[qIndex];
    const score = scoreFor(distance, max);
    const answer: Answer = { qid: current.id, distance, score, tapLat: pendingTap.lat, tapLon: pendingTap.lon };
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

  const catMeta = current ? CATEGORY_META[current.category] : null;

  return (
    <div style={{ minHeight: "100vh", maxWidth: 560, margin: "0 auto", position: "relative",
      background: "linear-gradient(180deg,#fbf3e3 0%,#f5e6c8 100%)", fontFamily: "system-ui, -apple-system, sans-serif", color: "#3a2a18" }}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .okh-fade{animation:fadeIn .35s ease both}
        button{font-family:inherit}
        .leaflet-container{background:#0e2a3d}
      `}</style>

      <header style={{ padding: "22px 20px 14px", textAlign: "center", background: "#1a3a5c", color: "#fbf3e3" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.75, fontWeight: 700 }}>DAILY TRIVIA</div>
        <h1 style={{ fontSize: 30, margin: "4px 0 2px", fontWeight: 800, letterSpacing: -0.5 }}>OK History</h1>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Tap the satellite map. Guess where it happened in Oklahoma.</div>
      </header>

      {phase === "loading" && <div style={{ padding: 60, textAlign: "center" }}>Loading today&apos;s round…</div>}

      {phase === "intro" && (
        <div className="okh-fade" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5a4630" }}>
            5 questions about Oklahoma history, famous Oklahomans, and fun trivia. Tap the spot on the satellite map where
            you think the answer is — the closer you are, the more points you score. Everyone gets the same 5 questions each day.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, margin: "14px 0", flexWrap: "wrap" }}>
            {(Object.keys(CATEGORY_META) as Category[]).map(c => (
              <span key={c} style={{ background: CATEGORY_META[c].color, color: "#fff", borderRadius: 20,
                padding: "5px 12px", fontSize: 11.5, fontWeight: 700 }}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</span>
            ))}
          </div>
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

      {(phase === "playing" || phase === "reveal") && current && catMeta && (
        <div className="okh-fade" style={{ padding: "14px 16px 24px" }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{ width: 30, height: 6, borderRadius: 3,
                background: i < qIndex ? "#1a3a5c" : i === qIndex ? "#b5451f" : "#e3d3ae" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ background: catMeta.color, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 10.5, fontWeight: 700 }}>
              {catMeta.emoji} {catMeta.label}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#b5451f" }}>
              Q{qIndex + 1} OF {questions.length} · UP TO {POINT_VALUES[qIndex]} PTS
            </span>
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, textAlign: "center", margin: "6px 0 14px", fontWeight: 600 }}>
            {current.text}
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", border: "3px solid #1a3a5c", height: 340 }}>
            <SatelliteMap
              resetKey={qIndex}
              locked={phase === "reveal"}
              guess={pendingTap}
              actual={phase === "reveal" ? { lat: current.lat, lon: current.lon, label: current.place } : null}
              onPick={handlePick}
            />
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
              <p style={{ fontSize: 13, color: "#5a4630", lineHeight: 1.5, maxWidth: 420, margin: "0 auto 14px" }}>💡 {current.fact}</p>
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
          <div style={{ textAlign: "left", maxWidth: 420, margin: "0 auto 18px" }}>
            {answers.map((a, i) => {
              const q = QUESTIONS.find(q => q.id === a.qid);
              const meta = q ? CATEGORY_META[q.category] : null;
              return (
                <div key={a.qid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px",
                  background: "rgba(255,255,255,0.55)", borderRadius: 10, marginBottom: 6, fontSize: 13.5, gap: 6 }}>
                  <span>{meta?.emoji} {q?.place}</span>
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
