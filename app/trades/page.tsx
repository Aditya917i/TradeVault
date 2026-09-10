"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import AddTradeModal, { Trade } from "../AddTradeModal";

const TRADE_STORAGE = "tradevault-trades";

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // ============================================
  // LOAD TRADES FROM LOCAL STORAGE
  // ============================================

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

  // ============================================
  // SAVE TRADES TO LOCAL STORAGE
  // ============================================

  useEffect(() => {
    // IMPORTANT:
    // Don't save until the first load is finished.
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

  // ============================================
  // ADD / EDIT TRADE
  // ============================================

  const handleSaveTrade = (trade: Trade) => {
    setTrades((currentTrades) => {
      const exists = currentTrades.some(
        (item) => item.id === trade.id
      );

      if (exists) {
        return currentTrades.map((item) =>
          item.id === trade.id ? trade : item
        );
      }

      return [trade, ...currentTrades];
    });

    setShowModal(false);
    setEditingTrade(null);
  };

  // ============================================
  // DELETE TRADE
  // ============================================

  const handleDeleteTrade = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trade?"
    );

    if (!confirmed) return;

    setTrades((currentTrades) =>
      currentTrades.filter((trade) => trade.id !== id)
    );
  };

  // ============================================
  // FILTER TRADES
  // ============================================

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        trade.symbol?.toLowerCase().includes(searchText) ||
        trade.strategy?.toLowerCase().includes(searchText) ||
        trade.setupType?.toLowerCase().includes(searchText) ||
        trade.notes?.toLowerCase().includes(searchText);

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

  // ============================================
  // STATISTICS
  // ============================================

  const totalPnL = trades.reduce(
    (total, trade) =>
      total + Number(trade.pnl || 0),
    0
  );

  const wins = trades.filter(
    (trade) => trade.result === "WIN"
  ).length;

  const losses = trades.filter(
    (trade) => trade.result === "LOSS"
  ).length;

  const winRate =
    trades.length > 0
      ? (wins / trades.length) * 100
      : 0;

  const formatPnL = (value: number) => {
    if (value >= 0) {
      return `+$${value.toFixed(2)}`;
    }

    return `-$${Math.abs(value).toFixed(2)}`;
  };

  // ============================================
  // OPEN ADD MODAL
  // ============================================

  const openAddTrade = () => {
    setEditingTrade(null);
    setShowModal(true);
  };

  // ============================================
  // OPEN EDIT MODAL
  // ============================================

  const openEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setShowModal(true);
  };

  // ============================================
  // CLOSE MODAL
  // ============================================

  const closeModal = () => {
    setShowModal(false);
    setEditingTrade(null);
  };

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white p-4 md:p-6">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Trades
          </h1>

          <p className="text-gray-400 text-sm mt-1">
            Manage and review all your trades
          </p>
        </div>

        <button
          onClick={openAddTrade}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Add Trade
        </button>

      </div>

      {/* ========================================
          STATISTICS
      ======================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* TOTAL TRADES */}

        <div className="rounded-xl border border-white/10 bg-[#11161d] p-4">

          <p className="text-sm text-gray-400">
            Total Trades
          </p>

          <p className="text-2xl font-bold mt-2">
            {trades.length}
          </p>

        </div>

        {/* TOTAL PNL */}

        <div className="rounded-xl border border-white/10 bg-[#11161d] p-4">

          <p className="text-sm text-gray-400">
            Total P&L
          </p>

          <p
            className={`text-2xl font-bold mt-2 ${
              totalPnL >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {formatPnL(totalPnL)}
          </p>

        </div>

        {/* WIN RATE */}

        <div className="rounded-xl border border-white/10 bg-[#11161d] p-4">

          <p className="text-sm text-gray-400">
            Win Rate
          </p>

          <p className="text-2xl font-bold text-blue-400 mt-2">
            {winRate.toFixed(1)}%
          </p>

        </div>

        {/* WINS / LOSSES */}

        <div className="rounded-xl border border-white/10 bg-[#11161d] p-4">

          <p className="text-sm text-gray-400">
            Wins / Losses
          </p>

          <p className="text-2xl font-bold mt-2">
            <span className="text-green-400">
              {wins}
            </span>

            <span className="text-gray-600 mx-2">
              /
            </span>

            <span className="text-red-400">
              {losses}
            </span>
          </p>

        </div>

      </div>

      {/* ========================================
          SEARCH & FILTERS
      ======================================== */}

      <div className="rounded-xl border border-white/10 bg-[#11161d] p-4 mb-6">

        <div className="flex items-center gap-2 mb-4">

          <Search className="w-4 h-4 text-blue-400" />

          <h2 className="font-semibold">
            Search & Filters
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* SEARCH */}

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

            <input
              type="text"
              placeholder="Search symbol, strategy..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full bg-[#0b0f14] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500"
            />

          </div>

          {/* RESULT */}

          <select
            value={resultFilter}
            onChange={(e) =>
              setResultFilter(e.target.value)
            }
            className="bg-[#0b0f14] border border-white/10 rounded-lg px-4 py-3 text-sm outline-none"
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
            className="bg-[#0b0f14] border border-white/10 rounded-lg px-4 py-3 text-sm outline-none"
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
            className="bg-[#0b0f14] border border-white/10 rounded-lg px-4 py-3 text-sm outline-none"
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

      {/* ========================================
          LOADING
      ======================================== */}

      {!loaded ? (

        <div className="rounded-xl border border-white/10 bg-[#11161d] p-10 text-center">

          <p className="text-gray-400">
            Loading trades...
          </p>

        </div>

      ) : filteredTrades.length === 0 ? (

        /* ======================================
           EMPTY STATE
        ====================================== */

        <div className="rounded-xl border border-white/10 bg-[#11161d] p-10 text-center">

          <h2 className="text-lg font-semibold mb-2">
            No trades found
          </h2>

          <p className="text-gray-500 text-sm">
            Add your first trade to start building your journal.
          </p>

        </div>

      ) : (

        /* ======================================
           TRADES TABLE
        ====================================== */

        <div className="rounded-xl border border-white/10 bg-[#11161d] overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-white/10">

                <tr className="text-left text-xs text-gray-500">

                  <th className="px-4 py-4">
                    #
                  </th>

                  <th className="px-4 py-4">
                    Trade
                  </th>

                  <th className="px-4 py-4">
                    Entry / Exit
                  </th>

                  <th className="px-4 py-4">
                    Lots
                  </th>

                  <th className="px-4 py-4">
                    Strategy
                  </th>

                  <th className="px-4 py-4">
                    Session
                  </th>

                  <th className="px-4 py-4">
                    P&L
                  </th>

                  <th className="px-4 py-4 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredTrades.map(
                  (trade, index) => (

                    <tr
                      key={trade.id}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                    >

                      {/* NUMBER */}

                      <td className="px-4 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* TRADE */}

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-2">

                          <span
                            className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              trade.type === "LONG"
                                ? "text-green-400 bg-green-500/10"
                                : "text-red-400 bg-red-500/10"
                            }`}
                          >
                            {trade.type}
                          </span>

                          <span className="font-semibold">
                            {trade.symbol}
                          </span>

                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {trade.date || "—"}
                        </p>

                      </td>

                      {/* ENTRY EXIT */}

                      <td className="px-4 py-4 text-sm">

                        <div>
                          {trade.entry}
                        </div>

                        <div className="text-gray-500">
                          → {trade.exit}
                        </div>

                      </td>

                      {/* LOTS */}

                      <td className="px-4 py-4 text-sm">
                        {trade.lotSize}
                      </td>

                      {/* STRATEGY */}

                      <td className="px-4 py-4 text-sm text-gray-400">
                        {trade.strategy || "—"}
                      </td>

                      {/* SESSION */}

                      <td className="px-4 py-4 text-sm text-gray-400">
                        {trade.session || "—"}
                      </td>

                      {/* PNL */}

                      <td className="px-4 py-4">

                        <div
                          className={`font-semibold ${
                            Number(trade.pnl || 0) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatPnL(
                            Number(trade.pnl || 0)
                          )}
                        </div>

                        <div
                          className={`text-xs ${
                            trade.result === "WIN"
                              ? "text-green-400"
                              : trade.result === "LOSS"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {trade.result}
                        </div>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4">

                        <div className="flex justify-end gap-2">

                          {/* EDIT */}

                          <button
                            onClick={() =>
                              openEditTrade(trade)
                            }
                            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition"
                            title="Edit trade"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* DELETE */}

                          <button
                            onClick={() =>
                              handleDeleteTrade(
                                trade.id
                              )
                            }
                            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/30 transition"
                            title="Delete trade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {/* COUNT */}

          <div className="px-4 py-3 text-center text-xs text-gray-500 border-t border-white/5">
            Showing {filteredTrades.length} of{" "}
            {trades.length} trades
          </div>

        </div>

      )}

      {/* ========================================
          ADD / EDIT TRADE MODAL
      ======================================== */}

      {showModal && (
        <AddTradeModal
          key={editingTrade?.id ?? "new"}
          initialTrade={editingTrade}
          onClose={closeModal}
          onSave={handleSaveTrade}
        />
      )}

    </main>
  );
}