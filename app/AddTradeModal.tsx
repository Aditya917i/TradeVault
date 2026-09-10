"use client";

import { useState } from "react";
import {
  X,
  Upload,
  Save,
  Calculator,
} from "lucide-react";

export type Trade = {
  id: string;
  symbol: string;
  type: "LONG" | "SHORT";
  entry: number;
  exit: number;
  lotSize: number;
  stopLoss: number;
  takeProfit: number;
  strategy: string;
  date: string;
  session: string;
  setupType: string;
  riskAmount: number;
  riskReward: number;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  pnl: number;
  notes: string;
  psychology: string;
  mistake: string;
  lesson: string;
  screenshot?: string;
};

type Props = {
  onClose: () => void;
  onSave: (trade: Trade) => void;
  initialTrade?: Trade | null;
};

export default function AddTradeModal({
  onClose,
  onSave,
  initialTrade,
}: Props) {
  const isEditing = !!initialTrade;

  // --------------------------------------------------
  // TRADE INFORMATION
  // --------------------------------------------------

  const [symbol, setSymbol] = useState(
    initialTrade?.symbol || "XAUUSD"
  );

  const [type, setType] = useState<"LONG" | "SHORT">(
    initialTrade?.type || "LONG"
  );

  const [entry, setEntry] = useState(
    initialTrade?.entry?.toString() || ""
  );

  const [exit, setExit] = useState(
    initialTrade?.exit?.toString() || ""
  );

  const [lotSize, setLotSize] = useState(
    initialTrade?.lotSize?.toString() || "0.01"
  );

  const [strategy, setStrategy] = useState(
    initialTrade?.strategy || ""
  );

  const [date, setDate] = useState(
    initialTrade?.date ||
      new Date().toISOString().split("T")[0]
  );

  const [session, setSession] = useState(
    initialTrade?.session || "New York"
  );

  const [setupType, setSetupType] = useState(
    initialTrade?.setupType || ""
  );

  const [notes, setNotes] = useState(
    initialTrade?.notes || ""
  );

  const [psychology, setPsychology] = useState(
    initialTrade?.psychology || ""
  );

  const [mistake, setMistake] = useState(
    initialTrade?.mistake || ""
  );

  const [lesson, setLesson] = useState(
    initialTrade?.lesson || ""
  );

  // --------------------------------------------------
  // NUMERIC VALUES
  // --------------------------------------------------

  const entryPrice = Number(entry) || 0;
  const exitPrice = Number(exit) || 0;
  const lots = Number(lotSize) || 0;

  // XAUUSD:
  // 1.00 lot = 100 oz
  //
  // Forex:
  // 1.00 lot = 100,000 units
  //
  // This keeps the existing TradeVault calculation model.
  const multiplier =
    symbol.toUpperCase() === "XAUUSD"
      ? 100
      : 100000;

  // --------------------------------------------------
  // P&L CALCULATION
  // --------------------------------------------------

  let pnl = 0;

  if (type === "LONG") {
    pnl =
      (exitPrice - entryPrice) *
      lots *
      multiplier;
  } else {
    pnl =
      (entryPrice - exitPrice) *
      lots *
      multiplier;
  }

  // --------------------------------------------------
  // RESULT
  // --------------------------------------------------

  let result: "WIN" | "LOSS" | "BREAKEVEN" =
    "BREAKEVEN";

  if (pnl > 0) {
    result = "WIN";
  } else if (pnl < 0) {
    result = "LOSS";
  }

  // --------------------------------------------------
  // SAVE / UPDATE
  // --------------------------------------------------

  const handleSave = () => {
    if (!symbol) {
      alert("Please select a symbol.");
      return;
    }

    if (!entry || !exit) {
      alert("Please enter Entry and Exit price.");
      return;
    }

    if (!lotSize || lots <= 0) {
      alert("Please enter a valid Lot Size.");
      return;
    }

    const trade: Trade = {
      // Keep old ID while editing.
      // Create a new ID when adding.
      id:
        initialTrade?.id ||
        Date.now().toString(),

      symbol: symbol.toUpperCase(),

      type,

      entry: entryPrice,

      exit: exitPrice,

      lotSize: lots,

      // Kept in the Trade type for compatibility
      // with the existing Trades page.
      // These are no longer entered in the modal.
      stopLoss: initialTrade?.stopLoss || 0,

      takeProfit: initialTrade?.takeProfit || 0,

      strategy,

      date,

      session,

      setupType,

      // No risk calculation in this version.
      riskAmount:
        initialTrade?.riskAmount || 0,

      // No R:R calculation in this version.
      riskReward:
        initialTrade?.riskReward || 0,

      result,

      pnl,

      notes,

      psychology,

      mistake,

      lesson,

      // Preserve an existing screenshot when editing.
      screenshot:
        initialTrade?.screenshot,
    };

    onSave(trade);
  };

  // --------------------------------------------------
  // STYLES
  // --------------------------------------------------

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-[#11151c] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500";

  const labelClass =
    "mb-1.5 block text-xs font-medium text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#0d1117] shadow-2xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">

          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditing
                ? "Edit Trade"
                : "Add Trade"}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {isEditing
                ? "Update your trade details"
                : "Record a new trade in your journal"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <X size={20} />
          </button>

        </div>

        {/* ================================================= */}
        {/* EDIT INDICATOR */}
        {/* ================================================= */}

        {isEditing && (
          <div className="border-b border-blue-900/40 bg-blue-500/10 px-6 py-2">

            <p className="text-xs text-blue-400">
              ✏️ You are editing an existing trade
            </p>

          </div>
        )}

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <div className="overflow-y-auto px-6 py-5">

          {/* ================================================= */}
          {/* TRADE INFORMATION */}
          {/* ================================================= */}

          <div className="mb-6">

            <h3 className="mb-4 text-sm font-semibold text-white">
              Trade Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* SYMBOL */}
              <div>

                <label className={labelClass}>
                  Symbol
                </label>

                <select
                  value={symbol}
                  onChange={(e) =>
                    setSymbol(e.target.value)
                  }
                  className={inputClass}
                >

                  <option value="XAUUSD">
                    XAUUSD
                  </option>

                  <option value="EURUSD">
                    EURUSD
                  </option>

                  <option value="GBPUSD">
                    GBPUSD
                  </option>

                  <option value="USDJPY">
                    USDJPY
                  </option>

                  <option value="AUDUSD">
                    AUDUSD
                  </option>

                  <option value="USDCAD">
                    USDCAD
                  </option>

                  <option value="USDCHF">
                    USDCHF
                  </option>

                  <option value="BTCUSD">
                    BTCUSD
                  </option>

                  <option value="ETHUSD">
                    ETHUSD
                  </option>

                </select>

              </div>

              {/* DIRECTION */}
              <div>

                <label className={labelClass}>
                  Direction
                </label>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setType("LONG")
                    }
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      type === "LONG"
                        ? "border-green-500 bg-green-500/20 text-green-400"
                        : "border-gray-700 bg-[#11151c] text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    LONG
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setType("SHORT")
                    }
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      type === "SHORT"
                        ? "border-red-500 bg-red-500/20 text-red-400"
                        : "border-gray-700 bg-[#11151c] text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    SHORT
                  </button>

                </div>

              </div>

              {/* DATE */}
              <div>

                <label className={labelClass}>
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  className={inputClass}
                />

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* ENTRY / EXIT / LOT */}
          {/* ================================================= */}

          <div className="mb-6">

            <h3 className="mb-4 text-sm font-semibold text-white">
              Trade Prices
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* ENTRY */}
              <div>

                <label className={labelClass}>
                  Entry Price
                </label>

                <input
                  type="number"
                  step="any"
                  value={entry}
                  onChange={(e) =>
                    setEntry(e.target.value)
                  }
                  placeholder="3350.00"
                  className={inputClass}
                />

              </div>

              {/* EXIT */}
              <div>

                <label className={labelClass}>
                  Exit Price
                </label>

                <input
                  type="number"
                  step="any"
                  value={exit}
                  onChange={(e) =>
                    setExit(e.target.value)
                  }
                  placeholder="3360.00"
                  className={inputClass}
                />

              </div>

              {/* LOT SIZE */}
              <div>

                <label className={labelClass}>
                  Lot Size
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lotSize}
                  onChange={(e) =>
                    setLotSize(e.target.value)
                  }
                  placeholder="0.01"
                  className={inputClass}
                />

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* P&L CALCULATION */}
          {/* ================================================= */}

          <div className="mb-6 rounded-xl border border-gray-800 bg-[#11151c] p-4">

            <div className="mb-4 flex items-center gap-2">

              <Calculator
                size={16}
                className="text-blue-400"
              />

              <h3 className="text-sm font-semibold text-white">
                Automatic P&L
              </h3>

            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* PRICE DIFFERENCE */}
              <div>

                <p className="text-xs text-gray-500">
                  Price Difference
                </p>

                <p className="mt-1 text-lg font-bold text-white">

                  {Math.abs(
                    exitPrice - entryPrice
                  ).toFixed(2)}

                </p>

              </div>

              {/* LOT SIZE */}
              <div>

                <p className="text-xs text-gray-500">
                  Lot Size
                </p>

                <p className="mt-1 text-lg font-bold text-white">
                  {lots.toFixed(2)}
                </p>

              </div>

              {/* P&L */}
              <div>

                <p className="text-xs text-gray-500">
                  P&L
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${
                    pnl > 0
                      ? "text-green-400"
                      : pnl < 0
                      ? "text-red-400"
                      : "text-gray-300"
                  }`}
                >

                  {pnl >= 0 ? "+" : "-"}$
                  {Math.abs(pnl).toFixed(2)}

                </p>

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* SETUP */}
          {/* ================================================= */}

          <div className="mb-6">

            <h3 className="mb-4 text-sm font-semibold text-white">
              Setup
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* STRATEGY */}
              <div>

                <label className={labelClass}>
                  Strategy
                </label>

                <input
                  type="text"
                  value={strategy}
                  onChange={(e) =>
                    setStrategy(e.target.value)
                  }
                  placeholder="Key Level"
                  className={inputClass}
                />

              </div>

              {/* SESSION */}
              <div>

                <label className={labelClass}>
                  Session
                </label>

                <select
                  value={session}
                  onChange={(e) =>
                    setSession(e.target.value)
                  }
                  className={inputClass}
                >

                  <option value="New York">
                    New York
                  </option>

                  <option value="London">
                    London
                  </option>

                  <option value="Asia">
                    Asia
                  </option>

                  <option value="London + New York">
                    London + New York
                  </option>

                </select>

              </div>

              {/* SETUP TYPE */}
              <div>

                <label className={labelClass}>
                  Setup Type
                </label>

                <input
                  type="text"
                  value={setupType}
                  onChange={(e) =>
                    setSetupType(e.target.value)
                  }
                  placeholder="Liquidity Sweep"
                  className={inputClass}
                />

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* JOURNAL */}
          {/* ================================================= */}

          <div className="mb-6">

            <h3 className="mb-4 text-sm font-semibold text-white">
              Trade Journal
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* NOTES */}
              <div>

                <label className={labelClass}>
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Describe the trade..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />

              </div>

              {/* PSYCHOLOGY */}
              <div>

                <label className={labelClass}>
                  Psychology
                </label>

                <textarea
                  value={psychology}
                  onChange={(e) =>
                    setPsychology(e.target.value)
                  }
                  placeholder="How were you feeling?"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />

              </div>

              {/* MISTAKE */}
              <div>

                <label className={labelClass}>
                  Mistake
                </label>

                <textarea
                  value={mistake}
                  onChange={(e) =>
                    setMistake(e.target.value)
                  }
                  placeholder="What mistake did you make?"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />

              </div>

              {/* LESSON */}
              <div>

                <label className={labelClass}>
                  Lesson
                </label>

                <textarea
                  value={lesson}
                  onChange={(e) =>
                    setLesson(e.target.value)
                  }
                  placeholder="What did you learn?"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* SCREENSHOT */}
          {/* ================================================= */}

          <div>

            <h3 className="mb-4 text-sm font-semibold text-white">
              Trade Screenshot
            </h3>

            <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-700 bg-[#11151c] p-8">

              <div className="text-center">

                <Upload
                  size={28}
                  className="mx-auto mb-3 text-gray-500"
                />

                <p className="text-sm text-gray-400">
                  Screenshot upload coming soon
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  You will be able to attach your TradingView chart
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >

            <Save size={17} />

            {isEditing
              ? "Update Trade"
              : "Save Trade"}

          </button>

        </div>

      </div>

    </div>
  );
}