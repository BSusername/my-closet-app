"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────
interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  style: string;
  seasons: string[];
  img: string | null;
  vibe_tags: string[];
  occasion_tags: string[];
}
interface WeatherData {
  temp: number;
  desc: string;
  emoji: string;
  season: string;
  city: string;
}
interface Outfit {
  items: ClothingItem[];
  vibe: string;
  note?: string;
  rating?: number;
  reaction?: string | null;
}
interface Profile {
  id: string;
  name: string;
  avatar: string;
  vibes: string[];
  occasions: string[];
}
interface FavoriteEntry {
  id: string;
  date: string;
  itemIds: string[];
  vibe: string;
  note?: string;
  occasion?: string;
  vibes?: string[];
  reaction?: string | null;
  rating: number;
  weather?: { temp: number; desc: string; emoji: string } | null;
}
interface HistoryEntry {
  id: string;
  date: string;
  itemIds: string[];
  vibe: string;
  note?: string;
  occasion?: string;
  vibes?: string[];
  reaction?: string | null;
  rating: number;
  weather?: { temp: number; desc: string; emoji: string };
}
interface FeedbackEntry {
  key: string;
  itemIds: string[];
  vibes: string[];
  occasion: string;
  reaction: string | null;
  rating?: number;
  date: string;
}
interface NewItem {
  name: string;
  category: string;
  color: string;
  style: string;
  seasons: string[];
  img: string | null;
  vibe_tags: string[];
  occasion_tags: string[];
}
interface NewProfileState {
  name: string;
  avatar: string;
  vibes: string[];
  occasions: string[];
}
interface BatchProgress {
  current: number;
  total: number;
}
interface Tag {
  id: string;
  label: string;
  emoji: string;
}
interface AIAnalysisResult {
  name?: string;
  category?: string;
  color?: string;
  style?: string;
  seasons?: string[];
  vibe_tags?: string[];
  occasion_tags?: string[];
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────
const CATEGORIES = ["Top","Bottom","Dress","Outerwear","Shoes","Accessory","Hat"];
const SEASONS = ["Spring","Summer","Fall","Winter"];
const STYLES = ["Casual","Dressy","Sporty","Business","Boho"];
const COLORS = ["Black","White","Navy","Gray","Red","Pink","Blue","Green","Brown","Beige","Yellow","Orange","Purple","Multi"];
const CAT_EMOJI: Record<string, string> = {Top:"👚",Bottom:"👖",Dress:"👗",Outerwear:"🧥",Shoes:"👟",Accessory:"💍",Hat:"🎩"};
const CAT_BG: Record<string, string> = {
  Top:"linear-gradient(135deg,#f4c6d0,#f0a5b8)",Bottom:"linear-gradient(135deg,#a3d5e8,#7eb8d0)",
  Dress:"linear-gradient(135deg,#e0bfe6,#d4a5d8)",Outerwear:"linear-gradient(135deg,#a8ddb8,#8bc5a3)",
  Shoes:"linear-gradient(135deg,#ddd0b5,#c9b896)",Accessory:"linear-gradient(135deg,#f0d590,#e8c170)",
  Hat:"linear-gradient(135deg,#c8bce0,#b8a5d4)",
};
const VIBES: Tag[] = [
  {id:"cute",label:"Cute",emoji:"🎀"},{id:"comfy",label:"Comfy",emoji:"☁️"},
  {id:"trendy",label:"Trendy",emoji:"🔥"},{id:"preppy",label:"Preppy",emoji:"🎓"},
  {id:"sporty",label:"Sporty",emoji:"⚡"},{id:"minimal",label:"Minimal",emoji:"◻️"},
  {id:"classy",label:"Classy",emoji:"✨"},{id:"soft",label:"Soft",emoji:"🌸"},
  {id:"streetwear",label:"Streetwear",emoji:"🛹"},{id:"dressy",label:"Dressy",emoji:"💎"},
  {id:"chill",label:"Chill",emoji:"😎"},{id:"cozy",label:"Cozy",emoji:"🧸"},
  {id:"edgy",label:"Edgy",emoji:"🖤"},{id:"boho",label:"Boho",emoji:"🌻"},
];
const OCCASIONS: Tag[] = [
  {id:"school",label:"School",emoji:"📚"},{id:"church",label:"Church",emoji:"⛪"},
  {id:"date",label:"Date",emoji:"💕"},{id:"family-dinner",label:"Family Dinner",emoji:"🍽️"},
  {id:"party",label:"Party",emoji:"🎉"},{id:"concert",label:"Concert",emoji:"🎵"},
  {id:"errands",label:"Errands",emoji:"🛒"},{id:"vacation",label:"Vacation",emoji:"✈️"},
  {id:"hangout",label:"Hangout",emoji:"👯"},{id:"brunch",label:"Brunch",emoji:"🥂"},
  {id:"work",label:"Work",emoji:"💼"},{id:"workout",label:"Workout",emoji:"🏋️"},
];
const AVATARS = ["👩","👩‍🦰","👩‍🦱","👱‍♀️","🧑","👨","👨‍🦱","👱","🧑‍🦰","👩‍🦳"];
const WMO_CODES: Record<number, string> = {0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Heavy freezing rain",71:"Light snow",73:"Snow",75:"Heavy snow",80:"Light showers",81:"Showers",82:"Heavy showers",95:"Thunderstorm"};
const WMO_EMOJI = (c: number): string => c<=1?"☀️":c<=3?"⛅":c<=48?"🌫️":c<=55?"🌦️":c<=67?"🌧️":c<=77?"❄️":c<=82?"🌧️":"⛈️";
const tempToSeason = (f: number): string => f>=80?"Summer":f>=65?"Spring":f>=45?"Fall":"Winter";

const BLANK_ITEM: NewItem = {name:"",category:"Top",color:"Black",style:"Casual",seasons:[...SEASONS],img:null,vibe_tags:[],occasion_tags:[]};
const SCREEN_TITLES: Record<string, string> = {home:"My Closet",today:"What's Today?",outfits:"Your Looks",favorites:"Saved",history:"History"};

// ─── Storage (localStorage) ───────────────────────────────────────────
async function sGet<T>(k: string): Promise<T | null> {
  try {
    const item = localStorage.getItem(k);
    return item ? (JSON.parse(item) as T) : null;
  } catch { return null; }
}
async function sSet(k: string, v: unknown): Promise<void> {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

// ─── Image Compression ────────────────────────────────────────────────
function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * (maxWidth / w)); w = maxWidth; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ─── AI ───────────────────────────────────────────────────────────────
const AI_HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? "",
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};

async function analyzeClothingPhoto(b64: string, mt: string): Promise<AIAnalysisResult> {
  try {
    const bodySize = b64.length;
    if (bodySize > 5000000) return { error: "Image too large: " + Math.round(bodySize / 1024) + "KB" };
    let r: Response;
    try {
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: AI_HEADERS,
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mt, data: b64 } },
          { type: "text", text: `Fashion expert: analyze this clothing item photo. Return ONLY a valid JSON object with no other text, no markdown, no explanation:\n{"name":"descriptive name","category":"Top|Bottom|Dress|Outerwear|Shoes|Accessory|Hat","color":"Black|White|Navy|Gray|Red|Pink|Blue|Green|Brown|Beige|Yellow|Orange|Purple|Multi","style":"Casual|Dressy|Sporty|Business|Boho","seasons":["Spring","Summer","Fall","Winter"],"vibe_tags":["pick 2-4 from: cute,comfy,trendy,preppy,sporty,minimal,classy,soft,streetwear,dressy,chill,cozy,edgy,boho"],"occasion_tags":["pick 2-4 from: school,church,date,family-dinner,party,concert,errands,vacation,hangout,brunch,work,workout"]}` },
        ]}] }),
      });
    } catch (fetchErr) { return { error: "Fetch failed: " + String(fetchErr).slice(0, 200) }; }
    if (!r.ok) {
      let errBody = ""; try { errBody = await r.text(); } catch {}
      return { error: "HTTP " + r.status + ": " + errBody.slice(0, 200) };
    }
    let d: { content?: Array<{ text?: string }>; error?: { message?: string } };
    try { d = await r.json(); } catch {
      return { error: "JSON parse failed" };
    }
    if (d.error) return { error: "API error: " + (d.error.message || "").slice(0, 200) };
    const text = (d.content || []).map(b => b.text || "").join("");
    if (!text) return { error: "Empty AI response" };
    try {
      return JSON.parse(text.replace(/```json|```/g, "").trim()) as AIAnalysisResult;
    } catch { return { error: "AI returned non-JSON: " + text.slice(0, 300) }; }
  } catch (e) { return { error: "Exception: " + String(e).slice(0, 200) }; }
}

async function generateAIOutfits(
  items: ClothingItem[], weather: WeatherData, occasion: string,
  vibes: string[], profile: Profile | undefined, feedback: FeedbackEntry[]
): Promise<Outfit[] | null> {
  const sum = items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, style: i.style, seasons: i.seasons, vibe_tags: i.vibe_tags || [], occasion_tags: i.occasion_tags || [] }));
  let prefHint = "";
  if (profile) prefHint += `\nUSER STYLE PROFILE: Loves vibes: ${profile.vibes.join(", ")}. Common occasions: ${profile.occasions.join(", ")}.`;
  const loved = feedback.filter(f => f.reaction === "love");
  const noped = feedback.filter(f => f.reaction === "nope");
  if (loved.length > 0) prefHint += `\nUSER LOVED outfits with vibes: ${loved.map(f => f.vibes?.join(",")).filter(Boolean).join("; ")}.`;
  if (noped.length > 0) prefHint += `\nUSER DISLIKED outfits with vibes: ${noped.map(f => f.vibes?.join(",")).filter(Boolean).join("; ")}. Avoid similar.`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: AI_HEADERS,
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content:
        `You are a teen fashion stylist. Create 3 outfit options.\n\nOCCASION: ${occasion}\nDESIRED VIBES: ${vibes.join(", ")}\nWEATHER: ${weather.temp}°F, ${weather.desc}, ${weather.season}\n${prefHint}\n\nWARDROBE:\n${JSON.stringify(sum)}\n\nRules:\n- 2-5 items each, weather-appropriate, color-coordinated\n- Match the occasion and vibe\n- Prioritize items tagged with matching vibes and occasions\n- #1=best match #2=elevated #3=wild card\n- Minimize repeating items\n\nReturn ONLY JSON array:\n[{"items":["id1","id2"],"vibe":"2-3 word vibe","note":"short styling tip"}]`
      }] }),
    });
    const d = await r.json();
    const p = JSON.parse((d.content || []).map((b: { text?: string }) => b.text || "").join("").replace(/```json|```/g, "").trim()) as Array<{ items: string[]; vibe: string; note: string }>;
    return p.map(o => ({ ...o, items: o.items.map((id: string) => items.find(i => i.id === id)).filter((i): i is ClothingItem => Boolean(i)) })).filter(o => o.items.length >= 2);
  } catch { return null; }
}

function fallbackOutfits(closet: ClothingItem[], weather: WeatherData): Outfit[] {
  if (closet.length < 3) return [];
  const { season, temp, desc } = weather;
  const cold = temp < 45, hot = temp > 80, rainy = Boolean((desc || "").toLowerCase().match(/rain|shower/));
  const pool = closet.filter(i => i.seasons.includes(season));
  const src = pool.length > 4 ? pool : closet;
  const pick = (cat: string, sty: string | null, ex: string[] = []): ClothingItem | null => {
    let p = src.filter(i => i.category === cat && !ex.includes(i.id));
    if (sty) { const s = p.filter(i => i.style === sty); if (s.length) p = s; }
    return p.length ? p[Math.floor(Math.random() * p.length)] : null;
  };
  const build = (sty: string | null, ex: string[], vibe: string, note: string): Outfit | null => {
    const items: ClothingItem[] = [];
    const d = (hot || sty === "Dressy") ? pick("Dress", sty, ex) : null;
    if (d) items.push(d); else { const t = pick("Top", sty, ex); if (t) items.push(t); const b = pick("Bottom", sty, ex); if (b) items.push(b); }
    if (cold || rainy) { const o = pick("Outerwear", sty, ex); if (o) items.push(o); }
    const sh = pick("Shoes", sty, ex); if (sh) items.push(sh);
    return items.length >= 2 ? { items, vibe, note } : null;
  };
  const res: Outfit[] = [];
  const o1 = build(null, [], "Weather-perfect", "Suited for today"); if (o1) res.push(o1);
  const u1 = o1 ? o1.items.map(i => i.id) : [];
  const o2 = build("Dressy", u1, "Elevated", "Dress it up ✨"); if (o2) res.push(o2);
  const u2 = [...u1, ...(o2 ? o2.items.map(i => i.id) : [])];
  const o3 = build("Casual", u2, "Easy & relaxed", "Comfort is key"); if (o3) res.push(o3);
  return res;
}

function shareOutfit(outfit: Outfit, weather: Partial<WeatherData>) {
  const list = outfit.items.map(i => `  • ${i.name}`).join("\n");
  const text = `${weather?.emoji || "🌤"} ${weather?.temp || ""}°F\n✨ ${outfit.vibe}\n\n${list}\n\n💡 ${outfit.note || ""}\n\nStyled by My Closet`;
  if (navigator.share) navigator.share({ title: `Outfit: ${outfit.vibe}`, text }).catch(() => {});
  else navigator.clipboard?.writeText(text).then(() => alert("Copied!")).catch(() => {});
}

// ─── Bubble Selector ──────────────────────────────────────────────────
function BubbleSelect({ items, selected, onToggle }: { items: Tag[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
      {items.map(item => {
        const sel = selected.includes(item.id);
        return (
          <button key={item.id} onClick={() => onToggle(item.id)} style={{
            background: sel ? "#2e2038" : "rgba(255,255,255,0.6)", color: sel ? "#fff" : "#5a4d6a",
            border: sel ? "2px solid #2e2038" : "2px solid rgba(0,0,0,0.06)", borderRadius: 14,
            padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-body)", transition: "all 0.2s", minWidth: "30%", textAlign: "center",
          }}>
            <span style={{ fontSize: 18, display: "block", marginBottom: 2 }}>{item.emoji}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────
function ItemCard({ item, small, onDelete }: { item: ClothingItem; small?: boolean; onDelete?: (id: string) => void }) {
  const w = small ? 70 : 105, h = small ? 88 : 128;
  return (
    <div style={{ width: w, position: "relative", flexShrink: 0 }}>
      <div style={{ width: w, height: h, borderRadius: 14, overflow: "hidden",
        background: item.img ? `url(${item.img}) center/cover` : CAT_BG[item.category],
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 3px 14px rgba(0,0,0,0.08)", border: "2px solid rgba(255,255,255,0.7)", transition: "transform 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
        {!item.img && <span style={{ fontSize: small ? 24 : 38 }}>{CAT_EMOJI[item.category] || "👔"}</span>}
      </div>
      {onDelete && <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} style={{
        position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
        border: "none", background: "rgba(50,30,50,0.7)", color: "#fff", fontSize: 12,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, fontWeight: 700 }}>×</button>}
      <p style={{ fontSize: small ? 8.5 : 10.5, textAlign: "center", marginTop: 4, color: "#4a3c54", lineHeight: 1.2, fontWeight: 600,
        fontFamily: "var(--font-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
    </div>
  );
}

// ─── Reaction Bar ─────────────────────────────────────────────────────
function ReactionBar({ reaction, onReact, rating, onRate }: {
  reaction: string | null | undefined;
  onReact: (r: string) => void;
  rating: number;
  onRate: (r: number) => void;
}) {
  const [showStars, setShowStars] = useState(false);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {([{ id: "nope", emoji: "🙅‍♀️", label: "Nope" }, { id: "maybe", emoji: "🤷‍♀️", label: "Maybe" }, { id: "love", emoji: "💖", label: "Love!" }] as const).map(r => (
          <button key={r.id} onClick={() => { onReact(r.id); if (r.id === "love") setShowStars(true); }} style={{
            background: reaction === r.id ? (r.id === "love" ? "#ffe0ea" : r.id === "nope" ? "#f0e0e0" : "#e8e4f0") : "rgba(255,255,255,0.5)",
            border: reaction === r.id ? "2px solid " + (r.id === "love" ? "#d4636f" : r.id === "nope" ? "#c49090" : "#9a7cbf") : "2px solid rgba(0,0,0,0.04)",
            borderRadius: 14, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700,
            fontFamily: "var(--font-body)", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            transform: reaction === r.id ? "scale(1.05)" : "scale(1)",
          }}>
            <span style={{ fontSize: 20 }}>{r.emoji}</span>{r.label}
          </button>
        ))}
      </div>
      {(showStars || rating > 0) && (
        <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => onRate(s === rating ? 0 : s)} style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 1,
              filter: s <= (rating || 0) ? "none" : "grayscale(1) opacity(0.25)", transition: "transform 0.15s",
            }}>⭐</button>
          ))}
          {rating > 0 && <span style={{ fontSize: 10, color: "#b0a4bc", fontWeight: 700, marginLeft: 4, alignSelf: "center", fontFamily: "var(--font-body)" }}>
            {rating === 5 ? "Love it!" : rating === 4 ? "Great" : rating === 3 ? "Good" : rating === 2 ? "Meh" : "Nope"}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Outfit Card ──────────────────────────────────────────────────────
function OutfitCard({ outfit, index, isFav, onToggleFav, onShare, onReact, onRate, weather }: {
  outfit: Outfit;
  index: number;
  isFav: boolean;
  onToggleFav: (o: Outfit) => void;
  onShare: (o: Outfit) => void;
  onReact: (o: Outfit, r: string) => void;
  onRate: (o: Outfit, r: number) => void;
  weather: Partial<WeatherData> | null;
}) {
  const accents = ["#d4636f", "#5a9bb0", "#9a7cbf"];
  const labels = ["Best Match", "Elevated", "Wild Card"];
  const emojis = ["🎯", "✨", "🎲"];
  const accent = accents[index % 3];
  return (
    <div style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)", borderRadius: 20,
      padding: "16px 14px", marginBottom: 14, border: `2px solid ${accent}30`, boxShadow: `0 4px 24px ${accent}15`,
      animation: `slideUp 0.4s ease ${(index % 3) * 0.12}s both` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ background: `linear-gradient(135deg,${accent},${accent}cc)`, color: "#fff", borderRadius: 20,
          padding: "4px 12px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)" }}>{emojis[index % 3]} {labels[index % 3]}</span>
        <span style={{ fontSize: 10.5, color: "#998da6", fontFamily: "var(--font-body)", fontStyle: "italic", flex: 1 }}>{outfit.vibe}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onToggleFav(outfit)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 2,
            filter: isFav ? "none" : "grayscale(1) opacity(0.4)" }}>{isFav ? "❤️" : "🤍"}</button>
          <button onClick={() => onShare(outfit)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", padding: 2, opacity: .5 }}>📤</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {outfit.items.map(item => <ItemCard key={item.id + "-o" + index} item={item} small />)}
      </div>
      {outfit.note && <p style={{ fontSize: 11, color: "#8a7d96", marginTop: 8, textAlign: "center", fontFamily: "var(--font-body)", fontWeight: 500 }}>💡 {outfit.note}</p>}
      <ReactionBar reaction={outfit.reaction} onReact={r => onReact(outfit, r)} rating={outfit.rating || 0} onRate={r => onRate(outfit, r)} />
    </div>
  );
}

// ═══ MAIN APP ═════════════════════════════════════════════════════════
export default function ClosetApp() {
  // ── Core state ──
  const [appPhase, setAppPhase] = useState<"loading" | "profiles" | "onboarding" | "app">("loading");
  const [screen, setScreen] = useState<"home" | "today" | "outfits" | "favorites" | "history">("home");

  // ── Profile state ──
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [onboardStep, setOnboardStep] = useState(0);
  const [newProfile, setNewProfile] = useState<NewProfileState>({ name: "", avatar: "👩", vibes: [], occasions: [] });

  // ── App state ──
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [generating, setGenerating] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [filterCat, setFilterCat] = useState("All");

  // ── Modal / form state ──
  const [showAdd, setShowAdd] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showProfileSwitch, setShowProfileSwitch] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>({ ...BLANK_ITEM, seasons: [...SEASONS] });
  const [analyzing, setAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [manualTemp, setManualTemp] = useState("72");
  const [manualCond, setManualCond] = useState("Clear sky");

  // ── "What's today?" state ──
  const [selOccasion, setSelOccasion] = useState("");
  const [selVibes, setSelVibes] = useState<string[]>([]);

  // ── Batch import state ──
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  const profile = profiles.find(p => p.id === currentId);

  // ── Load profiles on mount ──
  useEffect(() => {
    (async () => {
      const profs = await sGet<Profile[]>("closet-profiles") || [];
      const curId = await sGet<string>("closet-current-id");
      setProfiles(profs);
      if (curId && profs.find(p => p.id === curId)) {
        setCurrentId(curId);
        setAppPhase("app");
      } else if (profs.length > 0) {
        setAppPhase("profiles");
      } else {
        setAppPhase("onboarding");
      }
    })();
  }, []);

  // ── Load user data when profile changes ──
  useEffect(() => {
    if (!currentId) return;
    (async () => {
      const c = await sGet<ClothingItem[]>(`closet-items-${currentId}`) || [];
      const f = await sGet<FavoriteEntry[]>(`closet-favs-${currentId}`) || [];
      const h = await sGet<HistoryEntry[]>(`closet-hist-${currentId}`) || [];
      const fb = await sGet<FeedbackEntry[]>(`closet-fb-${currentId}`) || [];
      setCloset(c); setFavorites(f); setHistory(h); setFeedback(fb);
      sSet("closet-current-id", currentId);
    })();
  }, [currentId]);

  // ── Auto-save ──
  useEffect(() => { if (currentId && profiles.length) sSet("closet-profiles", profiles); }, [profiles, currentId]);
  useEffect(() => { if (currentId) sSet(`closet-items-${currentId}`, closet); }, [closet, currentId]);
  useEffect(() => { if (currentId) sSet(`closet-favs-${currentId}`, favorites); }, [favorites, currentId]);
  useEffect(() => { if (currentId) sSet(`closet-hist-${currentId}`, history); }, [history, currentId]);
  useEffect(() => { if (currentId) sSet(`closet-fb-${currentId}`, feedback); }, [feedback, currentId]);

  // ── Weather ──
  useEffect(() => {
    (async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => {
          if (!navigator.geolocation) { rej(new Error("no geolocation")); return; }
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 });
        });
        const { latitude: lat, longitude: lon } = pos.coords;
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`);
        const d = await r.json();
        const temp = Math.round(d.current.temperature_2m);
        const code: number = d.current.weather_code;
        let city = "";
        try { const g = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`); const gd = await g.json(); city = gd.address?.city || gd.address?.town || gd.address?.county || ""; } catch {}
        setWeather({ temp, desc: WMO_CODES[code] || "Unknown", emoji: WMO_EMOJI(code), season: tempToSeason(temp), city });
      } catch { setWeather({ temp: 72, desc: "Partly cloudy", emoji: "⛅", season: "Spring", city: "" }); }
      setWeatherLoading(false);
    })();
  }, []);

  // ── Onboarding ──
  const finishOnboarding = () => {
    const id = "u" + Date.now();
    const prof: Profile = { id, name: newProfile.name || "Me", avatar: newProfile.avatar, vibes: newProfile.vibes, occasions: newProfile.occasions };
    const updated = [...profiles, prof];
    setProfiles(updated); setCurrentId(id);
    sSet("closet-profiles", updated); sSet("closet-current-id", id);
    setAppPhase("app"); setNewProfile({ name: "", avatar: "👩", vibes: [], occasions: [] }); setOnboardStep(0);
  };

  const switchProfile = (id: string) => { setCurrentId(id); setShowProfileSwitch(false); setScreen("home"); };
  const addNewProfile = () => { setShowProfileSwitch(false); setOnboardStep(0); setAppPhase("onboarding"); };

  // ── Photo → AI ──
  const handlePhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAnalyzing(true); setAiStatus("Reading photo...");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const full = ev.target?.result as string;
      if (!full) { setAnalyzing(false); return; }
      setAiStatus("Compressing image...");
      const displayImg = await compressImage(full, 400, 0.7);
      setNewItem(p => ({ ...p, img: displayImg }));
      const aiImg = await compressImage(full, 256, 0.4);
      const aiB64 = aiImg.split(",")[1];
      const sizeKB = Math.round(aiB64.length / 1024);
      setAiStatus(`AI is identifying your clothing... (${sizeKB}KB)`);
      const result = await analyzeClothingPhoto(aiB64, "image/jpeg");
      if (result && !result.error) {
        setNewItem(p => ({ ...p,
          name: result.name || p.name,
          category: CATEGORIES.includes(result.category || "") ? result.category! : p.category,
          color: COLORS.includes(result.color || "") ? result.color! : p.color,
          style: STYLES.includes(result.style || "") ? result.style! : p.style,
          seasons: Array.isArray(result.seasons) ? result.seasons.filter(s => SEASONS.includes(s)) : p.seasons,
          vibe_tags: Array.isArray(result.vibe_tags) ? result.vibe_tags : p.vibe_tags,
          occasion_tags: Array.isArray(result.occasion_tags) ? result.occasion_tags : p.occasion_tags,
        }));
        setAiStatus("✅ AI identified your item!");
      } else {
        setAiStatus("⚠️ " + (result?.error || "Unknown error"));
      }
      setAnalyzing(false); setShowAdd(true);
    };
    reader.readAsDataURL(file); e.target.value = "";
  }, []);

  const addItem = () => {
    if (!newItem.name.trim()) return;
    setCloset(p => [...p, { ...newItem, id: "i" + Date.now() }]);
    resetNew(); setShowAdd(false); setAiStatus("");
  };
  const resetNew = () => setNewItem({ ...BLANK_ITEM, seasons: [...SEASONS] });
  const removeItem = (id: string) => setCloset(p => p.filter(i => i.id !== id));

  // ── Batch import ──
  const handleBatchImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setBatchProgress({ current: 0, total: files.length });
    for (let i = 0; i < files.length; i++) {
      setBatchProgress({ current: i + 1, total: files.length });
      const file = files[i];
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const displayImg = await compressImage(dataUrl, 400, 0.7);
        const aiImg = await compressImage(dataUrl, 256, 0.4);
        const result = await analyzeClothingPhoto(aiImg.split(",")[1], "image/jpeg");
        if (result && !result.error) {
          setCloset(p => [...p, {
            id: "i" + Date.now() + i,
            name: result.name || `Item ${i + 1}`,
            category: CATEGORIES.includes(result.category || "") ? result.category! : "Top",
            color: COLORS.includes(result.color || "") ? result.color! : "Black",
            style: STYLES.includes(result.style || "") ? result.style! : "Casual",
            seasons: Array.isArray(result.seasons) ? result.seasons : [...SEASONS],
            vibe_tags: Array.isArray(result.vibe_tags) ? result.vibe_tags : [],
            occasion_tags: Array.isArray(result.occasion_tags) ? result.occasion_tags : [],
            img: displayImg,
          }]);
        } else {
          setCloset(p => [...p, { id: "i" + Date.now() + i, name: `Item ${p.length + 1}`, category: "Top", color: "Black", style: "Casual", seasons: [...SEASONS], vibe_tags: [], occasion_tags: [], img: displayImg }]);
        }
      } catch {}
    }
    setBatchProgress(null); e.target.value = "";
  }, []);

  // ── Generate ──
  const doGenerate = async () => {
    if (closet.length < 3 || !weather || !selOccasion) return;
    setGenerating(true); setScreen("outfits");
    const ai = await generateAIOutfits(closet, weather, selOccasion, selVibes, profile, feedback);
    const result = (ai && ai.length >= 2) ? ai : fallbackOutfits(closet, weather);
    setOutfits(result);
    const entries: HistoryEntry[] = result.map(o => ({
      id: "h" + Date.now() + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(), itemIds: o.items.map(i => i.id), vibe: o.vibe, note: o.note,
      occasion: selOccasion, vibes: selVibes, reaction: null, rating: 0,
      weather: { temp: weather.temp, desc: weather.desc, emoji: weather.emoji },
    }));
    setHistory(prev => [...entries, ...prev].slice(0, 60));
    setGenerating(false);
  };

  // ── Reactions ──
  const outfitKey = (items: ClothingItem[]) => items.map(i => i.id).sort().join(",");

  const reactOutfit = (outfit: Outfit, reaction: string) => {
    const key = outfitKey(outfit.items);
    setOutfits(p => p.map(o => outfitKey(o.items) === key ? { ...o, reaction } : o));
    setHistory(p => p.map(h => h.itemIds.slice().sort().join(",") === key ? { ...h, reaction } : h));
    setFeedback(p => {
      const ex = p.findIndex(f => f.key === key);
      const entry: FeedbackEntry = { key, itemIds: outfit.items.map(i => i.id), vibes: selVibes, occasion: selOccasion, reaction, date: new Date().toISOString() };
      if (ex >= 0) { const n = [...p]; n[ex] = { ...n[ex], reaction }; return n; }
      return [...p, entry].slice(-100);
    });
  };

  const rateOutfit = (outfit: Outfit, rating: number) => {
    const key = outfitKey(outfit.items);
    setOutfits(p => p.map(o => outfitKey(o.items) === key ? { ...o, rating } : o));
    setHistory(p => p.map(h => h.itemIds.slice().sort().join(",") === key ? { ...h, rating } : h));
    setFeedback(p => {
      const ex = p.findIndex(f => f.key === key);
      if (ex >= 0) { const n = [...p]; n[ex] = { ...n[ex], rating }; return n; }
      return [...p, { key, itemIds: outfit.items.map(i => i.id), vibes: selVibes, occasion: selOccasion, reaction: null, rating, date: new Date().toISOString() }].slice(-100);
    });
  };

  // ── Favorites ──
  const isFav = (outfit: Outfit) => favorites.some(f => f.itemIds.slice().sort().join(",") === outfitKey(outfit.items));
  const toggleFav = (outfit: Outfit) => {
    const key = outfitKey(outfit.items);
    if (favorites.some(f => f.itemIds.slice().sort().join(",") === key)) {
      setFavorites(p => p.filter(f => f.itemIds.slice().sort().join(",") !== key));
    } else {
      setFavorites(p => [{ id: "f" + Date.now(), date: new Date().toISOString(), itemIds: outfit.items.map(i => i.id),
        vibe: outfit.vibe, note: outfit.note, occasion: selOccasion, vibes: selVibes,
        reaction: outfit.reaction || null, rating: outfit.rating || 0,
        weather: weather ? { temp: weather.temp, desc: weather.desc, emoji: weather.emoji } : null }, ...p]);
    }
  };

  const applyManual = () => {
    const t = parseInt(manualTemp) || 72;
    const rain = manualCond.toLowerCase().match(/rain|shower/);
    const snow = manualCond.toLowerCase().includes("snow");
    setWeather({ temp: t, desc: manualCond, emoji: snow ? "❄️" : rain ? "🌧️" : t > 80 ? "☀️" : t > 60 ? "⛅" : t > 40 ? "🍂" : "❄️", season: tempToSeason(t), city: weather?.city || "" });
    setShowWeather(false);
  };

  const catCounts: Record<string, number> = {};
  closet.forEach(i => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  const filtered = filterCat === "All" ? closet : closet.filter(i => i.category === filterCat);
  const resolvedFavs = favorites.map(f => ({ ...f, items: f.itemIds.map(id => closet.find(i => i.id === id)).filter((i): i is ClothingItem => Boolean(i)) })).filter(f => f.items.length >= 2);

  // ── Sorted occasions/vibes (profile picks float to top) ──
  const sortedOccasions = OCCASIONS.filter(o => profile?.occasions?.includes(o.id) || selOccasion === o.id)
    .concat(OCCASIONS.filter(o => !profile?.occasions?.includes(o.id) && selOccasion !== o.id));
  const sortedVibes = VIBES.filter(v => profile?.vibes?.includes(v.id))
    .concat(VIBES.filter(v => !profile?.vibes?.includes(v.id)));

  // ─── RENDER ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative",
      background: "linear-gradient(170deg,#faf5f0 0%,#f5eef8 35%,#eef3fa 65%,#faf7f2 100%)", fontFamily: "var(--font-body)" }}>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input,select{font-family:var(--font-body)}::-webkit-scrollbar{display:none}
      `}</style>

      {/* ═══ LOADING ═══ */}
      {appPhase === "loading" && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ fontSize: 32, animation: "pulse 1s infinite" }}>👗</p></div>}

      {/* ═══ PROFILE SELECT ═══ */}
      {appPhase === "profiles" && (
        <div style={{ padding: "60px 24px", animation: "fadeIn 0.4s ease", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: 34, color: "#2e2038", margin: "0 0 8px" }}>My Closet</h1>
          <p style={{ fontSize: 13, color: "#8a7d96", marginBottom: 30, fontWeight: 600 }}>Who&apos;s getting dressed today?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {profiles.map(p => (
              <button key={p.id} onClick={() => { setCurrentId(p.id); setAppPhase("app"); }} style={{
                background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", border: "2px solid rgba(0,0,0,0.04)",
                borderRadius: 16, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 700, color: "#2e2038" }}>
                <span style={{ fontSize: 32 }}>{p.avatar}</span>{p.name}
              </button>
            ))}
            <button onClick={addNewProfile} style={{ background: "transparent", border: "2px dashed #c4b6d2", borderRadius: 16,
              padding: "16px 20px", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#8a7d96", fontFamily: "var(--font-body)" }}>
              + Add New Profile</button>
          </div>
        </div>
      )}

      {/* ═══ ONBOARDING ═══ */}
      {appPhase === "onboarding" && (
        <div style={{ padding: "50px 24px", animation: "fadeIn 0.4s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: "#b0a4bc", fontWeight: 700, letterSpacing: 1 }}>STEP {onboardStep + 1} OF 3</p>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: i === onboardStep ? 40 : 20, height: 4, borderRadius: 2,
                background: i <= onboardStep ? "#2e2038" : "#d8d2de", transition: "all 0.3s" }} />)}
            </div>
          </div>

          {onboardStep === 0 && (<>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: 28, color: "#2e2038", textAlign: "center", margin: "0 0 24px" }}>
              Hey there! 👋<br />What&apos;s your name?
            </h2>
            <input value={newProfile.name} onChange={e => setNewProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Your name" autoFocus
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "2px solid #e4dce8", fontSize: 18,
                textAlign: "center", fontWeight: 700, outline: "none", background: "rgba(255,255,255,0.6)" }} />
            <p style={{ fontSize: 12, color: "#8a7d96", textAlign: "center", margin: "16px 0 8px", fontWeight: 700 }}>Pick your avatar</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => setNewProfile(p => ({ ...p, avatar: a }))} style={{
                  fontSize: 28, background: newProfile.avatar === a ? "#2e2038" : "rgba(255,255,255,0.5)",
                  border: "none", borderRadius: 12, width: 48, height: 48, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>{a}</button>
              ))}
            </div>
            <button onClick={() => newProfile.name.trim() && setOnboardStep(1)} disabled={!newProfile.name.trim()} style={{
              width: "100%", padding: 15, border: "none", borderRadius: 16, marginTop: 24,
              background: newProfile.name.trim() ? "linear-gradient(135deg,#d4636f,#9a7cbf)" : "#d8d2de",
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: newProfile.name.trim() ? "pointer" : "default", fontFamily: "var(--font-body)" }}>
              Next →</button>
          </>)}

          {onboardStep === 1 && (<>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: 28, color: "#2e2038", textAlign: "center", margin: "0 0 6px" }}>
              What&apos;s your vibe? 💫
            </h2>
            <p style={{ fontSize: 12.5, color: "#8a7d96", textAlign: "center", marginBottom: 20, fontWeight: 500 }}>Pick all that feel like you</p>
            <BubbleSelect items={VIBES} selected={newProfile.vibes}
              onToggle={id => setNewProfile(p => ({ ...p, vibes: p.vibes.includes(id) ? p.vibes.filter(v => v !== id) : [...p.vibes, id] }))} />
            <button onClick={() => newProfile.vibes.length > 0 && setOnboardStep(2)} disabled={newProfile.vibes.length === 0} style={{
              width: "100%", padding: 15, border: "none", borderRadius: 16, marginTop: 24,
              background: newProfile.vibes.length > 0 ? "linear-gradient(135deg,#d4636f,#9a7cbf)" : "#d8d2de",
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: newProfile.vibes.length > 0 ? "pointer" : "default", fontFamily: "var(--font-body)" }}>
              Next →</button>
          </>)}

          {onboardStep === 2 && (<>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: 28, color: "#2e2038", textAlign: "center", margin: "0 0 6px" }}>
              Where do you go? 🗓️
            </h2>
            <p style={{ fontSize: 12.5, color: "#8a7d96", textAlign: "center", marginBottom: 20, fontWeight: 500 }}>Pick your usual occasions</p>
            <BubbleSelect items={OCCASIONS} selected={newProfile.occasions}
              onToggle={id => setNewProfile(p => ({ ...p, occasions: p.occasions.includes(id) ? p.occasions.filter(v => v !== id) : [...p.occasions, id] }))} />
            <button onClick={() => newProfile.occasions.length > 0 && finishOnboarding()} disabled={newProfile.occasions.length === 0} style={{
              width: "100%", padding: 15, border: "none", borderRadius: 16, marginTop: 24,
              background: newProfile.occasions.length > 0 ? "linear-gradient(135deg,#d4636f,#9a7cbf)" : "#d8d2de",
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: newProfile.occasions.length > 0 ? "pointer" : "default", fontFamily: "var(--font-body)" }}>
              Let&apos;s Go! ✨</button>
          </>)}
        </div>
      )}

      {/* ═══ MAIN APP ═══ */}
      {appPhase === "app" && <>
        {/* Header */}
        <div style={{ padding: "16px 20px 8px", position: "sticky", top: 0, zIndex: 20,
          background: "linear-gradient(180deg,rgba(250,245,240,0.97) 60%,rgba(250,245,240,0) 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setShowProfileSwitch(true)} style={{ fontSize: 26, background: "rgba(46,32,56,0.07)", border: "none",
                borderRadius: 12, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {profile?.avatar || "👤"}
              </button>
              <div>
                <h1 style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 400, color: "#2e2038", margin: 0, lineHeight: 1.1 }}>
                  {SCREEN_TITLES[screen]}
                </h1>
                <p style={{ fontSize: 11, color: "#a89ab2", margin: "2px 0 0", fontWeight: 600 }}>{profile?.name || ""} · {closet.length} pieces</p>
              </div>
            </div>
            {screen !== "home" && screen !== "today" && <button onClick={() => setScreen("home")} style={{
              background: "rgba(46,32,56,0.07)", border: "none", borderRadius: 12, padding: "8px 14px",
              fontSize: 13, fontWeight: 700, color: "#2e2038", cursor: "pointer", fontFamily: "var(--font-body)" }}>← Back</button>}
          </div>
        </div>

        {/* ── HOME ── */}
        {screen === "home" && (
          <div style={{ padding: "6px 20px 110px", animation: "fadeIn 0.3s ease" }}>
            {/* Weather */}
            {weatherLoading
              ? <div style={{ height: 56, borderRadius: 14, marginBottom: 14, background: "linear-gradient(90deg,#f0eaf4,#e8e0ef,#f0eaf4)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
              : weather && <button onClick={() => { setManualTemp(String(weather.temp)); setManualCond(weather.desc); setShowWeather(true); }} style={{
                background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: 14,
                padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%", fontFamily: "var(--font-body)", marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>{weather.emoji}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#3d2c44" }}>{weather.temp}°F</div>
                  <div style={{ fontSize: 10.5, color: "#8a7d96", fontWeight: 500 }}>{weather.desc} · {weather.season}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#b0a4bc", fontWeight: 600 }}>{weather.city || "Set ›"}</span>
              </button>}

            {/* Main CTA */}
            <button onClick={() => { setSelOccasion(profile?.occasions?.[0] || ""); setSelVibes(profile?.vibes?.slice(0, 2) || []); setScreen("today"); }}
              disabled={closet.length < 3 || !weather} style={{
              width: "100%", padding: 16, border: "none", borderRadius: 16,
              background: closet.length < 3 ? "#d8d2de" : "linear-gradient(135deg,#d4636f 0%,#9a7cbf 50%,#5a9bb0 100%)",
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: closet.length < 3 ? "default" : "pointer",
              fontFamily: "var(--font-body)", boxShadow: closet.length >= 3 ? "0 4px 24px rgba(154,124,191,0.35)" : "none", marginBottom: 18 }}>
              {closet.length < 3 ? `Add ${3 - closet.length} more item${3 - closet.length > 1 ? "s" : ""}…` : "✨ What Am I Wearing Today?"}
            </button>

            {/* Filters */}
            <div style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
              {["All", ...CATEGORIES].map(cat => <button key={cat} onClick={() => setFilterCat(cat)} style={{
                background: filterCat === cat ? "#2e2038" : "rgba(255,255,255,0.6)", color: filterCat === cat ? "#fff" : "#6a5c78",
                border: "none", borderRadius: 10, padding: "5px 11px", fontSize: 10.5, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-body)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {cat === "All" ? `All (${closet.length})` : `${CAT_EMOJI[cat]} ${catCounts[cat] || 0}`}
              </button>)}
            </div>

            {/* Batch progress */}
            {batchProgress && (
              <div style={{ background: "linear-gradient(135deg,#e8e0f0,#f0e8f4)", borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22, animation: "pulse 1s infinite" }}>📸</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2e2038", fontFamily: "var(--font-body)" }}>
                    Importing photos… {batchProgress.current} of {batchProgress.total}
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.08)", marginTop: 6 }}>
                    <div style={{ height: 4, borderRadius: 2, background: "linear-gradient(135deg,#d4636f,#9a7cbf)",
                      width: (batchProgress.current / batchProgress.total * 100) + "%", transition: "width 0.3s" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, justifyItems: "center" }}>
              <label style={{ width: 105, height: 128, borderRadius: 14, border: "2px dashed #c4b6d2", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", cursor: "pointer",
                background: analyzing ? "rgba(200,180,220,0.15)" : "rgba(255,255,255,0.35)" }}>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
                {analyzing
                  ? <><span style={{ fontSize: 20, animation: "pulse 1.2s infinite" }}>🔍</span><span style={{ fontSize: 8.5, color: "#9a7cbf", fontWeight: 700, marginTop: 4, textAlign: "center", padding: "0 4px" }}>{aiStatus}</span></>
                  : <><span style={{ fontSize: 24 }}>📸</span><span style={{ fontSize: 9, color: "#a89ab2", fontWeight: 700, marginTop: 4 }}>Take Photo</span></>}
              </label>
              <label style={{ width: 105, height: 128, borderRadius: 14, border: "2px dashed #b6c4d2", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.35)" }}>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
                <span style={{ fontSize: 24 }}>🖼️</span>
                <span style={{ fontSize: 9, color: "#a89ab2", fontWeight: 700, marginTop: 4 }}>From Photos</span>
              </label>
              <label style={{ width: 105, height: 128, borderRadius: 14, border: "2px dashed #b6d2c4", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.35)" }}>
                <input type="file" accept="image/*" multiple onChange={handleBatchImport} style={{ display: "none" }} />
                <span style={{ fontSize: 24 }}>📁</span>
                <span style={{ fontSize: 9, color: "#a89ab2", fontWeight: 700, marginTop: 4, textAlign: "center", lineHeight: 1.3 }}>Batch Import</span>
              </label>
              {filtered.map(item => <ItemCard key={item.id} item={item} onDelete={removeItem} />)}
            </div>
            {closet.length === 0 && <div style={{ textAlign: "center", padding: "20px 16px", color: "#a89ab2" }}>
              <p style={{ fontSize: 36, margin: "0 0 8px" }}>👗</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#6a5c78" }}>Your closet is empty</p>
              <p style={{ fontSize: 12, lineHeight: 1.6 }}>
                📸 <b>Take Photo</b> — snap a pic of one item<br />
                🖼️ <b>From Photos</b> — pick from your camera roll<br />
                📁 <b>Batch Import</b> — select many at once
              </p>
            </div>}
          </div>
        )}

        {/* ── WHAT'S TODAY? ── */}
        {screen === "today" && (
          <div style={{ padding: "10px 20px 110px", animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, color: "#2e2038", textAlign: "center", margin: "0 0 4px" }}>
              Where are you headed? 🗓️
            </h2>
            <p style={{ fontSize: 11.5, color: "#8a7d96", textAlign: "center", marginBottom: 16, fontWeight: 500 }}>Pick one</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              {sortedOccasions.map(o => (
                <button key={o.id} onClick={() => setSelOccasion(selOccasion === o.id ? "" : o.id)} style={{
                  background: selOccasion === o.id ? "#2e2038" : "rgba(255,255,255,0.6)",
                  color: selOccasion === o.id ? "#fff" : "#5a4d6a",
                  border: selOccasion === o.id ? "2px solid #2e2038" : "2px solid rgba(0,0,0,0.04)",
                  borderRadius: 14, padding: "10px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-body)", transition: "all 0.2s", minWidth: "28%", textAlign: "center" }}>
                  <span style={{ fontSize: 16, display: "block", marginBottom: 2 }}>{o.emoji}</span>{o.label}
                </button>
              ))}
            </div>

            <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, color: "#2e2038", textAlign: "center", margin: "0 0 4px" }}>
              What&apos;s the vibe? 💫
            </h2>
            <p style={{ fontSize: 11.5, color: "#8a7d96", textAlign: "center", marginBottom: 16, fontWeight: 500 }}>Pick 1–3</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              {sortedVibes.map(v => {
                const sel = selVibes.includes(v.id);
                return (
                  <button key={v.id} onClick={() => setSelVibes(sel ? selVibes.filter(x => x !== v.id) : selVibes.length < 3 ? [...selVibes, v.id] : selVibes)} style={{
                    background: sel ? "#2e2038" : "rgba(255,255,255,0.6)", color: sel ? "#fff" : "#5a4d6a",
                    border: sel ? "2px solid #2e2038" : "2px solid rgba(0,0,0,0.04)",
                    borderRadius: 14, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font-body)", transition: "all 0.2s" }}>
                    <span style={{ marginRight: 4 }}>{v.emoji}</span>{v.label}
                  </button>
                );
              })}
            </div>

            <button onClick={doGenerate} disabled={!selOccasion || selVibes.length === 0 || generating} style={{
              width: "100%", padding: 16, border: "none", borderRadius: 16,
              background: (!selOccasion || selVibes.length === 0) ? "#d8d2de" : "linear-gradient(135deg,#d4636f 0%,#9a7cbf 50%,#5a9bb0 100%)",
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: (!selOccasion || selVibes.length === 0) ? "default" : "pointer",
              fontFamily: "var(--font-body)", boxShadow: selOccasion ? "0 4px 24px rgba(154,124,191,0.35)" : "none" }}>
              {generating ? "Styling…" : "✨ Style My Outfits"}
            </button>
            <button onClick={() => setScreen("home")} style={{ width: "100%", padding: 12, border: "none", borderRadius: 14,
              background: "transparent", color: "#8a7d96", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 8 }}>
              ← Back to Closet
            </button>
          </div>
        )}

        {/* ── OUTFITS ── */}
        {screen === "outfits" && (
          <div style={{ padding: "6px 20px 110px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {selOccasion && <span style={{ background: "rgba(212,99,111,0.12)", color: "#d4636f", borderRadius: 10, padding: "4px 12px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)" }}>
                {OCCASIONS.find(o => o.id === selOccasion)?.emoji} {OCCASIONS.find(o => o.id === selOccasion)?.label}</span>}
              {selVibes.map(v => <span key={v} style={{ background: "rgba(154,124,191,0.12)", color: "#9a7cbf", borderRadius: 10, padding: "4px 12px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)" }}>
                {VIBES.find(x => x.id === v)?.emoji} {VIBES.find(x => x.id === v)?.label}</span>)}
              {weather && <span style={{ background: "rgba(90,155,176,0.12)", color: "#5a9bb0", borderRadius: 10, padding: "4px 12px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)" }}>
                {weather.emoji} {weather.temp}°F</span>}
            </div>

            {generating
              ? <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <p style={{ fontSize: 42, animation: "pulse 1s infinite" }}>✨</p>
                <p style={{ fontSize: 20, fontFamily: "var(--font-head)", color: "#2e2038" }}>Styling your outfits…</p>
                <p style={{ fontSize: 12, color: "#a89ab2", marginTop: 4 }}>Matching {selOccasion} + {selVibes.join(" & ")} + weather</p>
              </div>
              : outfits.length === 0
                ? <div style={{ textAlign: "center", padding: "40px 20px", color: "#8a7d96" }}>
                  <p style={{ fontSize: 42 }}>🤔</p><p style={{ fontSize: 14, fontWeight: 700 }}>Need more pieces!</p></div>
                : <>
                  {outfits.map((o, i) => <OutfitCard key={i} outfit={o} index={i} isFav={isFav(o)}
                    onToggleFav={toggleFav} onShare={o => shareOutfit(o, weather || {})} onReact={reactOutfit} onRate={rateOutfit} weather={weather} />)}
                  <button onClick={doGenerate} style={{ width: "100%", padding: 14, border: "2px solid #c4b6d2", borderRadius: 14,
                    background: "transparent", color: "#6a5c78", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 6 }}>
                    🔄 Shuffle</button>
                  <button onClick={() => setScreen("today")} style={{ width: "100%", padding: 12, border: "none", borderRadius: 14,
                    background: "transparent", color: "#8a7d96", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 4 }}>
                    ← Change occasion / vibe</button>
                </>}
          </div>
        )}

        {/* ── FAVORITES ── */}
        {screen === "favorites" && (
          <div style={{ padding: "6px 20px 110px", animation: "fadeIn 0.3s ease" }}>
            {resolvedFavs.length === 0
              ? <div style={{ textAlign: "center", padding: "50px 20px", color: "#a89ab2" }}>
                <p style={{ fontSize: 42 }}>🤍</p><p style={{ fontSize: 14, fontWeight: 700, color: "#6a5c78" }}>No saved looks yet</p></div>
              : resolvedFavs.map((f, i) => <OutfitCard key={f.id}
                outfit={{ items: f.items, vibe: f.vibe, note: f.note, reaction: f.reaction, rating: f.rating || 0 }}
                index={i} isFav={true}
                onToggleFav={() => setFavorites(p => p.filter(x => x.id !== f.id))}
                onShare={o => shareOutfit(o, f.weather || weather || {})}
                onReact={() => {}} onRate={() => {}} weather={f.weather || weather} />)}
          </div>
        )}

        {/* ── HISTORY ── */}
        {screen === "history" && (
          <div style={{ padding: "6px 20px 110px", animation: "fadeIn 0.3s ease" }}>
            {history.length === 0
              ? <div style={{ textAlign: "center", padding: "50px 20px", color: "#a89ab2" }}>
                <p style={{ fontSize: 42 }}>📋</p><p style={{ fontSize: 14, fontWeight: 700, color: "#6a5c78" }}>No history yet</p></div>
              : history.slice(0, 30).map(e => {
                const items = e.itemIds.map(id => closet.find(i => i.id === id)).filter((i): i is ClothingItem => Boolean(i));
                if (items.length < 2) return null;
                const d = new Date(e.date);
                return (
                  <div key={e.id} style={{ background: "rgba(255,255,255,0.75)", borderRadius: 16, padding: "12px 14px", marginBottom: 10, border: "1px solid rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#4a3c54" }}>{e.vibe}</span>
                        <span style={{ fontSize: 10, color: "#a89ab2", marginLeft: 6 }}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {e.reaction && <span style={{ fontSize: 14 }}>{e.reaction === "love" ? "💖" : e.reaction === "nope" ? "🙅‍♀️" : "🤷‍♀️"}</span>}
                        {e.rating > 0 && <span style={{ fontSize: 10, color: "#b0a4bc" }}>{"⭐".repeat(e.rating)}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                      {items.map(item => <ItemCard key={item.id + "-h" + e.id} item={item} small />)}
                    </div>
                    {e.weather && <p style={{ fontSize: 10, color: "#b0a4bc", margin: "6px 0 0" }}>
                      {e.weather.emoji} {e.weather.temp}°F · {e.occasion || ""}{e.vibes?.length ? " · " + e.vibes.join(", ") : ""}</p>}
                  </div>
                );
              })}
          </div>
        )}

        {/* ── ADD MODAL ── */}
        {showAdd && <div style={{ position: "fixed", inset: 0, background: "rgba(20,10,30,0.45)", zIndex: 100,
          display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn 0.2s ease" }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAdd(false); setAiStatus(""); } }}>
          <div style={{ background: "linear-gradient(180deg,#fff 0%,#faf5f0 100%)", borderRadius: "22px 22px 0 0",
            padding: "20px 22px 32px", width: "100%", maxWidth: 430, maxHeight: "88vh", overflowY: "auto", animation: "slideUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, color: "#2e2038", margin: 0 }}>Add to Closet</h2>
              <button onClick={() => { setShowAdd(false); setAiStatus(""); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999" }}>×</button>
            </div>
            {aiStatus && <div style={{ background: aiStatus.includes("✅") ? "#e8f5e8" : "#f5f0fa", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 12, fontWeight: 600, color: aiStatus.includes("✅") ? "#3a7a3a" : "#7a6a8f" }}>{aiStatus}</div>}
            {newItem.img && <div style={{ width: 100, height: 130, borderRadius: 14, overflow: "hidden", margin: "0 auto 14px", boxShadow: "0 4px 18px rgba(0,0,0,0.1)" }}>
              <img src={newItem.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name"
                style={{ padding: "12px 14px", borderRadius: 12, border: "2px solid #e4dce8", fontSize: 14, outline: "none", background: "#fff" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                  style={{ flex: 1, padding: "10px", borderRadius: 12, border: "2px solid #e4dce8", fontSize: 13, background: "#fff" }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}</select>
                <select value={newItem.color} onChange={e => setNewItem({ ...newItem, color: e.target.value })}
                  style={{ flex: 1, padding: "10px", borderRadius: 12, border: "2px solid #e4dce8", fontSize: 13, background: "#fff" }}>
                  {COLORS.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: "#8a7d96", marginBottom: 6, letterSpacing: 1 }}>VIBES</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {VIBES.map(v => <button key={v.id} onClick={() => { const has = newItem.vibe_tags.includes(v.id); setNewItem({ ...newItem, vibe_tags: has ? newItem.vibe_tags.filter(x => x !== v.id) : [...newItem.vibe_tags, v.id] }); }} style={{
                    background: newItem.vibe_tags.includes(v.id) ? "#2e2038" : "rgba(46,32,56,0.05)",
                    color: newItem.vibe_tags.includes(v.id) ? "#fff" : "#6a5c78",
                    border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    {v.emoji} {v.label}</button>)}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: "#8a7d96", marginBottom: 6, letterSpacing: 1 }}>OCCASIONS</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {OCCASIONS.map(o => <button key={o.id} onClick={() => { const has = newItem.occasion_tags.includes(o.id); setNewItem({ ...newItem, occasion_tags: has ? newItem.occasion_tags.filter(x => x !== o.id) : [...newItem.occasion_tags, o.id] }); }} style={{
                    background: newItem.occasion_tags.includes(o.id) ? "#2e2038" : "rgba(46,32,56,0.05)",
                    color: newItem.occasion_tags.includes(o.id) ? "#fff" : "#6a5c78",
                    border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    {o.emoji} {o.label}</button>)}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: "#8a7d96", marginBottom: 6, letterSpacing: 1 }}>SEASONS</p>
                <div style={{ display: "flex", gap: 4 }}>
                  {SEASONS.map(s => <button key={s} onClick={() => { const has = newItem.seasons.includes(s); setNewItem({ ...newItem, seasons: has ? newItem.seasons.filter(x => x !== s) : [...newItem.seasons, s] }); }} style={{
                    background: newItem.seasons.includes(s) ? "#2e2038" : "rgba(46,32,56,0.05)",
                    color: newItem.seasons.includes(s) ? "#fff" : "#6a5c78",
                    border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    {s}</button>)}
                </div>
              </div>
              <button onClick={addItem} disabled={!newItem.name.trim()} style={{ padding: 14, border: "none", borderRadius: 14,
                background: newItem.name.trim() ? "linear-gradient(135deg,#d4636f,#9a7cbf)" : "#d8d2de",
                color: "#fff", fontSize: 15, fontWeight: 800, cursor: newItem.name.trim() ? "pointer" : "default", fontFamily: "var(--font-body)" }}>
                Add to Closet</button>
              {!newItem.img && <div style={{ display: "flex", gap: 8 }}>
                <label style={{ flex: 1, padding: 12, border: "2px dashed #c4b6d2", borderRadius: 14, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#8a7d96", display: "block" }}>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />📸 Camera</label>
                <label style={{ flex: 1, padding: 12, border: "2px dashed #b6c4d2", borderRadius: 14, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#8a7d96", display: "block" }}>
                  <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />🖼️ Photo Library</label>
              </div>}
            </div>
          </div>
        </div>}

        {/* ── WEATHER MODAL ── */}
        {showWeather && <div style={{ position: "fixed", inset: 0, background: "rgba(20,10,30,0.45)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }}
          onClick={e => { if (e.target === e.currentTarget) setShowWeather(false); }}>
          <div style={{ background: "#fff", borderRadius: 22, padding: "22px 24px", width: "88%", maxWidth: 360, animation: "slideUp 0.3s ease" }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 22, margin: "0 0 16px", color: "#2e2038" }}>Set Weather</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#8a7d96" }}>TEMPERATURE (°F)</label>
                <input type="number" value={manualTemp} onChange={e => setManualTemp(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #e4dce8", fontSize: 16, fontWeight: 700, marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#8a7d96" }}>CONDITIONS</label>
                <select value={manualCond} onChange={e => setManualCond(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #e4dce8", fontSize: 14, marginTop: 4, background: "#fff" }}>
                  {["Clear sky","Partly cloudy","Overcast","Light rain","Rain","Heavy rain","Light snow","Snow","Foggy","Thunderstorm"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => setShowWeather(false)} style={{ flex: 1, padding: 12, border: "2px solid #e4dce8", borderRadius: 12, background: "transparent", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", color: "#6a5c78" }}>Cancel</button>
                <button onClick={applyManual} style={{ flex: 1, padding: 12, border: "none", borderRadius: 12, background: "linear-gradient(135deg,#d4636f,#9a7cbf)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Set</button>
              </div>
            </div>
          </div>
        </div>}

        {/* ── PROFILE SWITCH MODAL ── */}
        {showProfileSwitch && <div style={{ position: "fixed", inset: 0, background: "rgba(20,10,30,0.45)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }}
          onClick={e => { if (e.target === e.currentTarget) setShowProfileSwitch(false); }}>
          <div style={{ background: "#fff", borderRadius: 22, padding: "22px 24px", width: "88%", maxWidth: 360, animation: "slideUp 0.3s ease" }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 22, margin: "0 0 16px", color: "#2e2038" }}>Switch Profile</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {profiles.map(p => (
                <button key={p.id} onClick={() => switchProfile(p.id)} style={{
                  background: p.id === currentId ? "#2e2038" : "rgba(255,255,255,0.6)",
                  color: p.id === currentId ? "#fff" : "#2e2038",
                  border: "2px solid " + (p.id === currentId ? "#2e2038" : "rgba(0,0,0,0.06)"),
                  borderRadius: 14, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                  fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body)" }}>
                  <span style={{ fontSize: 24 }}>{p.avatar}</span>{p.name}
                </button>
              ))}
              <button onClick={addNewProfile} style={{ background: "transparent", border: "2px dashed #c4b6d2", borderRadius: 14,
                padding: "12px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#8a7d96", fontFamily: "var(--font-body)" }}>
                + New Profile</button>
            </div>
          </div>
        </div>}

        {/* ── BOTTOM NAV ── */}
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.05)",
          display: "flex", justifyContent: "space-around", alignItems: "flex-end", padding: "6px 0 20px", zIndex: 50 }}>
          {([{ key: "home", icon: "👗", label: "Closet" }, { key: "favorites", icon: "❤️", label: "Saved" }] as const).map(t => (
            <button key={t.key} onClick={() => setScreen(t.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1, opacity: screen === t.key ? 1 : .4 }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: "#2e2038", fontFamily: "var(--font-body)" }}>{t.label}</span>
            </button>
          ))}
          <button onClick={() => { if (closet.length >= 3) { setSelOccasion(profile?.occasions?.[0] || ""); setSelVibes(profile?.vibes?.slice(0, 2) || []); setScreen("today"); } }}
            disabled={closet.length < 3} style={{ background: closet.length < 3 ? "#c4b6d2" : "linear-gradient(135deg,#d4636f,#9a7cbf)",
            border: "none", cursor: closet.length < 3 ? "default" : "pointer", borderRadius: "50%", width: 54, height: 54,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: closet.length >= 3 ? "0 4px 20px rgba(154,124,191,0.4)" : "none", marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>✨</span>
          </button>
          {([{ key: "history", icon: "📋", label: "History" }, { key: "add", icon: "➕", label: "Add" }] as const).map(t => (
            <button key={t.key} onClick={() => t.key === "add" ? (() => { resetNew(); setShowAdd(true); })() : setScreen(t.key)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              opacity: screen === t.key ? 1 : t.key === "add" ? .6 : .4 }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: "#2e2038", fontFamily: "var(--font-body)" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}
