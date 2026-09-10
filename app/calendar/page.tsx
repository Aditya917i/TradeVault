"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Trophy,
  X,
} from "lucide-react";

import type { Trade } from "../AddTradeModal";

const TRADE_STORAGE = "tradevault-trades";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export default function CalendarPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [currentDate, setCurrentDate] = useState(
    () => new Date()
  );

  const [selectedDate, setSelectedDate] = useState<
    string | null
  >(null);

  // ============================================
  // LOAD TRADES FROM LOCAL STORAGE
  // ============================================

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

  // ============================================
  // CURRENT MONTH
  // ============================================

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ============================================
  // GET TRADES FOR CURRENT MONTH
  // ============================================

  const monthTrades = useMemo(() => {
    return trades.filter((trade) => {
      if (!trade.date) return false;

      const date = new Date(
        `${trade.date.slice(0, 10)}T12:00:00`
      );

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    });
  }, [trades, year, month]);

  // ============================================
  // MONTHLY STATISTICS
  // ============================================

  const monthlyPnL = monthTrades.reduce(
    (total, trade) =>
      total + Number(trade.pnl || 0),
    0
  );

  const monthlyWins = monthTrades.filter(
    (trade) => trade.result === "WIN"
  ).length;

  const monthlyLosses = monthTrades.filter(
    (trade) => trade.result === "LOSS"
  ).length;

  const monthlyBreakeven = monthTrades.filter(
    (trade) => trade.result === "BREAKEVEN"
  ).length;

  const monthlyWinRate =
    monthTrades.length > 0
      ? (monthlyWins / monthTrades.length) * 100
      : 0;

  // ============================================
  // DAILY STATISTICS
  // ============================================

  const dailyStats = useMemo(() => {
    const stats: Record<
      string,
      {
        pnl: number;
        trades: number;
        wins: number;
        losses: number;
        breakeven: number;
      }
    > = {};

    monthTrades.forEach((trade) => {
      const dateKey = normalizeDate(trade.date);

      if (!stats[dateKey]) {
        stats[dateKey] = {
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
        };
      }

      stats[dateKey].pnl += Number(
        trade.pnl || 0
      );

      stats[dateKey].trades += 1;

      if (trade.result === "WIN") {
        stats[dateKey].wins += 1;
      }

      if (trade.result === "LOSS") {
        stats[dateKey].losses += 1;
      }

      if (trade.result === "BREAKEVEN") {
        stats[dateKey].breakeven += 1;
      }
    });

    return stats;
  }, [monthTrades]);

  // ============================================
  // BEST DAY
  // ============================================

  const dailyEntries = Object.entries(
    dailyStats
  );

  const bestDay =
    dailyEntries.length > 0
      ? dailyEntries.reduce((best, current) =>
          current[1].pnl > best[1].pnl
            ? current
            : best
        )
      : null;

  // ============================================
  // WORST DAY
  // ============================================

  const worstDay =
    dailyEntries.length > 0
      ? dailyEntries.reduce((worst, current) =>
          current[1].pnl < worst[1].pnl
            ? current
            : worst
        )
      : null;

  // ============================================
  // SELECTED DAY TRADES
  // ============================================

  const selectedTrades = selectedDate
    ? trades.filter(
        (trade) =>
          normalizeDate(trade.date) ===
          selectedDate
      )
    : [];

  // ============================================
  // CALENDAR DAYS
  // ============================================

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const calendarCells: (
    | number
    | null
  )[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  // ============================================
  // MONTH NAVIGATION
  // ============================================

  const previousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    );

    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    );

    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();

    setCurrentDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDate(
      normalizeDate(
        `${today.getFullYear()}-${String(
          today.getMonth() + 1
        ).padStart(2, "0")}-${String(
          today.getDate()
        ).padStart(2, "0")}`
      )
    );
  };

  // ============================================
  // FORMAT P&L
  // ============================================

  const formatPnL = (value: number) => {
    if (value > 0) {
      return `+$${value.toFixed(2)}`;
    }

    if (value < 0) {
      return `-$${Math.abs(value).toFixed(2)}`;
    }

    return "$0.00";
  };

  // ============================================
  // FORMAT DATE
  // ============================================

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "No date";
    }

    const date = new Date(
      `${dateString.slice(0, 10)}T12:00:00`
    );

    return date.toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // ============================================
  // GET CALENDAR DATE KEY
  // ============================================

  const getCalendarDateKey = (day: number) => {
    return `${year}-${String(
      month + 1
    ).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  // ============================================
  // LOADING
  // ============================================

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#0b0f14] text-white p-6">

        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-10 text-center">

          <p className="text-gray-400">
            Loading calendar...
          </p>

        </div>

      </main>
    );
  }

  // ============================================
  // MAIN PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white p-4 md:p-6">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">

            <CalendarDays className="w-5 h-5 text-blue-400" />

          </div>

          <div>

            <h1 className="text-2xl md:text-3xl font-bold">
              Trading Calendar
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Track your trading performance day by day.
            </p>

          </div>

        </div>

      </div>

      {/* ========================================
          MONTH NAVIGATION
      ======================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#11161d] p-4 mb-6">

        <div className="flex items-center justify-between">

          <button
            onClick={previousMonth}
            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">

            <h2 className="text-xl font-bold">
              {MONTHS[month]} {year}
            </h2>

            <button
              onClick={goToToday}
              className="text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              Go to today
            </button>

          </div>

          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

      </div>

      {/* ========================================
          MONTHLY STATISTICS
      ======================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        <StatCard
          title="Trades"
          value={String(monthTrades.length)}
          icon={
            <BarChart3 className="w-5 h-5 text-blue-400" />
          }
        />

        <StatCard
          title="Monthly P&L"
          value={formatPnL(monthlyPnL)}
          icon={
            <TrendingUp className="w-5 h-5 text-green-400" />
          }
          valueClass={
            monthlyPnL >= 0
              ? "text-green-400"
              : "text-red-400"
          }
        />

        <StatCard
          title="Win Rate"
          value={`${monthlyWinRate.toFixed(1)}%`}
          icon={
            <Target className="w-5 h-5 text-blue-400" />
          }
        />

        <StatCard
          title="Best Day"
          value={
            bestDay
              ? formatPnL(bestDay[1].pnl)
              : "$0.00"
          }
          icon={
            <Trophy className="w-5 h-5 text-green-400" />
          }
          valueClass="text-green-400"
        />

        <StatCard
          title="Worst Day"
          value={
            worstDay
              ? formatPnL(worstDay[1].pnl)
              : "$0.00"
          }
          icon={
            <TrendingDown className="w-5 h-5 text-red-400" />
          }
          valueClass="text-red-400"
        />

      </div>

      {/* ========================================
          CALENDAR
      ======================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#11161d] overflow-hidden mb-6">

        {/* WEEKDAYS */}

        <div className="grid grid-cols-7 border-b border-white/10">

          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-xs font-semibold text-gray-500"
            >
              {day}
            </div>
          ))}

        </div>

        {/* CALENDAR CELLS */}

        <div className="grid grid-cols-7">

          {calendarCells.map(
            (day, index) => {

              {/* EMPTY CELL */}

              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[110px] border-b border-r border-white/5 bg-[#0b0f14]/50"
                  />
                );
              }

              const dateKey =
                getCalendarDateKey(day);

              const stats =
                dailyStats[dateKey];

              const isSelected =
                selectedDate === dateKey;

              let background =
                "bg-[#11161d]";

              if (stats) {
                if (stats.pnl > 0) {
                  background =
                    "bg-green-500/[0.08]";
                } else if (stats.pnl < 0) {
                  background =
                    "bg-red-500/[0.08]";
                } else {
                  background =
                    "bg-yellow-500/[0.06]";
                }
              }

              return (
                <button
                  key={day}
                  onClick={() =>
                    setSelectedDate(dateKey)
                  }
                  className={`
                    min-h-[110px]
                    p-2
                    border-b
                    border-r
                    border-white/5
                    text-left
                    transition
                    hover:bg-white/[0.05]
                    ${background}
                    ${
                      isSelected
                        ? "ring-2 ring-inset ring-blue-500"
                        : ""
                    }
                  `}
                >

                  {/* DAY NUMBER */}

                  <div className="flex items-center justify-between">

                    <span
                      className={`text-sm font-semibold ${
                        stats
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {day}
                    </span>

                    {stats && (
                      <span className="text-[10px] text-gray-500">
                        {stats.trades} trade
                        {stats.trades !== 1
                          ? "s"
                          : ""}
                      </span>
                    )}

                  </div>

                  {/* DAY PERFORMANCE */}

                  {stats ? (
                    <div className="mt-4">

                      <p
                        className={`text-sm font-bold ${
                          stats.pnl > 0
                            ? "text-green-400"
                            : stats.pnl < 0
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {formatPnL(stats.pnl)}
                      </p>

                      <div className="flex gap-2 mt-2 text-[10px]">

                        {stats.wins > 0 && (
                          <span className="text-green-400">
                            W {stats.wins}
                          </span>
                        )}

                        {stats.losses > 0 && (
                          <span className="text-red-400">
                            L {stats.losses}
                          </span>
                        )}

                        {stats.breakeven > 0 && (
                          <span className="text-yellow-400">
                            BE {stats.breakeven}
                          </span>
                        )}

                      </div>

                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-600 mt-4">
                      No trades
                    </p>
                  )}

                </button>
              );
            }
          )}

        </div>

      </div>

      {/* ========================================
          LEGEND
      ======================================== */}

      <div className="flex flex-wrap gap-5 text-xs text-gray-500 mb-6">

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-500/30" />
          Profitable day
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500/30" />
          Losing day
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-yellow-500/30" />
          Breakeven
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-blue-500" />
          Selected day
        </div>

      </div>

      {/* ========================================
          MONTHLY RESULTS
      ======================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#11161d] p-5 mb-6">

        <h2 className="font-semibold mb-5">
          Monthly Results
        </h2>

        <div className="grid grid-cols-3 gap-4">

          <ResultBox
            label="Wins"
            value={monthlyWins}
            className="text-green-400"
          />

          <ResultBox
            label="Losses"
            value={monthlyLosses}
            className="text-red-400"
          />

          <ResultBox
            label="Breakeven"
            value={monthlyBreakeven}
            className="text-yellow-400"
          />

        </div>

      </div>

      {/* ========================================
          SELECTED DAY
      ======================================== */}

      {selectedDate && (
        <div className="rounded-2xl border border-blue-500/20 bg-[#11161d] overflow-hidden mb-6">

          {/* SELECTED DAY HEADER */}

          <div className="p-5 border-b border-white/10 flex items-center justify-between">

            <div>

              <h2 className="font-semibold">
                Selected Day
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                {formatDate(selectedDate)}
              </p>

            </div>

            <button
              onClick={() =>
                setSelectedDate(null)
              }
              className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

          {/* NO TRADES */}

          {selectedTrades.length === 0 ? (

            <div className="p-8 text-center">

              <CalendarDays className="w-8 h-8 text-gray-600 mx-auto mb-3" />

              <p className="text-gray-500 text-sm">
                No trades on this day.
              </p>

            </div>

          ) : (

            /* TRADES TABLE */

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-white/10 text-xs text-gray-500">

                    <th className="px-5 py-3 text-left">
                      Symbol
                    </th>

                    <th className="px-5 py-3 text-left">
                      Direction
                    </th>

                    <th className="px-5 py-3 text-left">
                      Entry
                    </th>

                    <th className="px-5 py-3 text-left">
                      Exit
                    </th>

                    <th className="px-5 py-3 text-left">
                      Result
                    </th>

                    <th className="px-5 py-3 text-right">
                      P&L
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {selectedTrades.map(
                    (trade) => (

                      <tr
                        key={trade.id}
                        className="border-b border-white/5"
                      >

                        {/* SYMBOL */}

                        <td className="px-5 py-4 font-semibold">
                          {trade.symbol}
                        </td>

                        {/* DIRECTION */}

                        <td className="px-5 py-4">

                          <span
                            className={`px-2 py-1 rounded-md text-xs ${
                              trade.type ===
                              "LONG"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {trade.type}
                          </span>

                        </td>

                        {/* ENTRY */}

                        <td className="px-5 py-4 text-sm text-gray-400">
                          {trade.entry}
                        </td>

                        {/* EXIT */}

                        <td className="px-5 py-4 text-sm text-gray-400">
                          {trade.exit}
                        </td>

                        {/* RESULT */}

                        <td className="px-5 py-4">

                          <span
                            className={`text-xs font-semibold ${
                              trade.result ===
                              "WIN"
                                ? "text-green-400"
                                : trade.result ===
                                  "LOSS"
                                ? "text-red-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {trade.result}
                          </span>

                        </td>

                        {/* PNL */}

                        <td
                          className={`px-5 py-4 text-right font-semibold ${
                            Number(
                              trade.pnl || 0
                            ) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatPnL(
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

        </div>
      )}

    </main>
  );
}

// ============================================
// STAT CARD
// ============================================

function StatCard({
  title,
  value,
  icon,
  valueClass = "text-white",
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11161d] p-4">

      <div className="flex items-center justify-between mb-3">

        <span className="text-xs text-gray-400">
          {title}
        </span>

        {icon}

      </div>

      <p
        className={`text-xl md:text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>

    </div>
  );
}

// ============================================
// RESULT BOX
// ============================================

function ResultBox({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="bg-[#0b0f14] rounded-xl border border-white/5 p-4 text-center">

      <p
        className={`text-2xl font-bold ${className}`}
      >
        {value}
      </p>

      <p className="text-xs text-gray-500 mt-1">
        {label}
      </p>

    </div>
  );
}

// ============================================
// NORMALIZE DATE
// ============================================

function normalizeDate(dateString: string) {
  if (!dateString) {
    return "";
  }

  // If date is already YYYY-MM-DD,
  // keep it exactly as it is.
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateString.slice(0, 10)
    )
  ) {
    return dateString.slice(0, 10);
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString.slice(0, 10);
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}