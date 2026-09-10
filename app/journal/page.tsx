"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Pencil,
  BookOpen,
  Trophy,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import AddTradeModal, { Trade } from "../AddTradeModal";

const TRADE_STORAGE = "tradevault-trades";

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState("ALL");

  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // LOAD TRADES
  useEffect(() => {
    try {
      const savedTrades = localStorage.getItem(TRADE_STORAGE);

      if (savedTrades) {
        const parsedTrades = JSON.parse(savedTrades);

        if (Array.isArray(parsedTrades)) {
          setTrades(parsedTrades);
        }
      }
    } catch (error) {
      console.error("Error loading trades:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // SAVE TRADES
  // IMPORTANT: Don't save until the initial data has loaded.
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        TRADE_STORAGE,
        JSON.stringify(trades)
      );
    } catch (error) {
      console.error("Error saving trades:", error);
    }
  }, [trades, loaded]);

  // EDIT TRADE
  const handleSaveTrade = (updatedTrade: Trade) => {
    setTrades((currentTrades) =>
      currentTrades.map((trade) =>
        trade.id === updatedTrade.id
          ? updatedTrade
          : trade
      )
    );

    setEditingTrade(null);
  };

  // FILTER TRADES
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        trade.symbol?.toLowerCase().includes(searchText) ||
        trade.strategy?.toLowerCase().includes(searchText) ||
        trade.setupType?.toLowerCase().includes(searchText) ||
        trade.notes?.toLowerCase().includes(searchText) ||
        trade.psychology?.toLowerCase().includes(searchText) ||
        trade.mistake?.toLowerCase().includes(searchText) ||
        trade.lesson?.toLowerCase().includes(searchText);

      const matchesResult =
        resultFilter === "ALL" ||
        trade.result === resultFilter;

      const matchesDirection =
        directionFilter === "ALL" ||
        trade.type === directionFilter;

      const matchesSession =
        sessionFilter === "ALL" ||
        trade.session === sessionFilter;

      return (
        matchesSearch &&
        matchesResult &&
        matchesDirection &&
        matchesSession
      );
    });
  }, [
    trades,
    search,
    resultFilter,
    directionFilter,
    sessionFilter,
  ]);

  // STATS
  const totalTrades = trades.length;

  const winningTrades = trades.filter(
    (trade) => trade.result === "WIN"
  ).length;

  const losingTrades = trades.filter(
    (trade) => trade.result === "LOSS"
  ).length;

  const netPnL = trades.reduce(
    (total, trade) =>
      total + Number(trade.pnl || 0),
    0
  );

  const formatPnL = (value: number) => {
    if (value >= 0) {
      return `+$${value.toFixed(2)}`;
    }

    return `-$${Math.abs(value).toFixed(2)}`;
  };

  const getResultStyle = (result: string) => {
    if (result === "WIN") {
      return "text-green-400 bg-green-500/10 border-green-500/20";
    }

    if (result === "LOSS") {
      return "text-red-400 bg-red-500/10 border-red-500/20";
    }

    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  };

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white p-4 md:p-6">

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Trading Journal
            </h1>

            <p className="text-gray-400 text-sm">
              Review the mindset, mistakes and lessons behind every trade.
            </p>
          </div>

        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* TOTAL */}
        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">
              Total Trades
            </span>

            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>

          <div className="text-2xl font-bold">
            {totalTrades}
          </div>
        </div>

        {/* WINS */}
        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">
              Winning Trades
            </span>

            <Trophy className="w-5 h-5 text-green-400" />
          </div>

          <div className="text-2xl font-bold text-green-400">
            {winningTrades}
          </div>
        </div>

        {/* LOSSES */}
        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">
              Losing Trades
            </span>

            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>

          <div className="text-2xl font-bold text-red-400">
            {losingTrades}
          </div>
        </div>

        {/* PNL */}
        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">
              Net P&L
            </span>

            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>

          <div
            className={`text-2xl font-bold ${
              netPnL >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {formatPnL(netPnL)}
          </div>
        </div>

      </div>

      {/* SEARCH & FILTERS */}
      <div className="rounded-2xl border border-white/10 bg-[#11161d] p-4 mb-6">

        <div className="flex flex-col lg:flex-row gap-3">

          {/* SEARCH */}
          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

            <input
              type="text"
              placeholder="Search journal..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full bg-[#0b0f14] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500/50"
            />

          </div>

          {/* RESULT */}
          <select
            value={resultFilter}
            onChange={(e) =>
              setResultFilter(e.target.value)
            }
            className="bg-[#0b0f14] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none"
          >
            <option value="ALL">
              All Results
            </option>

            <option value="WIN">
              Wins
            </option>

            <option value="LOSS">
              Losses
            </option>

            <option value="BREAKEVEN">
              Breakeven
            </option>
          </select>

          {/* DIRECTION */}
          <select
            value={directionFilter}
            onChange={(e) =>
              setDirectionFilter(e.target.value)
            }
            className="bg-[#0b0f14] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none"
          >
            <option value="ALL">
              All Directions
            </option>

            <option value="LONG">
              Long
            </option>

            <option value="SHORT">
              Short
            </option>
          </select>

          {/* SESSION */}
          <select
            value={sessionFilter}
            onChange={(e) =>
              setSessionFilter(e.target.value)
            }
            className="bg-[#0b0f14] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none"
          >
            <option value="ALL">
              All Sessions
            </option>

            {Array.from(
              new Set(
                trades
                  .map((trade) => trade.session)
                  .filter(Boolean)
              )
            ).map((session) => (
              <option
                key={session}
                value={session}
              >
                {session}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* LOADING */}
      {!loaded ? (
        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-10 text-center">
          <p className="text-gray-400">
            Loading journal...
          </p>
        </div>
      ) : filteredTrades.length === 0 ? (

        /* EMPTY STATE */
        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-10 text-center">

          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />

          <h2 className="text-lg font-semibold mb-2">
            No journal entries found
          </h2>

          <p className="text-gray-500 text-sm">
            Add a trade from the Trades page and your journal will appear here automatically.
          </p>

        </div>

      ) : (

        /* JOURNAL ENTRIES */
        <div className="space-y-5">

          {filteredTrades.map((trade) => (

            <div
              key={trade.id}
              className="rounded-2xl border border-white/10 bg-[#11161d] overflow-hidden"
            >

              {/* TRADE HEADER */}
              <div className="p-4 md:p-5 border-b border-white/10">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>

                    <div className="flex items-center gap-3 flex-wrap">

                      <h2 className="text-xl font-bold">
                        {trade.symbol}
                      </h2>

                      {/* DIRECTION */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          trade.type === "LONG"
                            ? "text-green-400 bg-green-500/10"
                            : "text-red-400 bg-red-500/10"
                        }`}
                      >
                        {trade.type}
                      </span>

                      {/* RESULT */}
                      <span
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getResultStyle(
                          trade.result
                        )}`}
                      >
                        {trade.result}
                      </span>

                    </div>

                    <p className="text-gray-500 text-sm mt-1">
                      {trade.date || "No date"}
                    </p>

                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex items-center gap-4">

                    <div className="text-right">

                      <p className="text-xs text-gray-500">
                        P&L
                      </p>

                      <p
                        className={`text-xl font-bold ${
                          Number(trade.pnl || 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {formatPnL(
                          Number(trade.pnl || 0)
                        )}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        setEditingTrade(trade)
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>

                  </div>

                </div>

                {/* TRADE DETAILS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

                  <DetailBox
                    title="Entry"
                    value={String(trade.entry ?? "—")}
                  />

                  <DetailBox
                    title="Exit"
                    value={String(trade.exit ?? "—")}
                  />

                  <DetailBox
                    title="Lot Size"
                    value={String(trade.lotSize ?? "—")}
                  />

                  <DetailBox
                    title="Session"
                    value={trade.session || "—"}
                  />

                </div>

              </div>

              {/* JOURNAL INFORMATION */}
              <div className="p-4 md:p-5">

                <div className="grid md:grid-cols-2 gap-4">

                  <JournalBox
                    title="Trade Notes"
                    value={trade.notes}
                  />

                  <JournalBox
                    title="Psychology"
                    value={trade.psychology}
                  />

                  <JournalBox
                    title="Mistake"
                    value={trade.mistake}
                    danger
                  />

                  <JournalBox
                    title="Lesson Learned"
                    value={trade.lesson}
                    success
                  />

                </div>

                {/* SETUP */}
                <div className="mt-4 rounded-xl border border-white/10 bg-[#0b0f14] p-4">

                  <h3 className="text-sm font-semibold mb-4">
                    Setup Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Strategy
                      </p>

                      <p className="text-sm text-gray-300">
                        {trade.strategy || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Setup Type
                      </p>

                      <p className="text-sm text-gray-300">
                        {trade.setupType || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Risk / Reward
                      </p>

                      <p className="text-sm text-gray-300">
                        {trade.riskReward
                          ? `1:${trade.riskReward}`
                          : "—"}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* EDIT TRADE MODAL */}
      {editingTrade && (
        <AddTradeModal
          key={editingTrade.id}
          initialTrade={editingTrade}
          onClose={() =>
            setEditingTrade(null)
          }
          onSave={handleSaveTrade}
        />
      )}

    </main>
  );
}

/* DETAIL BOX */

function DetailBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-[#0b0f14] rounded-xl p-3">

      <p className="text-xs text-gray-500">
        {title}
      </p>

      <p className="font-semibold mt-1">
        {value}
      </p>

    </div>
  );
}

/* JOURNAL BOX */

function JournalBox({
  title,
  value,
  danger = false,
  success = false,
}: {
  title: string;
  value?: string;
  danger?: boolean;
  success?: boolean;
}) {
  let border = "border-white/10";
  let titleColor = "text-gray-300";

  if (danger) {
    border = "border-red-500/10";
    titleColor = "text-red-400";
  }

  if (success) {
    border = "border-green-500/10";
    titleColor = "text-green-400";
  }

  return (
    <div
      className={`rounded-xl border ${border} bg-[#0b0f14] p-4 min-h-[120px]`}
    >

      <h3
        className={`text-sm font-semibold mb-3 ${titleColor}`}
      >
        {title}
      </h3>

      <p className="text-sm text-gray-400 whitespace-pre-wrap leading-6">
        {value || "No entry added."}
      </p>

    </div>
  );
}