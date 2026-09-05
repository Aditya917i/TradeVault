import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import {
  LayoutDashboard, Table2, Calendar as CalendarIcon, BarChart3, Plus, X, Pencil, Trash2, Search, ChevronUp,
  ChevronDown, ArrowUpRight, ArrowDownRight, Sparkles, Settings, Wallet,
  AlertTriangle, ChevronLeft, ChevronRight, Undo2, Info, Eye, Tag, Image as ImageIcon,
  Link2, Users, Lock, ShieldAlert, TrendingUp, TrendingDown, MoreHorizontal,
  Activity, Trophy, CheckCircle2,
} from "lucide-react";

/* ============================== constants ============================== */

const MARKETS = ["Forex", "Crypto", "Stocks", "Futures", "Indices", "Other"];
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "CHF"];
const TRADES_KEY = "tradevault:trades";
const SETTINGS_KEY = "tradevault:settings";
const DEFAULT_SETTINGS = { startingBalance: 10000, currency: "USD" };

// GitHub Pages / normal browser storage adapter
const browserStorage = {
  async get(key) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { value };
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return { value };
    } catch {
      return null;
    }
  },
};


const SUGGESTED_TAGS = ["Breakout", "Reversal", "Trend Follow", "Pullback", "News", "Scalp", "Swing", "Plan A", "FOMO", "Revenge", "Overtrade"];
const EMOTIONS = [
  { key: "Calm", color: "#2FD98A" },
  { key: "Confident", color: "#4FB6FF" },
  { key: "FOMO", color: "#D9A441" },
  { key: "Fear", color: "#8A93A6" },
  { key: "Greedy", color: "#E8B94B" },
  { key: "Revenge", color: "#FF5D6C" },
];

const EMPTY_FORM = {
  symbol: "", market: "Forex", direction: "BUY",
  entryDate: "", entryTime: "", entryPrice: "",
  exitDate: "", exitTime: "", exitPrice: "",
  quantity: "", stopLoss: "", takeProfit: "",
  commission: "0", swap: "0", fees: "0", notes: "",
  tags: [], emotion: "", screenshotUrl: "",
};

function uid() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function unitLabel(market) {
  if (market === "Forex") return "Lots";
  if (market === "Futures") return "Contracts";
  return "Units";
}

function fmtMoney(value, currency) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function sessionForTime(timeStr) {
  if (!timeStr) return "Unspecified";
  const hour = Number(timeStr.slice(0, 2));
  if (Number.isNaN(hour)) return "Unspecified";
  if (hour >= 0 && hour < 7) return "Asian";
  if (hour >= 7 && hour < 12) return "London";
  if (hour >= 12 && hour < 16) return "London/NY Overlap";
  return "New York";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function weekdayLabel(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return WEEKDAYS[d.getDay()];
}

/* ============================== calculations ============================== */

function computeTrade(t, startingBalance) {
  const qty = Number(t.quantity) || 0;
  const entry = Number(t.entryPrice);
  const hasExit = t.exitPrice !== "" && t.exitPrice !== null && t.exitPrice !== undefined;
  const exit = hasExit ? Number(t.exitPrice) : null;
  const isOpen = !hasExit || Number.isNaN(exit);

  let grossPnL = null, netPnL = null, result = "Open", returnPct = null;
  if (!isOpen) {
    grossPnL = t.direction === "BUY" ? (exit - entry) * qty : (entry - exit) * qty;
    const costs = (Number(t.commission) || 0) + (Number(t.swap) || 0) + (Number(t.fees) || 0);
    netPnL = grossPnL - costs;
    result = netPnL > 1e-9 ? "Win" : netPnL < -1e-9 ? "Loss" : "Breakeven";
    returnPct = startingBalance ? (netPnL / startingBalance) * 100 : null;
  }

  const hasSL = t.stopLoss !== "" && t.stopLoss !== null && t.stopLoss !== undefined;
  const hasTP = t.takeProfit !== "" && t.takeProfit !== null && t.takeProfit !== undefined;
  const riskAmount = hasSL ? Math.abs(entry - Number(t.stopLoss)) * qty : null;
  const rewardAmount = hasTP ? Math.abs(Number(t.takeProfit) - entry) * qty : null;
  const rr = riskAmount && rewardAmount ? rewardAmount / riskAmount : null;
  const riskPct = riskAmount !== null && startingBalance ? (riskAmount / startingBalance) * 100 : null;

  return { isOpen, grossPnL, netPnL, result, riskAmount, rewardAmount, rr, riskPct, returnPct };
}

function useJournalMetrics(trades, settings) {
  return useMemo(() => {
    const enriched = trades.map((t) => ({ ...t, m: computeTrade(t, settings.startingBalance) }));
    const closed = enriched.filter((t) => !t.m.isOpen);
    const wins = closed.filter((t) => t.m.result === "Win");
    const losses = closed.filter((t) => t.m.result === "Loss");

    const netPnLTotal = closed.reduce((s, t) => s + t.m.netPnL, 0);
    const currentBalance = settings.startingBalance + netPnLTotal;
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
    const grossWin = wins.reduce((s, t) => s + t.m.netPnL, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.m.netPnL, 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    const avgWin = wins.length ? grossWin / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + t.m.netPnL, 0) / losses.length : 0;
    const expectancy = closed.length ? netPnLTotal / closed.length : 0;

    const sorted = [...closed].sort((a, b) => {
      const da = new Date(`${a.exitDate || a.entryDate}T${a.exitTime || "00:00"}`);
      const db = new Date(`${b.exitDate || b.entryDate}T${b.exitTime || "00:00"}`);
      return da - db;
    });

    let running = settings.startingBalance;
    let peak = settings.startingBalance;
    let maxDD = 0, maxDDPct = 0;
    const curve = [{ date: "Start", equity: Math.round(running * 100) / 100, rawDate: "" }];
    sorted.forEach((t) => {
      running += t.m.netPnL;
      peak = Math.max(peak, running);
      const dd = peak - running;
      if (dd > maxDD) { maxDD = dd; maxDDPct = peak ? (dd / peak) * 100 : 0; }
      curve.push({ date: fmtDate(t.exitDate || t.entryDate), equity: Math.round(running * 100) / 100, rawDate: t.exitDate || t.entryDate });
    });

    // ---- breakdowns for calendar + analytics ----
    const byDay = {};
    closed.forEach((t) => {
      const key = t.exitDate || t.entryDate;
      if (!key) return;
      if (!byDay[key]) byDay[key] = { date: key, netPnL: 0, count: 0, wins: 0, losses: 0 };
      byDay[key].netPnL += t.m.netPnL;
      byDay[key].count += 1;
      if (t.m.result === "Win") byDay[key].wins += 1;
      if (t.m.result === "Loss") byDay[key].losses += 1;
    });

    function groupBy(list, keyFn) {
      const map = {};
      list.forEach((t) => {
        const key = keyFn(t);
        if (key === null || key === undefined) return;
        if (!map[key]) map[key] = { key, trades: 0, wins: 0, losses: 0, netPnL: 0 };
        map[key].trades += 1;
        map[key].netPnL += t.m.netPnL;
        if (t.m.result === "Win") map[key].wins += 1;
        if (t.m.result === "Loss") map[key].losses += 1;
      });
      return Object.values(map).map((r) => ({ ...r, winRate: r.trades ? (r.wins / r.trades) * 100 : 0 }));
    }

    const symbolStats = groupBy(closed, (t) => t.symbol).sort((a, b) => b.netPnL - a.netPnL);
    const sessionStats = groupBy(closed, (t) => sessionForTime(t.entryTime)).sort((a, b) => b.netPnL - a.netPnL);
    const weekdayStats = WEEKDAYS.map((w) => ({ key: w, trades: 0, wins: 0, losses: 0, netPnL: 0, winRate: 0 }));
    closed.forEach((t) => {
      const label = weekdayLabel(t.entryDate);
      if (!label) return;
      const row = weekdayStats.find((r) => r.key === label);
      row.trades += 1; row.netPnL += t.m.netPnL;
      if (t.m.result === "Win") row.wins += 1;
      if (t.m.result === "Loss") row.losses += 1;
    });
    weekdayStats.forEach((r) => { r.winRate = r.trades ? (r.wins / r.trades) * 100 : 0; });

    const tagMap = {};
    closed.forEach((t) => {
      (t.tags || []).forEach((tag) => {
        if (!tagMap[tag]) tagMap[tag] = { key: tag, trades: 0, wins: 0, losses: 0, netPnL: 0 };
        tagMap[tag].trades += 1;
        tagMap[tag].netPnL += t.m.netPnL;
        if (t.m.result === "Win") tagMap[tag].wins += 1;
        if (t.m.result === "Loss") tagMap[tag].losses += 1;
      });
    });
    const tagStats = Object.values(tagMap).map((r) => ({ ...r, winRate: r.trades ? (r.wins / r.trades) * 100 : 0 })).sort((a, b) => b.netPnL - a.netPnL);

    return {
      enriched, closed, wins, losses, netPnLTotal, currentBalance, winRate,
      profitFactor, avgWin, avgLoss, expectancy, maxDD, maxDDPct, curve,
      netReturnPct: settings.startingBalance ? (netPnLTotal / settings.startingBalance) * 100 : 0,
      openCount: enriched.length - closed.length,
      byDay, symbolStats, sessionStats, weekdayStats, tagStats,
    };
  }, [trades, settings]);
}

/* ============================== small UI atoms ============================== */

function ResultBadge({ result }) {
  const map = {
    Win: { bg: "rgba(47,217,138,0.14)", fg: "var(--win)", label: "Win" },
    Loss: { bg: "rgba(255,93,108,0.14)", fg: "var(--loss)", label: "Loss" },
    Breakeven: { bg: "rgba(138,147,166,0.16)", fg: "var(--text-dim)", label: "Breakeven" },
    Open: { bg: "rgba(217,164,65,0.14)", fg: "var(--accent)", label: "Open" },
  };
  const c = map[result] || map.Open;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px",
      borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.fg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.fg }} />
      {c.label}
    </span>
  );
}

function TagChip({ label, active, onClick, tone }) {
  return (
    <button type="button" onClick={onClick} className="tv-btn" style={{
      padding: "5px 10px", fontSize: 12, fontWeight: 600,
      background: active ? (tone || "var(--accent-soft)") : "var(--surface-2)",
      color: active ? (tone ? "#1A1206" : "var(--accent)") : "var(--text-dim)",
      border: `1px solid ${active ? (tone || "var(--accent)") : "var(--border)"}`,
    }}>{label}</button>
  );
}

function EmotionBadge({ emotion }) {
  if (!emotion) return <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>;
  const e = EMOTIONS.find((x) => x.key === emotion);
  const color = e ? e.color : "var(--text-dim)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {emotion}
    </span>
  );
}

function SortHeader({ label, k, width, sortConfig, onSort }) {
  return (
    <th onClick={() => onSort(k)} style={{ width, cursor: "pointer", userSelect: "none" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        {sortConfig.key === k ? (sortConfig.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
      </div>
    </th>
  );
}

function KpiCard({ label, value, sub, tone }) {
  const toneColor = tone === "up" ? "var(--win)" : tone === "down" ? "var(--loss)" : "var(--text)";
  return (
    <div className="tv-card" style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>{label}</div>
      <div className="tv-mono" style={{ fontSize: 22, fontWeight: 700, color: toneColor, lineHeight: 1.1 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone, bar }) {
  const toneColor = tone === "up" ? "var(--win)" : tone === "down" ? "var(--loss)" : "var(--text)";
  const badgeBg = tone === "up" ? "rgba(47,217,138,0.14)" : tone === "down" ? "rgba(255,93,108,0.14)" : "var(--accent-soft)";
  const badgeFg = tone === "up" ? "var(--win)" : tone === "down" ? "var(--loss)" : "var(--accent)";
  return (
    <div className="tv-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: badgeBg, color: badgeFg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{label}</div>
      </div>
      <div className="tv-mono" style={{ fontSize: 21, fontWeight: 700, color: toneColor, lineHeight: 1.1 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>{sub}</div> : null}
      {bar !== undefined ? (
        <div style={{ height: 4, borderRadius: 999, background: "var(--surface-2)", marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, bar))}%`, background: "var(--accent)", borderRadius: 999 }} />
        </div>
      ) : null}
    </div>
  );
}

const PERIODS = [
  { key: "1D", days: 1 }, { key: "1W", days: 7 }, { key: "1M", days: 30 },
  { key: "3M", days: 90 }, { key: "ALL", days: null },
];

function periodCurve(curve, days) {
  if (days === null) return curve;
  const cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  let anchor = curve.length ? curve[0].equity : 0;
  const rest = [];
  curve.forEach((p) => {
    if ((p.rawDate ?? "") < cutoffStr) anchor = p.equity;
    else rest.push(p);
  });
  return [{ date: "Start", equity: anchor, rawDate: cutoffStr }, ...rest];
}

function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel, danger = true }) {
  return (
    <div className="tv-overlay" onMouseDown={onCancel}>
      <div className="tv-card tv-confirm" onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertTriangle size={20} color="var(--loss)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{body}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button className="tv-btn tv-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={danger ? "tv-btn tv-btn-danger" : "tv-btn tv-btn-primary"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== trade form ============================== */

function Field({ label, err, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      {children}
      {err ? <span style={{ color: "var(--loss)", fontSize: 12 }}>{err}</span> : null}
    </label>
  );
}

function TradeForm({ initial, settings, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const preview = useMemo(() => computeTrade(form, settings.startingBalance), [form, settings.startingBalance]);

  function validate() {
    const e = {};
    if (!form.symbol.trim()) e.symbol = "Symbol is required.";
    if (!form.entryDate) e.entryDate = "Entry date is required.";
    if (!form.entryPrice || Number.isNaN(Number(form.entryPrice))) e.entryPrice = "Enter a valid entry price.";
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = "Position size must be positive.";
    const hasExit = form.exitPrice !== "" || form.exitDate !== "";
    if (hasExit) {
      if (!form.exitDate) e.exitDate = "Exit date is required when exit price is set.";
      if (!form.exitPrice || Number.isNaN(Number(form.exitPrice))) e.exitPrice = "Enter a valid exit price.";
      if (form.entryDate && form.exitDate && form.exitDate < form.entryDate) {
        e.exitDate = "Exit date cannot be before entry date.";
      }
    }
    ["commission", "swap", "fees"].forEach((k) => {
      if (form[k] !== "" && Number(form[k]) < 0) e[k] = "Cannot be negative.";
    });
    if (form.stopLoss !== "" && Number.isNaN(Number(form.stopLoss))) e.stopLoss = "Invalid stop loss.";
    if (form.takeProfit !== "" && Number.isNaN(Number(form.takeProfit))) e.takeProfit = "Invalid take profit.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onSave({ ...form, id: form.id || uid(), createdAt: form.createdAt || new Date().toISOString() });
  }

  const inputStyle = (hasErr) => ({
    background: "var(--surface-2)", border: `1px solid ${hasErr ? "var(--loss)" : "var(--border)"}`,
    borderRadius: 8, padding: "9px 10px", color: "var(--text)", fontSize: 14, outline: "none", width: "100%",
  });

  return (
    <div className="tv-overlay" onMouseDown={onCancel}>
      <div className="tv-card tv-form-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{initial ? "Edit Trade" : "Add Trade"}</div>
          <button className="tv-icon-btn" onClick={onCancel}><X size={18} /></button>
        </div>

        <div className="tv-form-body">
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 10 }}>TRADE INFORMATION</div>
          <div className="tv-grid-3">
            <Field label="Symbol" err={errors.symbol}>
              <input style={inputStyle(errors.symbol)} placeholder="XAUUSD" value={form.symbol} onChange={set("symbol")} />
            </Field>
            <Field label="Market">
              <select style={inputStyle(false)} value={form.market} onChange={set("market")}>
                {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Direction">
              <div style={{ display: "flex", gap: 8 }}>
                {["BUY", "SELL"].map((d) => (
                  <button key={d} type="button" onClick={() => setForm((f) => ({ ...f, direction: d }))}
                    className="tv-btn" style={{
                      flex: 1, background: form.direction === d ? (d === "BUY" ? "rgba(47,217,138,0.16)" : "rgba(255,93,108,0.16)") : "var(--surface-2)",
                      color: form.direction === d ? (d === "BUY" ? "var(--win)" : "var(--loss)") : "var(--text-dim)",
                      border: `1px solid ${form.direction === d ? (d === "BUY" ? "var(--win)" : "var(--loss)") : "var(--border)"}`,
                    }}>{d}</button>
                ))}
              </div>
            </Field>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: "20px 0 10px" }}>ENTRY</div>
          <div className="tv-grid-3">
            <Field label="Entry date" err={errors.entryDate}>
              <input type="date" style={inputStyle(errors.entryDate)} value={form.entryDate} onChange={set("entryDate")} />
            </Field>
            <Field label="Entry time">
              <input type="time" style={inputStyle(false)} value={form.entryTime} onChange={set("entryTime")} />
            </Field>
            <Field label="Entry price" err={errors.entryPrice}>
              <input type="number" step="any" style={inputStyle(errors.entryPrice)} value={form.entryPrice} onChange={set("entryPrice")} />
            </Field>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: "20px 0 10px" }}>
            EXIT <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>(leave blank if still open)</span>
          </div>
          <div className="tv-grid-3">
            <Field label="Exit date" err={errors.exitDate}>
              <input type="date" style={inputStyle(errors.exitDate)} value={form.exitDate} onChange={set("exitDate")} />
            </Field>
            <Field label="Exit time">
              <input type="time" style={inputStyle(false)} value={form.exitTime} onChange={set("exitTime")} />
            </Field>
            <Field label="Exit price" err={errors.exitPrice}>
              <input type="number" step="any" style={inputStyle(errors.exitPrice)} value={form.exitPrice} onChange={set("exitPrice")} />
            </Field>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: "20px 0 10px" }}>POSITION &amp; RISK</div>
          <div className="tv-grid-3">
            <Field label={`Position size (${unitLabel(form.market)})`} err={errors.quantity}>
              <input type="number" step="any" style={inputStyle(errors.quantity)} value={form.quantity} onChange={set("quantity")} />
            </Field>
            <Field label="Stop loss" err={errors.stopLoss}>
              <input type="number" step="any" style={inputStyle(errors.stopLoss)} value={form.stopLoss} onChange={set("stopLoss")} />
            </Field>
            <Field label="Take profit" err={errors.takeProfit}>
              <input type="number" step="any" style={inputStyle(errors.takeProfit)} value={form.takeProfit} onChange={set("takeProfit")} />
            </Field>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: "20px 0 10px" }}>FEES</div>
          <div className="tv-grid-3">
            <Field label="Commission" err={errors.commission}>
              <input type="number" step="any" style={inputStyle(errors.commission)} value={form.commission} onChange={set("commission")} />
            </Field>
            <Field label="Swap" err={errors.swap}>
              <input type="number" step="any" style={inputStyle(errors.swap)} value={form.swap} onChange={set("swap")} />
            </Field>
            <Field label="Other fees" err={errors.fees}>
              <input type="number" step="any" style={inputStyle(errors.fees)} value={form.fees} onChange={set("fees")} />
            </Field>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: "20px 0 10px" }}>NOTES</div>
          <textarea style={{ ...inputStyle(false), minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
            placeholder="What was your thinking on this trade?" value={form.notes} onChange={set("notes")} />

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: "20px 0 10px" }}>
            TAGS <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>(setup / strategy / mistake)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTED_TAGS.map((tag) => (
              <TagChip key={tag} label={tag} active={form.tags.includes(tag)}
                onClick={() => setForm((f) => ({
                  ...f, tags: f.tags.includes(tag) ? f.tags.filter((x) => x !== tag) : [...f.tags, tag],
                }))} />
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: "20px 0 10px" }}>HOW DID YOU FEEL?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EMOTIONS.map((e) => (
              <TagChip key={e.key} label={e.key} tone={e.color} active={form.emotion === e.key}
                onClick={() => setForm((f) => ({ ...f, emotion: f.emotion === e.key ? "" : e.key }))} />
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: "20px 0 10px" }}>
            SCREENSHOT <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>(paste an image link, e.g. from TradingView)</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <input style={{ ...inputStyle(false), flex: "1 1 240px" }} placeholder="https://…"
              value={form.screenshotUrl} onChange={set("screenshotUrl")} />
            {form.screenshotUrl ? (
              <img src={form.screenshotUrl} alt="Trade screenshot preview" style={{ width: 120, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
            ) : null}
          </div>

          <div className="tv-card" style={{ marginTop: 20, padding: 16, background: "var(--surface-2)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", marginBottom: 10 }}>LIVE PREVIEW</div>
            <div className="tv-grid-4">
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Gross P&amp;L</div><div className="tv-mono" style={{ fontWeight: 700 }}>{preview.grossPnL === null ? "—" : fmtMoney(preview.grossPnL, settings.currency)}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Net P&amp;L</div><div className="tv-mono" style={{ fontWeight: 700, color: preview.netPnL > 0 ? "var(--win)" : preview.netPnL < 0 ? "var(--loss)" : "var(--text)" }}>{preview.netPnL === null ? "—" : fmtMoney(preview.netPnL, settings.currency)}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Risk</div><div className="tv-mono" style={{ fontWeight: 700 }}>{preview.riskAmount === null ? "—" : fmtMoney(preview.riskAmount, settings.currency)}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>R:R</div><div className="tv-mono" style={{ fontWeight: 700 }}>{preview.rr === null ? "—" : `${preview.rr.toFixed(2)}R`}</div></div>
            </div>
            <div style={{ marginTop: 12 }}><ResultBadge result={preview.result} /></div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="tv-btn tv-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="tv-btn tv-btn-primary" onClick={submit}>Save Trade</button>
        </div>
      </div>
    </div>
  );
}

function TradeDetail({ trade, settings, onClose, onEdit }) {
  const m = trade.m || computeTrade(trade, settings.startingBalance);
  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="tv-mono" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
  return (
    <div className="tv-overlay" onMouseDown={onClose}>
      <div className="tv-card" style={{ width: 480, maxWidth: "94vw", maxHeight: "88vh", display: "flex", flexDirection: "column" }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{trade.symbol}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: trade.direction === "BUY" ? "var(--win)" : "var(--loss)" }}>{trade.direction}</span>
            <ResultBadge result={m.result} />
          </div>
          <button className="tv-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>
          {trade.screenshotUrl ? (
            <img src={trade.screenshotUrl} alt={`${trade.symbol} chart screenshot`}
              style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : null}

          {row("Entry", `${fmtDate(trade.entryDate)}${trade.entryTime ? " " + trade.entryTime : ""} @ ${trade.entryPrice}`)}
          {row("Exit", trade.exitPrice ? `${fmtDate(trade.exitDate)}${trade.exitTime ? " " + trade.exitTime : ""} @ ${trade.exitPrice}` : "Still open")}
          {row("Size", `${trade.quantity} ${unitLabel(trade.market)}`)}
          {row("Net P&L", m.netPnL === null ? "—" : fmtMoney(m.netPnL, settings.currency))}
          {row("R:R", m.rr === null ? "—" : `${m.rr.toFixed(2)}R`)}
          {row("Session", sessionForTime(trade.entryTime))}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>EMOTION</div>
            <EmotionBadge emotion={trade.emotion} />
          </div>

          {trade.tags && trade.tags.length ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>TAGS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {trade.tags.map((t) => (
                  <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent)" }}>{t}</span>
                ))}
              </div>
            </div>
          ) : null}

          {trade.notes ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>NOTES</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{trade.notes}</div>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="tv-btn tv-btn-ghost" onClick={onClose}>Close</button>
          <button className="tv-btn tv-btn-primary" onClick={() => onEdit(trade)}><Pencil size={14} /> Edit</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== main component ============================== */

export default function TradeVault() {
  const [trades, setTrades] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingTrade, setViewingTrade] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const toastTimer = useRef(null);

  const [filters, setFilters] = useState({ search: "", direction: "All", result: "All", market: "All" });
  const [sortConfig, setSortConfig] = useState({ key: "entryDate", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let t = [], s = DEFAULT_SETTINGS;
      try {
        const r = await browserStorage.get(TRADES_KEY, false);
        if (r && r.value) t = JSON.parse(r.value);
      } catch { /* nothing saved yet */ }
      try {
        const r = await browserStorage.get(SETTINGS_KEY, false);
        if (r && r.value) s = { ...DEFAULT_SETTINGS, ...JSON.parse(r.value) };
      } catch { /* use defaults */ }
      if (!cancelled) { setTrades(t); setSettings(s); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistTrades = useCallback(async (next) => {
    setTrades(next);
    try {
      const res = await browserStorage.set(TRADES_KEY, JSON.stringify(next), false);
      setSaveError(res ? null : "Trade could not be saved.");
    } catch { setSaveError("Trade could not be saved."); }
  }, []);

  const persistSettings = useCallback(async (next) => {
    setSettings(next);
    try { await browserStorage.set(SETTINGS_KEY, JSON.stringify(next), false); } catch { /* ignore */ }
  }, []);

  function showToast(message, onUndo) {
    clearTimeout(toastTimer.current);
    setToast({ message, onUndo });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }

  function handleSaveTrade(trade) {
    const exists = trades.some((t) => t.id === trade.id);
    const next = exists ? trades.map((t) => (t.id === trade.id ? trade : t)) : [...trades, trade];
    persistTrades(next);
    setFormOpen(false);
    setEditing(null);
    showToast(exists ? "Trade updated." : "Trade added.", null);
  }

  function handleDeleteConfirmed() {
    const removed = confirmDelete;
    const next = trades.filter((t) => t.id !== removed.id);
    persistTrades(next);
    setConfirmDelete(null);
    showToast("Trade deleted.", () => persistTrades([...next, removed]));
  }

  function handleClearAll() {
    persistTrades([]);
    setConfirmClear(false);
    showToast("All trades cleared.", null);
  }

  const metrics = useJournalMetrics(trades, settings);

  const filteredSorted = useMemo(() => {
    let list = metrics.enriched.slice();
    const q = filters.search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.symbol.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q));
    if (filters.direction !== "All") list = list.filter((t) => t.direction === filters.direction);
    if (filters.market !== "All") list = list.filter((t) => t.market === filters.market);
    if (filters.result !== "All") list = list.filter((t) => t.m.result === filters.result);

    list.sort((a, b) => {
      let av, bv;
      switch (sortConfig.key) {
        case "entryDate": av = `${a.entryDate}T${a.entryTime || "00:00"}`; bv = `${b.entryDate}T${b.entryTime || "00:00"}`; break;
        case "symbol": av = a.symbol; bv = b.symbol; break;
        case "netPnL": av = a.m.netPnL ?? -Infinity; bv = b.m.netPnL ?? -Infinity; break;
        case "rr": av = a.m.rr ?? -Infinity; bv = b.m.rr ?? -Infinity; break;
        default: av = a.entryDate; bv = b.entryDate;
      }
      if (av < bv) return sortConfig.dir === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [metrics.enriched, filters, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const pageItems = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [filters, pageSize]);

  function toggleSort(key) {
    setSortConfig((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }

  if (loading) {
    return (
      <div style={rootVars()} className="tv-root">
        <FontStyle />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 400, color: "var(--text-dim)" }}>
          Loading journal…
        </div>
      </div>
    );
  }

  return (
    <div style={rootVars()} className="tv-root">
      <FontStyle />

      {/* ---------- sidebar (desktop) ---------- */}
      <aside className="tv-sidebar">
        <div style={{ padding: "20px 18px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.2 }}>TradeVault</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Trading Journal · Core</div>
        </div>
        <nav style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          <NavItem icon={<LayoutDashboard size={17} />} label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
          <NavItem icon={<Table2 size={17} />} label="Trades" active={view === "trades"} onClick={() => setView("trades")} />
          <NavItem icon={<CalendarIcon size={17} />} label="Calendar" active={view === "calendar"} onClick={() => setView("calendar")} />
          <NavItem icon={<BarChart3 size={17} />} label="Analytics" active={view === "analytics"} onClick={() => setView("analytics")} />
        </nav>
        <div style={{ marginTop: "auto", padding: 14 }}>
          <div className="tv-card" style={{ padding: 12, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
            <Info size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            MT5 sync, AI reports and community features need a live backend and aren't part of this build.
          </div>
          <button className="tv-btn tv-btn-ghost" style={{ width: "100%", marginTop: 10, justifyContent: "flex-start", gap: 8 }} onClick={() => setSettingsOpen(true)}>
            <Settings size={16} /> Settings
          </button>
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <div className="tv-main">
        <header className="tv-topbar">
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {{ dashboard: "Dashboard", trades: "Trades", calendar: "Calendar", analytics: "Analytics" }[view]}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }} className="tv-hide-mobile">
              {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
            <button className="tv-icon-btn tv-hide-mobile" onClick={() => setSettingsOpen(true)}><Settings size={17} /></button>
            <button className="tv-btn tv-btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus size={16} /> Add Trade
            </button>
          </div>
        </header>

        <main className="tv-content">
          {saveError ? (
            <div className="tv-card" style={{ padding: 12, marginBottom: 16, borderColor: "var(--loss)", color: "var(--loss)", fontSize: 13 }}>
              {saveError}
            </div>
          ) : null}

          {trades.length === 0 ? (
            <EmptyState onAdd={() => { setEditing(null); setFormOpen(true); }} />
          ) : view === "dashboard" ? (
            <Dashboard metrics={metrics} settings={settings} tradeCount={trades.length} />
          ) : view === "calendar" ? (
            <CalendarView metrics={metrics} settings={settings} onView={(t) => setViewingTrade(t)} />
          ) : view === "analytics" ? (
            <AnalyticsView metrics={metrics} settings={settings} />
          ) : (
            <TradesView
              filters={filters} setFilters={setFilters}
              pageItems={pageItems} sortConfig={sortConfig} onSort={toggleSort} settings={settings}
              onEdit={(t) => { setEditing(t); setFormOpen(true); }}
              onDelete={(t) => setConfirmDelete(t)}
              onView={(t) => setViewingTrade(t)}
              page={page} setPage={setPage} totalPages={totalPages}
              pageSize={pageSize} setPageSize={setPageSize}
              total={filteredSorted.length}
            />
          )}
        </main>
      </div>

      {/* ---------- mobile bottom nav ---------- */}
      <nav className="tv-bottomnav">
        <button className={`tv-bottomnav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
          <LayoutDashboard size={18} /><span>Home</span>
        </button>
        <button className={`tv-bottomnav-btn ${view === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>
          <CalendarIcon size={18} /><span>Calendar</span>
        </button>
        <button className="tv-bottomnav-fab" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={22} /></button>
        <button className={`tv-bottomnav-btn ${view === "trades" ? "active" : ""}`} onClick={() => setView("trades")}>
          <Table2 size={18} /><span>Trades</span>
        </button>
        <button className={`tv-bottomnav-btn ${view === "analytics" ? "active" : ""}`} onClick={() => setView("analytics")}>
          <BarChart3 size={18} /><span>Stats</span>
        </button>
      </nav>

      {/* ---------- overlays ---------- */}
      {formOpen ? (
        <TradeForm
          initial={editing}
          settings={settings}
          onSave={handleSaveTrade}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
        />
      ) : null}

      {viewingTrade ? (
        <TradeDetail
          trade={metrics.enriched.find((t) => t.id === viewingTrade.id) || viewingTrade}
          settings={settings}
          onClose={() => setViewingTrade(null)}
          onEdit={(t) => { setViewingTrade(null); setEditing(t); setFormOpen(true); }}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete this trade?"
          body={`This permanently removes ${confirmDelete.symbol} from your journal. You can undo for a few seconds after.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(null)}
        />
      ) : null}

      {confirmClear ? (
        <ConfirmDialog
          title="Clear all trades?"
          body="This permanently deletes every trade in your journal. This cannot be undone."
          confirmLabel="Clear All"
          onConfirm={handleClearAll}
          onCancel={() => setConfirmClear(false)}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsModal
          settings={settings}
          onSave={(s) => { persistSettings(s); setSettingsOpen(false); }}
          onCancel={() => setSettingsOpen(false)}
          onClearAll={() => { setSettingsOpen(false); setConfirmClear(true); }}
        />
      ) : null}

      {toast ? (
        <div className="tv-toast">
          <span>{toast.message}</span>
          {toast.onUndo ? (
            <button className="tv-btn tv-btn-ghost" style={{ padding: "4px 10px" }} onClick={() => { toast.onUndo(); setToast(null); }}>
              <Undo2 size={14} /> Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ============================== sub-views ============================== */

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="tv-nav-item" style={{
      background: active ? "var(--accent-soft)" : "transparent",
      color: active ? "var(--accent)" : "var(--text-dim)",
    }}>
      {icon}<span>{label}</span>
    </button>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="tv-card" style={{ padding: "56px 24px", textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
      <Wallet size={32} color="var(--accent)" style={{ marginBottom: 14 }} />
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>No trades yet</div>
      <div style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 22 }}>
        Add your first trade to start tracking P&amp;L, win rate and equity.
      </div>
      <button className="tv-btn tv-btn-primary" onClick={onAdd}><Plus size={16} /> Add Your First Trade</button>
    </div>
  );
}

function Dashboard({ metrics, settings, tradeCount }) {
  const [period, setPeriod] = useState("1M");
  const days = PERIODS.find((p) => p.key === period).days;
  const curve = useMemo(() => periodCurve(metrics.curve, days), [metrics.curve, days]);

  const startEquity = curve[0]?.equity ?? settings.startingBalance;
  const endEquity = curve[curve.length - 1]?.equity ?? startEquity;
  const periodPnL = endEquity - startEquity;
  const periodPct = startEquity ? (periodPnL / startEquity) * 100 : 0;
  const up = periodPnL >= 0;
  const lineColor = up ? "#2FD98A" : "#FF5D6C";

  return (
    <div>
      <div className="tv-kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Wallet size={16} />} label="Total P&L" tone={metrics.netPnLTotal >= 0 ? "up" : "down"}
          value={fmtMoney(metrics.netPnLTotal, settings.currency)} sub={`${metrics.closed.length} closed trades`} />
        <StatCard icon={<Activity size={16} />} label="Open Positions" tone="neutral"
          value={String(metrics.openCount)} sub={metrics.openCount ? "Unrealized P&L needs live pricing" : "No open trades"} />
        <StatCard icon={<CheckCircle2 size={16} />} label="Realized" tone={metrics.netPnLTotal >= 0 ? "up" : "down"}
          value={fmtMoney(metrics.netPnLTotal, settings.currency)} sub={`${metrics.closed.length} closed trades`} />
        <StatCard icon={<Trophy size={16} />} label="Win Rate" tone="neutral"
          value={`${metrics.winRate.toFixed(1)}%`} sub={`${metrics.wins.length}W / ${metrics.losses.length}L`} bar={metrics.winRate} />
      </div>

      <div className="tv-card" style={{ padding: 22, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>PERFORMANCE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span className="tv-mono" style={{ fontSize: 30, fontWeight: 800 }}>{fmtMoney(endEquity, settings.currency)}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, background: up ? "rgba(47,217,138,0.14)" : "rgba(255,93,108,0.14)", color: up ? "var(--win)" : "var(--loss)", fontSize: 13, fontWeight: 700 }}>
                {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {periodPct >= 0 ? "+" : ""}{periodPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", padding: 3, borderRadius: 9, border: "1px solid var(--border)" }}>
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)} className="tv-btn"
                style={{
                  padding: "5px 11px", fontSize: 12,
                  background: period === p.key ? "var(--accent)" : "transparent",
                  color: period === p.key ? "#1A1206" : "var(--text-dim)",
                  border: "none",
                }}>{p.key}</button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
          Starting balance {fmtMoney(settings.startingBalance, settings.currency)} · {tradeCount} trade{tradeCount === 1 ? "" : "s"} logged
          {metrics.openCount ? ` · ${metrics.openCount} open` : ""}
        </div>

        <div style={{ height: 220, marginTop: 20 }}>
          {curve.length <= 1 ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 13 }}>
              Close more trades to see your equity curve
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#20293580" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#8A93A6", fontSize: 11 }} axisLine={{ stroke: "#232A36" }} tickLine={false} minTickGap={30} />
                <YAxis tick={{ fill: "#8A93A6", fontSize: 11 }} axisLine={false} tickLine={false} width={64}
                  tickFormatter={(v) => fmtMoney(v, settings.currency)} />
                <Tooltip
                  contentStyle={{ background: "#121822", border: "1px solid #262F3D", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#8A93A6" }}
                  formatter={(v) => [fmtMoney(v, settings.currency), "Equity"]}
                />
                <Area type="monotone" dataKey="equity" stroke={lineColor} strokeWidth={2} fill="url(#eqFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dim)", margin: "0 0 10px" }}>PERFORMANCE BREAKDOWN</div>
      <div className="tv-kpi-grid">
        <KpiCard label="Net P&L" value={fmtMoney(metrics.netPnLTotal, settings.currency)} tone={metrics.netPnLTotal >= 0 ? "up" : "down"} />
        <KpiCard label="Profit Factor" value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)} />
        <KpiCard label="Expectancy" value={fmtMoney(metrics.expectancy, settings.currency)} tone={metrics.expectancy >= 0 ? "up" : "down"} />
        <KpiCard label="Avg Win" value={fmtMoney(metrics.avgWin, settings.currency)} tone="up" />
        <KpiCard label="Avg Loss" value={fmtMoney(metrics.avgLoss, settings.currency)} tone="down" />
        <KpiCard label="Max Drawdown" value={fmtMoney(metrics.maxDD, settings.currency)} sub={`${metrics.maxDDPct.toFixed(1)}% from peak`} tone="down" />
        <KpiCard label="Total Trades" value={String(metrics.closed.length + metrics.openCount)} sub={metrics.openCount ? `${metrics.openCount} open` : "all closed"} />
        <KpiCard label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} sub={`${metrics.wins.length}W / ${metrics.losses.length}L`} />
      </div>
    </div>
  );
}

function TradesView({ filters, setFilters, pageItems, sortConfig, onSort, settings, onEdit, onDelete, onView, page, setPage, totalPages, pageSize, setPageSize, total }) {
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div>
      <div className="tv-card" style={{ padding: 14, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "var(--text-dim)" }} />
          <input placeholder="Search symbol or notes…" value={filters.search} onChange={set("search")}
            style={{ width: "100%", padding: "8px 10px 8px 32px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13 }} />
        </div>
        <select value={filters.direction} onChange={set("direction")} className="tv-select">
          <option>All</option><option>BUY</option><option>SELL</option>
        </select>
        <select value={filters.market} onChange={set("market")} className="tv-select">
          <option>All</option>{MARKETS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={filters.result} onChange={set("result")} className="tv-select">
          <option>All</option><option>Win</option><option>Loss</option><option>Breakeven</option><option>Open</option>
        </select>
      </div>

      {total === 0 ? (
        <div className="tv-card" style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>No trades match these filters.</div>
      ) : (
        <>
          <div className="tv-card tv-table-wrap">
            <table className="tv-table">
              <thead>
                <tr>
                  <SortHeader label="Date" k="entryDate" width={100} sortConfig={sortConfig} onSort={onSort} />
                  <SortHeader label="Symbol" k="symbol" width={90} sortConfig={sortConfig} onSort={onSort} />
                  <th style={{ width: 60 }}>Dir</th>
                  <th style={{ width: 90 }}>Entry</th>
                  <th style={{ width: 90 }}>Exit</th>
                  <th style={{ width: 70 }}>Size</th>
                  <SortHeader label="Net P&L" k="netPnL" width={110} sortConfig={sortConfig} onSort={onSort} />
                  <SortHeader label="R:R" k="rr" width={70} sortConfig={sortConfig} onSort={onSort} />
                  <th style={{ width: 100 }}>Result</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t) => (
                  <tr key={t.id}>
                    <td>{fmtDate(t.entryDate)}</td>
                    <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                    <td style={{ color: t.direction === "BUY" ? "var(--win)" : "var(--loss)" }}>{t.direction}</td>
                    <td className="tv-mono">{t.entryPrice}</td>
                    <td className="tv-mono">{t.exitPrice || "—"}</td>
                    <td className="tv-mono">{t.quantity}</td>
                    <td className="tv-mono" style={{ fontWeight: 700, color: t.m.netPnL > 0 ? "var(--win)" : t.m.netPnL < 0 ? "var(--loss)" : "var(--text)" }}>
                      {t.m.netPnL === null ? "—" : fmtMoney(t.m.netPnL, settings.currency)}
                    </td>
                    <td className="tv-mono">{t.m.rr === null ? "—" : `${t.m.rr.toFixed(2)}R`}</td>
                    <td><ResultBadge result={t.m.result} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="tv-icon-btn" onClick={() => onView(t)}><Eye size={14} /></button>
                        <button className="tv-icon-btn" onClick={() => onEdit(t)}><Pencil size={14} /></button>
                        <button className="tv-icon-btn" onClick={() => onDelete(t)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tv-cards-wrap">
            {pageItems.map((t) => (
              <div key={t.id} className="tv-card" style={{ padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.symbol} <span style={{ fontWeight: 400, color: t.direction === "BUY" ? "var(--win)" : "var(--loss)", fontSize: 12 }}>{t.direction}</span></div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{fmtDate(t.entryDate)}</div>
                  </div>
                  <ResultBadge result={t.m.result} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13 }}>
                  <span className="tv-mono">{t.entryPrice} → {t.exitPrice || "—"}</span>
                  <span className="tv-mono" style={{ fontWeight: 700, color: t.m.netPnL > 0 ? "var(--win)" : t.m.netPnL < 0 ? "var(--loss)" : "var(--text)" }}>
                    {t.m.netPnL === null ? "—" : fmtMoney(t.m.netPnL, settings.currency)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="tv-btn tv-btn-ghost" style={{ flex: 1 }} onClick={() => onView(t)}><Eye size={14} /> View</button>
                  <button className="tv-btn tv-btn-ghost" style={{ flex: 1 }} onClick={() => onEdit(t)}><Pencil size={14} /></button>
                  <button className="tv-btn tv-btn-ghost" style={{ flex: 1 }} onClick={() => onDelete(t)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{total} trade{total === 1 ? "" : "s"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="tv-select">
                <option value={10}>10 / page</option><option value={25}>25 / page</option><option value={50}>50 / page</option>
              </select>
              <button className="tv-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 13 }}>{page} / {totalPages}</span>
              <button className="tv-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CalendarView({ metrics, settings, onView }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState(null);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateKey(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  let monthPnL = 0, greenDays = 0, redDays = 0;
  Object.values(metrics.byDay).forEach((day) => {
    const dd = new Date(`${day.date}T00:00:00`);
    if (dd.getFullYear() === year && dd.getMonth() === month) {
      monthPnL += day.netPnL;
      if (day.netPnL > 0) greenDays++; else if (day.netPnL < 0) redDays++;
    }
  });

  const maxAbs = Math.max(1, ...Object.values(metrics.byDay).map((d) => Math.abs(d.netPnL)));
  const selectedTrades = selectedDay
    ? metrics.enriched.filter((t) => (t.exitDate || t.entryDate) === selectedDay && !t.m.isOpen)
    : [];

  return (
    <div>
      <div className="tv-card" style={{ padding: 16, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="tv-icon-btn" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
          <div style={{ fontWeight: 700, fontSize: 15, minWidth: 150, textAlign: "center" }}>{monthLabel}</div>
          <button className="tv-icon-btn" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={16} /></button>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 13 }}>
          <span>Month P&amp;L: <strong className="tv-mono" style={{ color: monthPnL > 0 ? "var(--win)" : monthPnL < 0 ? "var(--loss)" : "var(--text)" }}>{fmtMoney(monthPnL, settings.currency)}</strong></span>
          <span style={{ color: "var(--text-dim)" }}>{greenDays} green · {redDays} red</span>
        </div>
      </div>

      <div className="tv-card" style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: "center", fontSize: 11, color: "var(--text-dim)", fontWeight: 600, padding: "4px 0" }}>{w}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const key = dateKey(d);
            const day = metrics.byDay[key];
            const isToday = key === new Date().toISOString().slice(0, 10);
            let bg = "var(--surface-2)", fg = "var(--text-dim)";
            if (day) {
              const intensity = Math.min(1, Math.abs(day.netPnL) / maxAbs);
              if (day.netPnL > 0) { bg = `rgba(47,217,138,${0.12 + intensity * 0.35})`; fg = "var(--win)"; }
              else if (day.netPnL < 0) { bg = `rgba(255,93,108,${0.12 + intensity * 0.35})`; fg = "var(--loss)"; }
            }
            return (
              <button key={key} onClick={() => day && setSelectedDay(key)}
                style={{
                  aspectRatio: "1", borderRadius: 8, background: bg, border: isToday ? "1px solid var(--accent)" : "1px solid var(--border)",
                  cursor: day ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 4, gap: 2,
                }}>
                <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{d}</span>
                {day ? (
                  <>
                    <span className="tv-mono" style={{ fontSize: 11, fontWeight: 700, color: fg }}>{day.netPnL >= 0 ? "+" : ""}{Math.round(day.netPnL)}</span>
                    <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{day.count} trade{day.count === 1 ? "" : "s"}</span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay ? (
        <div className="tv-overlay" onMouseDown={() => setSelectedDay(null)}>
          <div className="tv-card" style={{ width: 420, maxWidth: "94vw", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700 }}>{fmtDate(selectedDay)}</div>
              <button className="tv-icon-btn" onClick={() => setSelectedDay(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: 12, overflowY: "auto" }}>
              {selectedTrades.map((t) => (
                <button key={t.id} onClick={() => { onView(t); setSelectedDay(null); }} className="tv-card"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: 12, marginBottom: 8, cursor: "pointer", textAlign: "left" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{t.symbol} <span style={{ fontWeight: 400, fontSize: 12, color: t.direction === "BUY" ? "var(--win)" : "var(--loss)" }}>{t.direction}</span></div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{sessionForTime(t.entryTime)}</div>
                  </div>
                  <span className="tv-mono" style={{ fontWeight: 700, color: t.m.netPnL > 0 ? "var(--win)" : t.m.netPnL < 0 ? "var(--loss)" : "var(--text)" }}>
                    {fmtMoney(t.m.netPnL, settings.currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BreakdownTable({ title, rows, settings, labelHeader }) {
  if (!rows.length) {
    return (
      <div className="tv-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No closed trades in this group yet.</div>
      </div>
    );
  }
  return (
    <div className="tv-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>{title}</div>
      <div className="tv-table-wrap">
        <table className="tv-table" style={{ minWidth: 0 }}>
          <thead><tr><th>{labelHeader}</th><th>Trades</th><th>Win %</th><th>Net P&amp;L</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td style={{ fontWeight: 600 }}>{r.key}</td>
                <td className="tv-mono">{r.trades}</td>
                <td className="tv-mono">{r.winRate.toFixed(0)}%</td>
                <td className="tv-mono" style={{ fontWeight: 700, color: r.netPnL > 0 ? "var(--win)" : r.netPnL < 0 ? "var(--loss)" : "var(--text)" }}>
                  {fmtMoney(r.netPnL, settings.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeekdayChart({ weekdayStats, settings }) {
  return (
    <div className="tv-card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 14 }}>Net P&amp;L by Weekday</div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekdayStats} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#20293580" vertical={false} />
            <XAxis dataKey="key" tick={{ fill: "#8A93A6", fontSize: 11 }} axisLine={{ stroke: "#232A36" }} tickLine={false} />
            <YAxis tick={{ fill: "#8A93A6", fontSize: 11 }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => fmtMoney(v, settings.currency)} />
            <Tooltip contentStyle={{ background: "#121822", border: "1px solid #262F3D", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8A93A6" }}
              formatter={(v) => [fmtMoney(v, settings.currency), "Net P&L"]} />
            <Bar dataKey="netPnL" radius={[4, 4, 0, 0]}>
              {weekdayStats.map((r, i) => <Cell key={i} fill={r.netPnL >= 0 ? "#2FD98A" : "#FF5D6C"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AnalyticsView({ metrics, settings }) {
  const best = (rows) => rows.length ? rows.reduce((a, b) => (b.netPnL > a.netPnL ? b : a)) : null;
  const bestSymbol = best(metrics.symbolStats);
  const bestSession = best(metrics.sessionStats);
  const bestTag = best(metrics.tagStats);

  if (!metrics.closed.length) {
    return <div className="tv-card" style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>Close a few trades to see analytics broken down by symbol, session and tag.</div>;
  }

  return (
    <div>
      <div className="tv-kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard label="Best Symbol" value={bestSymbol ? bestSymbol.key : "—"} sub={bestSymbol ? fmtMoney(bestSymbol.netPnL, settings.currency) : null} tone="up" />
        <KpiCard label="Best Session" value={bestSession ? bestSession.key : "—"} sub={bestSession ? fmtMoney(bestSession.netPnL, settings.currency) : null} tone="up" />
        <KpiCard label="Best Tag" value={bestTag ? bestTag.key : "—"} sub={bestTag ? fmtMoney(bestTag.netPnL, settings.currency) : "No tags logged yet"} tone={bestTag ? "up" : undefined} />
        <KpiCard label="Total Closed" value={String(metrics.closed.length)} sub={`${metrics.winRate.toFixed(0)}% win rate`} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <WeekdayChart weekdayStats={metrics.weekdayStats} settings={settings} />
      </div>

      <div className="tv-grid-3" style={{ alignItems: "start" }}>
        <BreakdownTable title="By Symbol" rows={metrics.symbolStats} settings={settings} labelHeader="Symbol" />
        <BreakdownTable title="By Session" rows={metrics.sessionStats} settings={settings} labelHeader="Session" />
        <BreakdownTable title="By Tag" rows={metrics.tagStats} settings={settings} labelHeader="Tag" />
      </div>
    </div>
  );
}

function SettingsModal({ settings, onSave, onCancel, onClearAll }) {
  const [form, setForm] = useState(settings);
  return (
    <div className="tv-overlay" onMouseDown={onCancel}>
      <div className="tv-card" style={{ width: 380, maxWidth: "92vw" }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700 }}>Settings</div>
          <button className="tv-icon-btn" onClick={onCancel}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--text-dim)" }}>Starting balance</span>
            <input type="number" step="any" value={form.startingBalance}
              onChange={(e) => setForm((f) => ({ ...f, startingBalance: Number(e.target.value) }))}
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 10px", color: "var(--text)" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--text-dim)" }}>Currency</span>
            <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 10px", color: "var(--text)" }}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: "var(--loss)", fontWeight: 700, marginBottom: 8 }}>DANGER ZONE</div>
            <button className="tv-btn tv-btn-danger" style={{ width: "100%" }} onClick={onClearAll}>
              <Trash2 size={14} /> Clear all trades
            </button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="tv-btn tv-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="tv-btn tv-btn-primary" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== theming ============================== */

function rootVars() {
  return {
    "--bg": "#0A0E14", "--surface": "#121822", "--surface-2": "#1A2230",
    "--border": "#232A36", "--text": "#E7EBF2", "--text-dim": "#8A93A6",
    "--accent": "#D9A441", "--accent-soft": "rgba(217,164,65,0.14)",
    "--win": "#2FD98A", "--loss": "#FF5D6C",
    background: "var(--bg)", color: "var(--text)",
    fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
    minHeight: "100vh", display: "flex", position: "relative",
  };
}

function FontStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      .tv-root * { box-sizing: border-box; }
      .tv-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
      .tv-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
      .tv-sidebar { width: 224px; flex-shrink: 0; display: flex; flex-direction: column; border-right: 1px solid var(--border); height: 100vh; position: sticky; top: 0; }
      .tv-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .tv-topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); z-index: 5; }
      .tv-content { padding: 22px 24px 90px; }
      .tv-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; }
      .tv-btn { display: inline-flex; align-items: center; gap: 6px; justify-content: center; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; white-space: nowrap; }
      .tv-btn-primary { background: var(--accent); color: #1A1206; }
      .tv-btn-primary:hover { filter: brightness(1.08); }
      .tv-btn-ghost { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
      .tv-btn-ghost:hover { border-color: var(--accent); }
      .tv-btn-danger { background: rgba(255,93,108,0.14); color: var(--loss); border: 1px solid rgba(255,93,108,0.4); }
      .tv-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text-dim); cursor: pointer; }
      .tv-icon-btn:hover { color: var(--text); }
      .tv-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .tv-select { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; color: var(--text); font-size: 13px; }
      .tv-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
      .tv-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
      .tv-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      .tv-form-body { padding: 20px; overflow-y: auto; }
      .tv-overlay { position: fixed; inset: 0; background: rgba(4,6,10,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
      .tv-form-panel { width: 640px; max-width: 100%; max-height: 88vh; display: flex; flex-direction: column; }
      .tv-confirm { width: 380px; max-width: 100%; padding: 20px; }
      .tv-table-wrap { overflow-x: auto; }
      .tv-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 820px; }
      .tv-table th { text-align: left; padding: 10px 14px; font-size: 11px; color: var(--text-dim); border-bottom: 1px solid var(--border); font-weight: 600; }
      .tv-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); }
      .tv-table tr:last-child td { border-bottom: none; }
      .tv-table tr:hover td { background: rgba(255,255,255,0.02); }
      .tv-cards-wrap { display: none; }
      .tv-bottomnav { display: none; }
      .tv-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 10px 16px; display: flex; align-items: center; gap: 14px; font-size: 13px; z-index: 60; box-shadow: 0 8px 24px rgba(0,0,0,0.35); }

      @media (max-width: 860px) {
        .tv-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        .tv-grid-3, .tv-grid-4 { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 768px) {
        .tv-sidebar { display: none; }
        .tv-bottomnav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 62px; background: var(--surface); border-top: 1px solid var(--border); align-items: center; justify-content: space-around; z-index: 40; }
        .tv-bottomnav-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; color: var(--text-dim); background: none; border: none; }
        .tv-bottomnav-btn.active { color: var(--accent); }
        .tv-bottomnav-fab { width: 48px; height: 48px; border-radius: 999px; background: var(--accent); color: #1A1206; display: flex; align-items: center; justify-content: center; border: none; margin-top: -24px; box-shadow: 0 6px 16px rgba(217,164,65,0.4); }
        .tv-hide-mobile { display: none; }
        .tv-table-wrap { display: none; }
        .tv-cards-wrap { display: block; }
        .tv-content { padding: 16px 14px 90px; }
        .tv-topbar { padding: 14px 16px; }
      }
    `}</style>
  );
}