"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function AIReportPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedTrades =
        localStorage.getItem(TRADE_STORAGE);

      if (savedTrades) {
        const parsedTrades = JSON.parse(savedTrades);

        if (Array.isArray(parsedTrades)) {
          setTrades(parsedTrades);
        }
      }
    } catch (error) {
      console.error(
        "Error loading trades:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  const stats = useMemo(() => {
    const totalTrades = trades.length;

    const wins = trades.filter(
      (trade) => trade.result === "WIN"
    ).length;

    const losses = trades.filter(
      (trade) => trade.result === "LOSS"
    ).length;

    const breakevens = trades.filter(
      (trade) =>
        trade.result === "BREAKEVEN"
    ).length;

    const totalPnL = trades.reduce(
      (sum, trade) => sum + Number(trade.pnl || 0),
      0
    );

    const winningPnL = trades
      .filter(
        (trade) => trade.result === "WIN"
      )
      .reduce(
        (sum, trade) =>
          sum + Number(trade.pnl || 0),
        0
      );

    const losingPnL = Math.abs(
      trades
        .filter(
          (trade) =>
            trade.result === "LOSS"
        )
        .reduce(
          (sum, trade) =>
            sum + Number(trade.pnl || 0),
          0
        )
    );

    const winRate =
      totalTrades > 0
        ? (wins / totalTrades) * 100
        : 0;

    const profitFactor =
      losingPnL > 0
        ? winningPnL / losingPnL
        : winningPnL > 0
        ? Infinity
        : 0;

    const averageWin =
      wins > 0 ? winningPnL / wins : 0;

    const averageLoss =
      losses > 0 ? losingPnL / losses : 0;

    return {
      totalTrades,
      wins,
      losses,
      breakevens,
      totalPnL,
      winningPnL,
      losingPnL,
      winRate,
      profitFactor,
      averageWin,
      averageLoss,
    };
  }, [trades]);

  const bestStrategy = useMemo(() => {
    if (!trades.length) return null;

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
        trade.strategy?.trim() ||
        "Unknown";

      if (!strategyMap[strategy]) {
        strategyMap[strategy] = {
          trades: 0,
          wins: 0,
          pnl: 0,
        };
      }

      strategyMap[strategy].trades += 1;
      strategyMap[strategy].pnl +=
        Number(trade.pnl || 0);

      if (trade.result === "WIN") {
        strategyMap[strategy].wins += 1;
      }
    });

    const strategies = Object.entries(
      strategyMap
    ).map(([name, data]) => ({
      name,
      ...data,
      winRate:
        data.trades > 0
          ? (data.wins / data.trades) *
            100
          : 0,
    }));

    return strategies.sort(
      (a, b) => b.pnl - a.pnl
    )[0];
  }, [trades]);

  const bestSession = useMemo(() => {
    if (!trades.length) return null;

    const sessionMap: Record<
      string,
      {
        trades: number;
        wins: number;
        pnl: number;
      }
    > = {};

    trades.forEach((trade) => {
      const session =
        trade.session?.trim() ||
        "Unknown";

      if (!sessionMap[session]) {
        sessionMap[session] = {
          trades: 0,
          wins: 0,
          pnl: 0,
        };
      }

      sessionMap[session].trades += 1;
      sessionMap[session].pnl +=
        Number(trade.pnl || 0);

      if (trade.result === "WIN") {
        sessionMap[session].wins += 1;
      }
    });

    const sessions = Object.entries(
      sessionMap
    ).map(([name, data]) => ({
      name,
      ...data,
      winRate:
        data.trades > 0
          ? (data.wins / data.trades) *
            100
          : 0,
    }));

    return sessions.sort(
      (a, b) => b.pnl - a.pnl
    )[0];
  }, [trades]);

  const bestSymbol = useMemo(() => {
    if (!trades.length) return null;

    const symbolMap: Record<
      string,
      {
        trades: number;
        wins: number;
        pnl: number;
      }
    > = {};

    trades.forEach((trade) => {
      const symbol =
        trade.symbol || "Unknown";

      if (!symbolMap[symbol]) {
        symbolMap[symbol] = {
          trades: 0,
          wins: 0,
          pnl: 0,
        };
      }

      symbolMap[symbol].trades += 1;
      symbolMap[symbol].pnl +=
        Number(trade.pnl || 0);

      if (trade.result === "WIN") {
        symbolMap[symbol].wins += 1;
      }
    });

    const symbols = Object.entries(
      symbolMap
    ).map(([name, data]) => ({
      name,
      ...data,
      winRate:
        data.trades > 0
          ? (data.wins / data.trades) *
            100
          : 0,
    }));

    return symbols.sort(
      (a, b) => b.pnl - a.pnl
    )[0];
  }, [trades]);

  const commonMistake = useMemo(() => {
    if (!trades.length) return null;

    const mistakes: Record<
      string,
      number
    > = {};

    trades.forEach((trade) => {
      const mistake =
        trade.mistake?.trim();

      if (mistake) {
        mistakes[mistake] =
          (mistakes[mistake] || 0) + 1;
      }
    });

    const entries = Object.entries(
      mistakes
    );

    if (!entries.length) return null;

    return entries.sort(
      (a, b) => b[1] - a[1]
    )[0];
  }, [trades]);

  const latestTrades = useMemo(() => {
    return [...trades]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 5);
  }, [trades]);

  function formatMoney(value: number) {
    return `$${value.toFixed(2)}`;
  }

  function getOverallMessage() {
    if (!trades.length) {
      return {
        title: "Start building your trading history",
        message:
          "Add some trades to TradeVault and this page will automatically analyze your performance.",
        type: "neutral",
      };
    }

    if (stats.totalPnL > 0) {
      return {
        title: "Your trading is currently profitable",
        message:
          "Your recorded trades show a positive overall P&L. Focus on protecting your edge and maintaining consistent risk.",
        type: "positive",
      };
    }

    if (stats.totalPnL < 0) {
      return {
        title: "Your trading needs improvement",
        message:
          "Your recorded trades currently show a negative P&L. Review your losing trades, mistakes and risk management before increasing position size.",
        type: "negative",
      };
    }

    return {
      title: "Your trading is currently at breakeven",
      message:
        "Your recorded trades are around breakeven. Focus on improving trade selection and consistency.",
      type: "neutral",
    };
  }

  const overall = getOverallMessage();

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#0d1117] text-white p-6">
        <div className="flex items-center justify-center min-h-[70vh]">
          <p className="text-gray-500">
            Loading AI Report...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl">
            🤖
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              AI Trading Report
            </h1>

            <p className="text-gray-500 mt-1">
              Intelligent analysis of your
              TradeVault performance
            </p>
          </div>
        </div>
      </div>

      {/* Overall AI Summary */}
      <section
        className={`rounded-xl border p-5 mb-6 ${
          overall.type === "positive"
            ? "bg-green-500/5 border-green-500/20"
            : overall.type === "negative"
            ? "bg-red-500/5 border-red-500/20"
            : "bg-blue-500/5 border-blue-500/20"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-2xl">
            {overall.type ===
            "positive"
              ? "📈"
              : overall.type ===
                "negative"
              ? "⚠️"
              : "🧠"}
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {overall.title}
            </h2>

            <p className="text-gray-400 text-sm mt-2 leading-6">
              {overall.message}
            </p>
          </div>
        </div>
      </section>

      {/* Main Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            Total Trades
          </p>

          <p className="text-3xl font-bold mt-2">
            {stats.totalTrades}
          </p>

          <p className="text-xs text-gray-600 mt-2">
            {stats.wins} wins ·{" "}
            {stats.losses} losses
          </p>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            Win Rate
          </p>

          <p className="text-3xl font-bold mt-2">
            {stats.winRate.toFixed(1)}%
          </p>

          <p className="text-xs text-gray-600 mt-2">
            {stats.breakevens} breakevens
          </p>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            Total P&L
          </p>

          <p
            className={`text-3xl font-bold mt-2 ${
              stats.totalPnL > 0
                ? "text-green-400"
                : stats.totalPnL < 0
                ? "text-red-400"
                : "text-white"
            }`}
          >
            {formatMoney(stats.totalPnL)}
          </p>

          <p className="text-xs text-gray-600 mt-2">
            From recorded trades
          </p>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            Profit Factor
          </p>

          <p className="text-3xl font-bold mt-2">
            {stats.profitFactor ===
            Infinity
              ? "∞"
              : stats.profitFactor.toFixed(
                  2
                )}
          </p>

          <p className="text-xs text-gray-600 mt-2">
            Gross profit ÷ gross loss
          </p>
        </div>
      </section>

      {/* Performance Analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Best Strategy */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <span>🎯</span>

            <h2 className="text-lg font-semibold">
              Best Strategy
            </h2>
          </div>

          {bestStrategy ? (
            <div>
              <p className="text-2xl font-bold">
                {bestStrategy.name}
              </p>

              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <p className="text-xs text-gray-500">
                    Trades
                  </p>

                  <p className="font-semibold mt-1">
                    {bestStrategy.trades}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Win Rate
                  </p>

                  <p className="font-semibold mt-1">
                    {bestStrategy.winRate.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    P&L
                  </p>

                  <p
                    className={`font-semibold mt-1 ${
                      bestStrategy.pnl >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatMoney(
                      bestStrategy.pnl
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Add trades with strategy names
              to see this analysis.
            </p>
          )}
        </div>

        {/* Best Session */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <span>⏰</span>

            <h2 className="text-lg font-semibold">
              Best Session
            </h2>
          </div>

          {bestSession ? (
            <div>
              <p className="text-2xl font-bold">
                {bestSession.name}
              </p>

              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <p className="text-xs text-gray-500">
                    Trades
                  </p>

                  <p className="font-semibold mt-1">
                    {bestSession.trades}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Win Rate
                  </p>

                  <p className="font-semibold mt-1">
                    {bestSession.winRate.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    P&L
                  </p>

                  <p
                    className={`font-semibold mt-1 ${
                      bestSession.pnl >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatMoney(
                      bestSession.pnl
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Add session information to your
              trades to see this analysis.
            </p>
          )}
        </div>
      </section>

      {/* Symbol + Risk Analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Best Symbol */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <span>📊</span>

            <h2 className="text-lg font-semibold">
              Best Performing Symbol
            </h2>
          </div>

          {bestSymbol ? (
            <div>
              <p className="text-2xl font-bold">
                {bestSymbol.name}
              </p>

              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <p className="text-xs text-gray-500">
                    Trades
                  </p>

                  <p className="font-semibold mt-1">
                    {bestSymbol.trades}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Win Rate
                  </p>

                  <p className="font-semibold mt-1">
                    {bestSymbol.winRate.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    P&L
                  </p>

                  <p
                    className={`font-semibold mt-1 ${
                      bestSymbol.pnl >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatMoney(
                      bestSymbol.pnl
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Add trades to see symbol
              performance.
            </p>
          )}
        </div>

        {/* Average Win/Loss */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <span>💰</span>

            <h2 className="text-lg font-semibold">
              Risk & Reward
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500">
                Average Win
              </p>

              <p className="text-2xl font-bold text-green-400 mt-2">
                {formatMoney(
                  stats.averageWin
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Average Loss
              </p>

              <p className="text-2xl font-bold text-red-400 mt-2">
                {formatMoney(
                  stats.averageLoss
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Average win/loss ratio
            </p>

            <p className="font-semibold mt-1">
              {stats.averageLoss > 0
                ? (
                    stats.averageWin /
                    stats.averageLoss
                  ).toFixed(2)
                : "--"}
            </p>
          </div>
        </div>
      </section>

      {/* AI Insights */}
      <section className="bg-[#161b22] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <span>🧠</span>

          <h2 className="text-lg font-semibold">
            AI Insights
          </h2>
        </div>

        <div className="space-y-3">
          {stats.winRate >= 50 &&
            stats.totalTrades > 0 && (
              <div className="flex gap-3 bg-green-500/5 border border-green-500/10 rounded-lg p-4">
                <span>✅</span>

                <p className="text-sm text-gray-400">
                  Your win rate is above 50%.
                  Continue focusing on
                  consistency rather than
                  increasing risk too quickly.
                </p>
              </div>
            )}

          {stats.winRate < 50 &&
            stats.totalTrades > 0 && (
              <div className="flex gap-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-4">
                <span>⚠️</span>

                <p className="text-sm text-gray-400">
                  Your win rate is below 50%.
                  Review your losing setups
                  and look for patterns before
                  changing your entire strategy.
                </p>
              </div>
            )}

          {bestStrategy && (
            <div className="flex gap-3 bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
              <span>🎯</span>

              <p className="text-sm text-gray-400">
                <span className="text-white font-medium">
                  {bestStrategy.name}
                </span>{" "}
                is currently your best
                performing strategy based on
                recorded P&L.
              </p>
            </div>
          )}

          {bestSession && (
            <div className="flex gap-3 bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
              <span>⏰</span>

              <p className="text-sm text-gray-400">
                Your{" "}
                <span className="text-white font-medium">
                  {bestSession.name}
                </span>{" "}
                session has produced your
                strongest recorded performance.
              </p>
            </div>
          )}

          {commonMistake && (
            <div className="flex gap-3 bg-red-500/5 border border-red-500/10 rounded-lg p-4">
              <span>🔍</span>

              <p className="text-sm text-gray-400">
                Your most frequently recorded
                mistake is{" "}
                <span className="text-white font-medium">
                  "{commonMistake[0]}"
                </span>
                . Review this pattern in your
                losing trades.
              </p>
            </div>
          )}

          {stats.totalTrades === 0 && (
            <div className="flex gap-3 bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
              <span>💡</span>

              <p className="text-sm text-gray-400">
                Start adding trades with
                strategy, session, psychology
                and mistake information. The
                more complete your journal is,
                the more useful this analysis
                becomes.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Trades */}
      <section className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold">
            Recent Trades
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Latest trades used in the report
          </p>
        </div>

        {latestTrades.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No trades recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-left">
                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Symbol
                  </th>

                  <th className="px-5 py-3">
                    Type
                  </th>

                  <th className="px-5 py-3">
                    Result
                  </th>

                  <th className="px-5 py-3 text-right">
                    P&L
                  </th>
                </tr>
              </thead>

              <tbody>
                {latestTrades.map(
                  (trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-gray-800/60 last:border-0"
                    >
                      <td className="px-5 py-4 text-gray-400">
                        {trade.date}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {trade.symbol}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            trade.type ===
                            "LONG"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {trade.type}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            trade.result ===
                            "WIN"
                              ? "text-green-400"
                              : trade.result ===
                                "LOSS"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }
                        >
                          {trade.result}
                        </span>
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-medium ${
                          trade.pnl > 0
                            ? "text-green-400"
                            : trade.pnl < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {formatMoney(
                          Number(
                            trade.pnl || 0
                          )
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}