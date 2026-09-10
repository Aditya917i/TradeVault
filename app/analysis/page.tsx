"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  DollarSign,
  Activity,
} from "lucide-react";

type Trade = {
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

const TRADE_STORAGE = "tradevault-trades";

export default function AnalysisPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ============================================
  // LOAD TRADES
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
  // BASIC STATISTICS
  // ============================================

  const totalTrades = trades.length;

  const wins = trades.filter(
    (trade) => trade.result === "WIN"
  ).length;

  const losses = trades.filter(
    (trade) => trade.result === "LOSS"
  ).length;

  const breakevens = trades.filter(
    (trade) => trade.result === "BREAKEVEN"
  ).length;

  const winningPnL = trades
    .filter((trade) => Number(trade.pnl) > 0)
    .reduce(
      (total, trade) =>
        total + Number(trade.pnl || 0),
      0
    );

  const losingPnL = Math.abs(
    trades
      .filter((trade) => Number(trade.pnl) < 0)
      .reduce(
        (total, trade) =>
          total + Number(trade.pnl || 0),
        0
      )
  );

  const netPnL = trades.reduce(
    (total, trade) =>
      total + Number(trade.pnl || 0),
    0
  );

  const winRate =
    totalTrades > 0
      ? (wins / totalTrades) * 100
      : 0;

  const averageWin =
    wins > 0 ? winningPnL / wins : 0;

  const averageLoss =
    losses > 0 ? losingPnL / losses : 0;

  const profitFactor =
    losingPnL > 0
      ? winningPnL / losingPnL
      : winningPnL > 0
      ? Infinity
      : 0;

  const bestTrade =
    trades.length > 0
      ? Math.max(
          ...trades.map((trade) =>
            Number(trade.pnl || 0)
          )
        )
      : 0;

  const worstTrade =
    trades.length > 0
      ? Math.min(
          ...trades.map((trade) =>
            Number(trade.pnl || 0)
          )
        )
      : 0;

  // ============================================
  // LONG / SHORT
  // ============================================

  const longTrades = trades.filter(
    (trade) => trade.type === "LONG"
  );

  const shortTrades = trades.filter(
    (trade) => trade.type === "SHORT"
  );

  const longPnL = longTrades.reduce(
    (total, trade) =>
      total + Number(trade.pnl || 0),
    0
  );

  const shortPnL = shortTrades.reduce(
    (total, trade) =>
      total + Number(trade.pnl || 0),
    0
  );

  const longWins = longTrades.filter(
    (trade) => trade.result === "WIN"
  ).length;

  const shortWins = shortTrades.filter(
    (trade) => trade.result === "WIN"
  ).length;

  const longWinRate =
    longTrades.length > 0
      ? (longWins / longTrades.length) * 100
      : 0;

  const shortWinRate =
    shortTrades.length > 0
      ? (shortWins / shortTrades.length) * 100
      : 0;

  // ============================================
  // SESSION ANALYSIS
  // ============================================

  const sessions = useMemo(() => {
    const sessionMap: Record<
      string,
      {
        trades: number;
        wins: number;
        pnl: number;
      }
    > = {};

    trades.forEach((trade) => {
      const session = trade.session || "Unknown";

      if (!sessionMap[session]) {
        sessionMap[session] = {
          trades: 0,
          wins: 0,
          pnl: 0,
        };
      }

      sessionMap[session].trades += 1;

      if (trade.result === "WIN") {
        sessionMap[session].wins += 1;
      }

      sessionMap[session].pnl += Number(
        trade.pnl || 0
      );
    });

    return Object.entries(sessionMap)
      .map(([name, data]) => ({
        name,
        ...data,
        winRate:
          data.trades > 0
            ? (data.wins / data.trades) * 100
            : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  // ============================================
  // STRATEGY ANALYSIS
  // ============================================

  const strategies = useMemo(() => {
    const strategyMap: Record<
      string,
      {
        trades: number;
        wins: number;
        pnl: number;
      }
    > = {};

    trades.forEach((trade) => {
      const strategy =
        trade.strategy || "No Strategy";

      if (!strategyMap[strategy]) {
        strategyMap[strategy] = {
          trades: 0,
          wins: 0,
          pnl: 0,
        };
      }

      strategyMap[strategy].trades += 1;

      if (trade.result === "WIN") {
        strategyMap[strategy].wins += 1;
      }

      strategyMap[strategy].pnl += Number(
        trade.pnl || 0
      );
    });

    return Object.entries(strategyMap)
      .map(([name, data]) => ({
        name,
        ...data,
        winRate:
          data.trades > 0
            ? (data.wins / data.trades) * 100
            : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  // ============================================
  // RECENT P&L
  // ============================================

  const recentTrades = useMemo(() => {
    return [...trades]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 10)
      .reverse();
  }, [trades]);

  // ============================================
  // HELPERS
  // ============================================

  const formatPnL = (value: number) => {
    if (value >= 0) {
      return `+$${value.toFixed(2)}`;
    }

    return `-$${Math.abs(value).toFixed(2)}`;
  };

  const formatProfitFactor = () => {
    if (profitFactor === Infinity) {
      return "∞";
    }

    return profitFactor.toFixed(2);
  };

  // ============================================
  // LOADING
  // ============================================

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#0b0f14] text-white p-6">

        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-10 text-center">

          <p className="text-gray-400">
            Loading analysis...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white p-4 md:p-6">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">

            <BarChart3 className="w-5 h-5 text-blue-400" />

          </div>

          <div>

            <h1 className="text-2xl md:text-3xl font-bold">
              Trading Analysis
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Understand your performance and improve your trading.
            </p>

          </div>

        </div>

      </div>

      {/* ========================================
          MAIN STATS
      ======================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* TOTAL PNL */}

        <StatCard
          title="Net P&L"
          value={formatPnL(netPnL)}
          icon={<DollarSign className="w-5 h-5" />}
          positive={netPnL >= 0}
        />

        {/* WIN RATE */}

        <StatCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          icon={<Target className="w-5 h-5" />}
          positive={winRate >= 50}
        />

        {/* PROFIT FACTOR */}

        <StatCard
          title="Profit Factor"
          value={formatProfitFactor()}
          icon={<Activity className="w-5 h-5" />}
          positive={profitFactor >= 1}
        />

        {/* TOTAL TRADES */}

        <StatCard
          title="Total Trades"
          value={String(totalTrades)}
          icon={<BarChart3 className="w-5 h-5" />}
        />

      </div>

      {/* ========================================
          WIN / LOSS OVERVIEW
      ======================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* WIN LOSS */}

        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-5">

          <h2 className="font-semibold mb-5">
            Trade Results
          </h2>

          <div className="space-y-4">

            <ProgressRow
              label="Wins"
              value={wins}
              total={totalTrades}
              color="green"
            />

            <ProgressRow
              label="Losses"
              value={losses}
              total={totalTrades}
              color="red"
            />

            <ProgressRow
              label="Breakeven"
              value={breakevens}
              total={totalTrades}
              color="yellow"
            />

          </div>

        </div>

        {/* AVERAGES */}

        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-5">

          <h2 className="font-semibold mb-5">
            Average Performance
          </h2>

          <div className="space-y-4">

            <MetricRow
              label="Average Win"
              value={formatPnL(averageWin)}
              positive
            />

            <MetricRow
              label="Average Loss"
              value={
                averageLoss > 0
                  ? `-$${averageLoss.toFixed(2)}`
                  : "$0.00"
              }
            />

            <MetricRow
              label="Best Trade"
              value={formatPnL(bestTrade)}
              positive
            />

            <MetricRow
              label="Worst Trade"
              value={formatPnL(worstTrade)}
            />

          </div>

        </div>

        {/* LONG SHORT */}

        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-5">

          <h2 className="font-semibold mb-5">
            Long vs Short
          </h2>

          <div className="space-y-4">

            <DirectionRow
              title="LONG"
              trades={longTrades.length}
              winRate={longWinRate}
              pnl={longPnL}
              positive
            />

            <DirectionRow
              title="SHORT"
              trades={shortTrades.length}
              winRate={shortWinRate}
              pnl={shortPnL}
            />

          </div>

        </div>

      </div>

      {/* ========================================
          P&L CHART
      ======================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#11161d] p-5 mb-6">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="font-semibold">
              P&L Progression
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Cumulative performance across your trades
            </p>

          </div>

          <TrendingUp className="w-5 h-5 text-blue-400" />

        </div>

        {recentTrades.length === 0 ? (

          <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
            Add trades to see your P&L progression.
          </div>

        ) : (

          <div className="h-56 flex items-end gap-2 overflow-x-auto pb-8">

            {(() => {
              let cumulative = 0;

              return recentTrades.map(
                (trade, index) => {

                  cumulative += Number(
                    trade.pnl || 0
                  );

                  const maxAbs = Math.max(
                    ...recentTrades.map(
                      (item) =>
                        Math.abs(
                          Number(
                            item.pnl || 0
                          )
                        )
                    ),
                    1
                  );

                  const height = Math.max(
                    8,
                    Math.min(
                      100,
                      (Math.abs(cumulative) /
                        maxAbs) *
                        70
                    )
                  );

                  return (
                    <div
                      key={`${trade.id}-${index}`}
                      className="min-w-[45px] flex-1 max-w-[80px] h-full flex flex-col justify-end items-center gap-2"
                    >

                      <div
                        className={`w-full max-w-[42px] rounded-t-lg ${
                          cumulative >= 0
                            ? "bg-green-500/70"
                            : "bg-red-500/70"
                        }`}
                        style={{
                          height: `${height}%`,
                        }}
                        title={`Cumulative: ${formatPnL(
                          cumulative
                        )}`}
                      />

                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        #{index + 1}
                      </span>

                    </div>
                  );
                }
              );
            })()}

          </div>

        )}

      </div>

      {/* ========================================
          SESSION + STRATEGY
      ======================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* SESSION */}

        <AnalysisTable
          title="Session Performance"
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          emptyText="No session data available."
          headers={[
            "Session",
            "Trades",
            "Win Rate",
            "P&L",
          ]}
        >

          {sessions.map((session) => (

            <tr
              key={session.name}
              className="border-b border-white/5"
            >

              <td className="px-4 py-4 font-medium">
                {session.name}
              </td>

              <td className="px-4 py-4 text-gray-400">
                {session.trades}
              </td>

              <td className="px-4 py-4 text-gray-400">
                {session.winRate.toFixed(1)}%
              </td>

              <td
                className={`px-4 py-4 font-semibold ${
                  session.pnl >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {formatPnL(session.pnl)}
              </td>

            </tr>

          ))}

        </AnalysisTable>

        {/* STRATEGY */}

        <AnalysisTable
          title="Strategy Performance"
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          emptyText="No strategy data available."
          headers={[
            "Strategy",
            "Trades",
            "Win Rate",
            "P&L",
          ]}
        >

          {strategies.map((strategy) => (

            <tr
              key={strategy.name}
              className="border-b border-white/5"
            >

              <td className="px-4 py-4 font-medium max-w-[180px] truncate">
                {strategy.name}
              </td>

              <td className="px-4 py-4 text-gray-400">
                {strategy.trades}
              </td>

              <td className="px-4 py-4 text-gray-400">
                {strategy.winRate.toFixed(1)}%
              </td>

              <td
                className={`px-4 py-4 font-semibold ${
                  strategy.pnl >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {formatPnL(strategy.pnl)}
              </td>

            </tr>

          ))}

        </AnalysisTable>

      </div>

      {/* ========================================
          SUMMARY
      ======================================== */}

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

        <div className="flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">

            <BarChart3 className="w-5 h-5 text-blue-400" />

          </div>

          <div>

            <h2 className="font-semibold mb-1">
              Performance Summary
            </h2>

            {totalTrades === 0 ? (

              <p className="text-sm text-gray-400">
                Start adding trades to your journal. Your performance analysis will automatically appear here.
              </p>

            ) : (

              <p className="text-sm text-gray-400 leading-6">

                You have taken{" "}
                <span className="text-white font-semibold">
                  {totalTrades}
                </span>{" "}
                trade{totalTrades !== 1 ? "s" : ""} with a{" "}
                <span className="text-white font-semibold">
                  {winRate.toFixed(1)}%
                </span>{" "}
                win rate. Your current net P&L is{" "}
                <span
                  className={
                    netPnL >= 0
                      ? "text-green-400 font-semibold"
                      : "text-red-400 font-semibold"
                  }
                >
                  {formatPnL(netPnL)}
                </span>
                .
              </p>

            )}

          </div>

        </div>

      </div>

    </main>
  );
}

/* ============================================
   STAT CARD
============================================ */

function StatCard({
  title,
  value,
  icon,
  positive,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11161d] p-4">

      <div className="flex items-center justify-between mb-3">

        <span className="text-sm text-gray-400">
          {title}
        </span>

        <div
          className={`${
            positive === false
              ? "text-red-400"
              : "text-blue-400"
          }`}
        >
          {icon}
        </div>

      </div>

      <p
        className={`text-2xl font-bold ${
          positive === true
            ? "text-green-400"
            : positive === false
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

/* ============================================
   PROGRESS ROW
============================================ */

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: "green" | "red" | "yellow";
}) {
  const percentage =
    total > 0 ? (value / total) * 100 : 0;

  const barColor =
    color === "green"
      ? "bg-green-500"
      : color === "red"
      ? "bg-red-500"
      : "bg-yellow-500";

  const textColor =
    color === "green"
      ? "text-green-400"
      : color === "red"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div>

      <div className="flex justify-between mb-2 text-sm">

        <span className="text-gray-400">
          {label}
        </span>

        <span className={textColor}>
          {value} ({percentage.toFixed(1)}%)
        </span>

      </div>

      <div className="h-2 rounded-full bg-white/5 overflow-hidden">

        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/* ============================================
   METRIC ROW
============================================ */

function MetricRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-gray-400">
        {label}
      </span>

      <span
        className={`font-semibold ${
          positive
            ? "text-green-400"
            : label === "Worst Trade"
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </span>

    </div>
  );
}

/* ============================================
   DIRECTION ROW
============================================ */

function DirectionRow({
  title,
  trades,
  winRate,
  pnl,
  positive,
}: {
  title: string;
  trades: number;
  winRate: number;
  pnl: number;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#0b0f14] border border-white/5 p-4">

      <div className="flex justify-between items-center mb-3">

        <span
          className={`font-semibold ${
            positive
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {title}
        </span>

        <span
          className={`font-semibold ${
            pnl >= 0
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {pnl >= 0 ? "+" : ""}
          ${pnl.toFixed(2)}
        </span>

      </div>

      <div className="flex justify-between text-xs text-gray-500">

        <span>
          {trades} trades
        </span>

        <span>
          {winRate.toFixed(1)}% win rate
        </span>

      </div>

    </div>
  );
}

/* ============================================
   ANALYSIS TABLE
============================================ */

function AnalysisTable({
  title,
  icon,
  headers,
  children,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  headers: string[];
  children: React.ReactNode;
  emptyText: string;
}) {
  const hasChildren =
    Array.isArray(children)
      ? children.length > 0
      : !!children;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#11161d] overflow-hidden">

      <div className="p-5 border-b border-white/10 flex items-center gap-3">

        {icon}

        <h2 className="font-semibold">
          {title}
        </h2>

      </div>

      {!hasChildren ? (

        <div className="p-8 text-center text-sm text-gray-500">
          {emptyText}
        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-white/10 text-xs text-gray-500">

                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left font-medium"
                  >
                    {header}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody>
              {children}
            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}