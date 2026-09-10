"use client";

import { useState } from "react";
import {
  Database,
  Download,
  FlaskConical,
  Play,
  BarChart3,
} from "lucide-react";

export default function BacktestingPage() {
  const [symbol, setSymbol] = useState("XAUUSD");
  const [timeframe, setTimeframe] = useState("5 Minutes");
  const [balance, setBalance] = useState("5000");
  const [risk, setRisk] = useState("1%");
  const [rr, setRr] = useState("1 : 2");

  const [trades, setTrades] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [running, setRunning] = useState(false);

  const winRate = trades > 0 ? ((wins / trades) * 100).toFixed(1) : "0.0";

  function runBacktest() {
    setRunning(true);

    setTimeout(() => {
      setRunning(false);

      // Backtesting will be connected to real historical data later.
      setTrades(0);
      setWins(0);
      setLosses(0);
    }, 800);
  }

  return (
    <div className="min-h-screen bg-[#07090d] px-6 py-8 text-white">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backtesting</h1>

          <p className="mt-1 text-sm text-gray-500">
            Test your strategy against historical XAUUSD data.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 rounded-lg bg-[#25262b] px-4 py-2.5 text-sm font-medium transition hover:bg-[#303136]"
          >
            <Database size={16} />
            Load Historical Data
          </button>

          <button
            className="flex items-center gap-2 rounded-lg bg-[#25262b] px-4 py-2.5 text-sm font-medium transition hover:bg-[#303136]"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Data Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#111216] p-5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Database size={16} />
            Historical Data
          </div>

          <div className="mt-4 text-xl font-bold">—</div>

          <p className="mt-2 text-xs text-gray-500">
            1-minute candles
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111216] p-5">
          <div className="text-xs text-gray-400">Data Period</div>

          <div className="mt-4 text-base font-bold">Not loaded</div>

          <p className="mt-2 text-xs text-gray-500">XAUUSD</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111216] p-5">
          <div className="text-xs text-gray-400">CSV Files</div>

          <div className="mt-4 text-xl font-bold">—</div>

          <p className="mt-2 text-xs text-gray-500">
            files loaded
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="rounded-xl border border-white/10 bg-[#111216] p-5">
        <div className="mb-5 flex items-center gap-2">
          <FlaskConical size={18} />
          <h2 className="font-semibold">Backtest Configuration</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Symbol */}
          <div>
            <label className="mb-2 block text-xs text-gray-500">
              Symbol
            </label>

            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#08090c] px-3 py-2.5 text-sm outline-none"
            >
              <option value="XAUUSD">XAUUSD</option>
              <option value="EURUSD">EURUSD</option>
              <option value="USDJPY">USDJPY</option>
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="mb-2 block text-xs text-gray-500">
              Timeframe
            </label>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#08090c] px-3 py-2.5 text-sm outline-none"
            >
              <option>5 Minutes</option>
              <option>1 Minute</option>
              <option>15 Minutes</option>
              <option>30 Minutes</option>
              <option>1 Hour</option>
            </select>
          </div>

          {/* Balance */}
          <div>
            <label className="mb-2 block text-xs text-gray-500">
              Starting Balance
            </label>

            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#08090c] px-3 py-2.5 text-sm outline-none"
            />
          </div>

          {/* Risk */}
          <div>
            <label className="mb-2 block text-xs text-gray-500">
              Risk / Trade
            </label>

            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#08090c] px-3 py-2.5 text-sm outline-none"
            >
              <option>0.5%</option>
              <option>1%</option>
              <option>1.5%</option>
              <option>2%</option>
            </select>
          </div>

          {/* RR */}
          <div>
            <label className="mb-2 block text-xs text-gray-500">
              Risk : Reward
            </label>

            <select
              value={rr}
              onChange={(e) => setRr(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#08090c] px-3 py-2.5 text-sm outline-none"
            >
              <option>1 : 1</option>
              <option>1 : 2</option>
              <option>1 : 3</option>
            </select>
          </div>
        </div>

        {/* Strategy */}
        <div className="mt-4 rounded-lg border border-white/10 bg-[#17181d] p-4 text-sm">
          <span className="font-semibold text-white">Strategy:</span>{" "}
          <span className="font-semibold text-yellow-400">
            London & New York Continuation
          </span>{" "}
          <span className="text-gray-400">
            — London range is built from{" "}
            <span className="font-semibold text-white">
              12:30–17:00 IST
            </span>
            , then the engine looks for a New York sweep and candle
            confirmation.
          </span>
        </div>

        {/* Run */}
        <button
          onClick={runBacktest}
          disabled={running}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[#55565b] px-5 py-3 text-sm font-semibold transition hover:bg-[#66676c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play size={16} />

          {running ? "Running..." : "Run Backtest"}
        </button>
      </div>

      {/* Statistics */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
        <Stat title="Trades" value={trades.toString()} />
        <Stat title="Wins" value={wins.toString()} />
        <Stat title="Losses" value={losses.toString()} />
        <Stat title="Win Rate" value={`${winRate}%`} />
        <Stat title="Net P&L" value="$0.00" />
        <Stat title="Profit Factor" value="0.00" />
        <Stat title="Max DD" value="$0.00" />
      </div>

      {/* Trade History */}
      <div className="mt-5 rounded-xl border border-white/10 bg-[#111216] p-5">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} />

          <h2 className="font-semibold">Trade History</h2>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Run a backtest to generate trades
        </p>

        <div className="mt-6 flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-white/10">
          <div className="text-center">
            <BarChart3
              size={30}
              className="mx-auto mb-3 text-gray-600"
            />

            <p className="text-sm text-gray-500">
              No backtest results yet
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Historical trade results will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111216] p-4">
      <p className="text-xs text-gray-500">{title}</p>

      <p className="mt-3 text-sm font-bold">{value}</p>
    </div>
  );
}