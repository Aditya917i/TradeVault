"use client";

import { useEffect, useMemo, useState } from "react";
import AddTradeModal from "./AddTradeModal";

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

type Period = "1D" | "1W" | "1M" | "3M" | "ALL";

const STORAGE_KEY = "tradevault-trades";

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [period, setPeriod] = useState<Period>("ALL");
  const [loaded, setLoaded] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);

  /* ========================================================
     LOAD TRADES
  ======================================================== */

  useEffect(() => {
    loadTrades();

    const handleStorage = () => {
      loadTrades();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function loadTrades() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setTrades(parsed);
        }
      } else {
        setTrades([]);
      }
    } catch (error) {
      console.error("Error loading trades:", error);
      setTrades([]);
    }

    setLoaded(true);
  }

  /* ========================================================
     FILTERED TRADES
  ======================================================== */

  const filteredTrades = useMemo(() => {
    if (period === "ALL") {
      return trades;
    }

    const now = new Date();
    const cutoff = new Date(now);

    if (period === "1D") {
      cutoff.setDate(now.getDate() - 1);
    }

    if (period === "1W") {
      cutoff.setDate(now.getDate() - 7);
    }

    if (period === "1M") {
      cutoff.setMonth(now.getMonth() - 1);
    }

    if (period === "3M") {
      cutoff.setMonth(now.getMonth() - 3);
    }

    return trades.filter((trade) => {
      const date = new Date(trade.date);

      return (
        !Number.isNaN(date.getTime()) &&
        date >= cutoff
      );
    });
  }, [trades, period]);

  /* ========================================================
     STATS
  ======================================================== */

  const stats = useMemo(() => {
    const sorted = [...filteredTrades].sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    let runningPnl = 0;

    const equity = sorted.map((trade) => {
      runningPnl += Number(trade.pnl || 0);

      return {
        ...trade,
        equity: runningPnl,
      };
    });

    const wins = filteredTrades.filter(
      (trade) => trade.result === "WIN"
    );

    const losses = filteredTrades.filter(
      (trade) => trade.result === "LOSS"
    );

    const breakevens = filteredTrades.filter(
      (trade) => trade.result === "BREAKEVEN"
    );

    const totalPnl = filteredTrades.reduce(
      (sum, trade) =>
        sum + Number(trade.pnl || 0),
      0
    );

    const grossProfit = wins.reduce(
      (sum, trade) =>
        sum + Math.max(Number(trade.pnl || 0), 0),
      0
    );

    const grossLoss = Math.abs(
      losses.reduce(
        (sum, trade) =>
          sum + Math.min(Number(trade.pnl || 0), 0),
        0
      )
    );

    const winRate =
      filteredTrades.length > 0
        ? (wins.length / filteredTrades.length) * 100
        : 0;

    const profitFactor =
      grossLoss > 0
        ? grossProfit / grossLoss
        : grossProfit > 0
        ? Infinity
        : 0;

    let peak = 0;
    let maxDrawdown = 0;

    equity.forEach((point) => {
      peak = Math.max(peak, point.equity);

      const drawdown =
        peak - point.equity;

      maxDrawdown = Math.max(
        maxDrawdown,
        drawdown
      );
    });

    return {
      equity,
      totalPnl,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      winRate,
      profitFactor,
      maxDrawdown,
    };
  }, [filteredTrades]);

  /* ========================================================
     RECENT TRADES
  ======================================================== */

  const recentTrades = useMemo(() => {
    return [...trades]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 5);
  }, [trades]);

  /* ========================================================
     TOP PERFORMERS
  ======================================================== */

  const topPerformers = useMemo(() => {
    const symbols: Record<
      string,
      {
        pnl: number;
        trades: number;
      }
    > = {};

    trades.forEach((trade) => {
      if (!symbols[trade.symbol]) {
        symbols[trade.symbol] = {
          pnl: 0,
          trades: 0,
        };
      }

      symbols[trade.symbol].pnl += Number(
        trade.pnl || 0
      );

      symbols[trade.symbol].trades += 1;
    });

    return Object.entries(symbols)
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .slice(0, 4);
  }, [trades]);

  /* ========================================================
     MONTHLY P&L
  ======================================================== */

  const monthlyPnl = useMemo(() => {
    const months: Record<string, number> = {};

    trades.forEach((trade) => {
      const date = new Date(trade.date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

      months[key] =
        (months[key] || 0) +
        Number(trade.pnl || 0);
    });

    return months;
  }, [trades]);

  const currentMonth = new Date();

  const currentMonthKey =
    `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}`;

  const currentMonthPnl =
    monthlyPnl[currentMonthKey] || 0;

  /* ========================================================
     LOADING
  ======================================================== */

  if (!loaded) {
    return (
      <div className="dashboard-loading">
        Loading TradeVault...
      </div>
    );
  }

  /* ========================================================
     DASHBOARD
  ======================================================== */

  return (
    <main className="dashboard">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="dashboard-header">

        <div className="header-title">

          <h1>Dashboard</h1>

          <span>
            {new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "short",
                month: "short",
                day: "numeric",
              }
            )}
          </span>

        </div>

        <div className="dashboard-search">

          <span>⌕</span>

          <input
            placeholder="Search..."
            readOnly
          />

          <small>Ctrl+K</small>

        </div>

        <div className="header-actions">

          <button>
            ◐
          </button>

          {/* ADD TRADE BUTTON */}

          <button
            className="add-btn"
            onClick={() =>
              setShowAddTrade(true)
            }
            title="Add Trade"
          >
            +
          </button>

          <div className="header-time">

            ◷{" "}
            {new Date().toLocaleTimeString(
              "en-US",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}

          </div>

          <button>
            ♧
          </button>

          <div className="header-avatar">
            A
          </div>

        </div>

      </header>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="dashboard-content">

        {/* ==================================================
            STAT CARDS
        ================================================== */}

        <div className="stat-grid">

          <StatCard
            title="TOTAL P&L"
            value={sumPnl(trades)}
            subtitle={`${trades.length} trades`}
            icon="▣"
          />

          <StatCard
            title="UNREALIZED"
            value={0}
            subtitle="0 open positions"
            icon="〽"
          />

          <StatCard
            title="REALIZED"
            value={sumPnl(trades)}
            subtitle={`${trades.length} closed trades`}
            icon="▣"
          />

          <div className="stat-card">

            <div className="stat-top">

              <span>
                WIN RATE
              </span>

              <div className="stat-icon">
                ♙
              </div>

            </div>

            <strong className="stat-number">

              {trades.length > 0
                ? (
                    (trades.filter(
                      (trade) =>
                        trade.result ===
                        "WIN"
                    ).length /
                      trades.length) *
                    100
                  ).toFixed(0)
                : "0"}
              %

            </strong>

            <div className="win-bar">

              <div
                style={{
                  width: `${
                    trades.length > 0
                      ? (
                          (trades.filter(
                            (trade) =>
                              trade.result ===
                              "WIN"
                          ).length /
                            trades.length) *
                          100
                        )
                      : 0
                  }%`,
                }}
              />

            </div>

          </div>

        </div>

        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <div className="main-grid">

          {/* =================================================
              EQUITY CURVE
          ================================================= */}

          <section className="panel performance-card">

            <div className="panel-header">

              <div>

                <div className="panel-label">
                  ↘ PERFORMANCE
                </div>

                <div
                  className={`performance-value ${
                    stats.totalPnl < 0
                      ? "performance-loss"
                      : ""
                  }`}
                >

                  {formatMoney(
                    stats.totalPnl
                  )}

                  <span className="performance-percent">

                    {stats.totalPnl >= 0
                      ? "↑"
                      : "↓"}{" "}
                    {Math.abs(
                      stats.totalPnl
                    ).toFixed(2)}

                  </span>

                </div>

              </div>

              <div className="period-buttons">

                {[
                  "1D",
                  "1W",
                  "1M",
                  "3M",
                  "ALL",
                ].map((item) => (

                  <button
                    key={item}
                    className={
                      period === item
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPeriod(
                        item as Period
                      )
                    }
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>

            <div className="equity-container">

              {stats.equity.length === 0 ? (

                <div className="empty-chart">

                  <strong>
                    No trades yet
                  </strong>

                  <span>
                    Add a trade using the + button above.
                  </span>

                </div>

              ) : (

                <EquityCurve
                  data={stats.equity}
                />

              )}

            </div>

          </section>

          {/* =================================================
              MONTHLY P&L
          ================================================= */}

          <section className="panel monthly-card">

            <div className="monthly-header">

              <h2>
                Monthly P&L
              </h2>

              <div className="month-title">

                Monthly:

                <strong>
                  {formatMoney(
                    currentMonthPnl
                  )}
                </strong>

                <button>
                  ‹
                </button>

                <span>
                  {currentMonth.toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>

                <button>
                  ›
                </button>

              </div>

            </div>

            <MonthlyCalendar
              trades={trades}
              month={currentMonth}
            />

          </section>

        </div>

        {/* ==================================================
            LOWER GRID
        ================================================== */}

        <div className="lower-grid">

          {/* OPEN POSITIONS */}

          <section className="panel lower-card">

            <h2>
              Open Positions
            </h2>

            <div className="empty-box">

              <div className="empty-icon">
                ▤
              </div>

              <span>
                No open positions
              </span>

            </div>

            <button className="view-link">
              View All Positions →
            </button>

          </section>

          {/* RECENT ACTIVITY */}

          <section className="panel lower-card">

            <div className="lower-title-row">

              <h2>
                Recent Activity
              </h2>

              <span className="trade-count">
                {recentTrades.length} trades
              </span>

            </div>

            {recentTrades.length === 0 ? (

              <div className="empty-box">

                <div className="empty-icon">
                  ◷
                </div>

                <span>
                  No recent activity
                </span>

              </div>

            ) : (

              <div className="activity-list">

                {recentTrades.map(
                  (trade) => (

                    <div
                      className="activity-row"
                      key={trade.id}
                    >

                      <div className="activity-left">

                        <strong>
                          {trade.symbol}
                        </strong>

                        <span>
                          {formatShortDate(
                            trade.date
                          )}
                        </span>

                      </div>

                      <span className="lot-size">
                        {trade.lotSize} lots
                      </span>

                      <strong
                        className={
                          Number(
                            trade.pnl
                          ) >= 0
                            ? "profit"
                            : "loss"
                        }
                      >
                        {formatMoney(
                          Number(
                            trade.pnl
                          )
                        )}
                      </strong>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

          {/* TOP PERFORMERS */}

          <section className="panel lower-card">

            <h2>
              Top Performers
            </h2>

            {topPerformers.length === 0 ? (

              <div className="empty-box">

                <span>
                  No trading data yet
                </span>

              </div>

            ) : (

              <div className="performer-list">

                {topPerformers.map(
                  ([symbol, data], index) => (

                    <div
                      className="performer"
                      key={symbol}
                    >

                      <div className="performer-rank">
                        #{index + 1}
                      </div>

                      <div className="performer-name">

                        <strong>
                          {symbol}
                        </strong>

                        <span>
                          {data.trades} trade
                          {data.trades !== 1
                            ? "s"
                            : ""}
                        </span>

                      </div>

                      <strong
                        className={
                          data.pnl >= 0
                            ? "profit"
                            : "loss"
                        }
                      >
                        {formatMoney(
                          data.pnl
                        )}
                      </strong>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </div>

        {/* ==================================================
            QUICK STATS
        ================================================== */}

        <section className="panel quick-stats">

          <h2>
            Quick Stats
          </h2>

          <div className="quick-grid">

            <QuickStat
              title="Total Trades"
              value={trades.length}
            />

            <QuickStat
              title="Winning Trades"
              value={stats.wins}
            />

            <QuickStat
              title="Losing Trades"
              value={stats.losses}
            />

            <QuickStat
              title="Breakeven"
              value={stats.breakevens}
            />

            <QuickStat
              title="Win Rate"
              value={`${stats.winRate.toFixed(
                1
              )}%`}
            />

            <QuickStat
              title="Profit Factor"
              value={
                stats.profitFactor === Infinity
                  ? "∞"
                  : stats.profitFactor.toFixed(
                      2
                    )
              }
            />

            <QuickStat
              title="Max Drawdown"
              value={formatMoney(
                stats.maxDrawdown
              )}
            />

            <QuickStat
              title="Best Trade"
              value={
                trades.length > 0
                  ? formatMoney(
                      Math.max(
                        ...trades.map(
                          (trade) =>
                            Number(
                              trade.pnl || 0
                            )
                        )
                      )
                    )
                  : "$0.00"
              }
            />

          </div>

        </section>

      </div>

      {/* ====================================================
          ADD TRADE MODAL
      ==================================================== */}

      {showAddTrade && (
        <AddTradeModal
          onClose={() => {
            setShowAddTrade(false);

            // Reload dashboard data
            loadTrades();
          }}
        />
      )}

    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="stat-card">

      <div className="stat-top">

        <span>
          {title}
        </span>

        <div className="stat-icon">
          {icon}
        </div>

      </div>

      <strong
        className={`stat-number ${
          value < 0 ? "loss" : ""
        }`}
      >
        {formatMoney(value)}
      </strong>

      <span className="stat-subtitle">
        → {subtitle}
      </span>

    </div>
  );
}

/* =========================================================
   QUICK STAT
========================================================= */

function QuickStat({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="quick-stat">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   EQUITY CURVE
========================================================= */

function EquityCurve({
  data,
}: {
  data: Array<
    Trade & {
      equity: number;
    }
  >;
}) {
  const width = 1000;
  const height = 330;

  const left = 58;
  const right = 55;
  const top = 22;
  const bottom = 38;

  const graphWidth =
    width - left - right;

  const graphHeight =
    height - top - bottom;

  const values = data.map(
    (item) => item.equity
  );

  const minValue = Math.min(
    0,
    ...values
  );

  const maxValue = Math.max(
    0,
    ...values
  );

  const padding = Math.max(
    (maxValue - minValue) * 0.12,
    10
  );

  const min =
    minValue - padding;

  const max =
    maxValue + padding;

  const range =
    Math.max(max - min, 1);

  const getX = (index: number) => {
    if (data.length === 1) {
      return (
        left +
        graphWidth / 2
      );
    }

    return (
      left +
      (index /
        (data.length - 1)) *
        graphWidth
    );
  };

  const getY = (value: number) => {
    return (
      top +
      ((max - value) /
        range) *
        graphHeight
    );
  };

  const zeroY = getY(0);

  let smoothPath = "";

  if (data.length === 1) {

    smoothPath = `M ${getX(
      0
    )} ${getY(
      data[0].equity
    )}`;

  } else {

    smoothPath = `M ${getX(
      0
    )} ${getY(
      data[0].equity
    )}`;

    for (
      let i = 1;
      i < data.length;
      i++
    ) {

      const previousX =
        getX(i - 1);

      const previousY =
        getY(
          data[i - 1].equity
        );

      const currentX =
        getX(i);

      const currentY =
        getY(
          data[i].equity
        );

      const middleX =
        (previousX +
          currentX) /
        2;

      smoothPath += `
        Q ${middleX} ${previousY}
          ${currentX} ${currentY}
      `;
    }
  }

  const areaPath =
    data.length === 1
      ? `
        M ${getX(0)} ${zeroY}
        L ${getX(0)} ${getY(
          data[0].equity
        )}
        L ${getX(0)} ${zeroY}
        Z
      `
      : `
        M ${getX(0)} ${zeroY}
        L ${getX(0)} ${getY(
          data[0].equity
        )}
        ${smoothPath.replace(
          /^M[^ ]+ [^ ]+/,
          ""
        )}
        L ${getX(
          data.length - 1
        )} ${zeroY}
        Z
      `;

  const finalEquity =
    data[data.length - 1].equity;

  const isProfit =
    finalEquity >= 0;

  const chartLabels =
    createChartLabels(data);

  return (
    <div className="equity-chart">

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >

        <defs>

          <linearGradient
            id="equityFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >

            <stop
              offset="0%"
              stopColor="#1687ff"
              stopOpacity="0.30"
            />

            <stop
              offset="60%"
              stopColor="#1687ff"
              stopOpacity="0.10"
            />

            <stop
              offset="100%"
              stopColor="#1687ff"
              stopOpacity="0"
            />

          </linearGradient>

          <filter
            id="equityGlow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >

            <feGaussianBlur
              stdDeviation="2"
              result="blur"
            />

            <feMerge>

              <feMergeNode in="blur" />

              <feMergeNode in="SourceGraphic" />

            </feMerge>

          </filter>

        </defs>

        {/* GRID */}

        {[0, 0.25, 0.5, 0.75, 1].map(
          (ratio) => {

            const y =
              top +
              graphHeight * ratio;

            return (
              <line
                key={ratio}
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                className="chart-grid"
              />
            );
          }
        )}

        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(
          (ratio) => {

            const x =
              left +
              graphWidth * ratio;

            return (
              <line
                key={`v-${ratio}`}
                x1={x}
                y1={top}
                x2={x}
                y2={height - bottom}
                className="chart-grid"
              />
            );
          }
        )}

        {/* ZERO */}

        <line
          x1={left}
          y1={zeroY}
          x2={width - right}
          y2={zeroY}
          className="zero-line"
        />

        {/* BLUE AREA */}

        <path
          d={areaPath}
          fill="url(#equityFill)"
        />

        {/* EQUITY LINE */}

        <path
          d={smoothPath}
          className={
            isProfit
              ? "equity-line"
              : "equity-line loss-line"
          }
          filter="url(#equityGlow)"
        />

        {/* POINTS */}

        {data.map(
          (trade, index) => (

            <circle
              key={trade.id}
              cx={getX(index)}
              cy={getY(
                trade.equity
              )}
              r="4.5"
              className={
                trade.pnl >= 0
                  ? "equity-point"
                  : "equity-point-loss"
              }
            >

              <title>
                {formatShortDate(
                  trade.date
                )}{" "}
                • {trade.symbol}{" "}
                • Trade P&L:{" "}
                {formatMoney(
                  Number(
                    trade.pnl
                  )
                )}{" "}
                • Equity:{" "}
                {formatMoney(
                  trade.equity
                )}
              </title>

            </circle>

          )
        )}

        {/* SCALE */}

        <text
          x="5"
          y={top + 5}
          className="chart-label"
        >
          {formatAxisMoney(max)}
        </text>

        <text
          x="5"
          y={zeroY + 4}
          className="chart-label"
        >
          $0
        </text>

        <text
          x="5"
          y={height - bottom}
          className="chart-label"
        >
          {formatAxisMoney(min)}
        </text>

        {/* DATES */}

        {chartLabels.map(
          (label, index) => (

            <text
              key={`${label.text}-${index}`}
              x={label.x}
              y={height - 10}
              textAnchor={
                label.anchor
              }
              className="chart-label"
            >
              {label.text}
            </text>

          )
        )}

      </svg>

      <div
        className={`last-value ${
          isProfit
            ? ""
            : "last-value-loss"
        }`}
        style={{
          top: `${Math.max(
            5,
            Math.min(
              95,
              ((max -
                finalEquity) /
                range) *
                100
            )
          )}%`,
        }}
      >
        {formatMoney(
          finalEquity
        )}
      </div>

    </div>
  );
}

/* =========================================================
   CHART LABELS
========================================================= */

function createChartLabels(
  data: Trade[]
) {
  if (data.length === 0) {
    return [];
  }

  const indexes =
    data.length <= 4
      ? data.map(
          (_, index) => index
        )
      : [
          0,
          Math.floor(
            (data.length - 1) * 0.25
          ),
          Math.floor(
            (data.length - 1) * 0.5
          ),
          Math.floor(
            (data.length - 1) * 0.75
          ),
          data.length - 1,
        ];

  return indexes.map(
    (index, position) => ({
      x:
        58 +
        (index /
          Math.max(
            data.length - 1,
            1
          )) *
          (1000 - 58 - 55),

      text: formatShortDate(
        data[index].date
      ),

      anchor:
        position === 0
          ? "start"
          : position ===
              indexes.length - 1
          ? "end"
          : "middle",
    })
  );
}

/* =========================================================
   MONTHLY CALENDAR
========================================================= */

function MonthlyCalendar({
  trades,
  month,
}: {
  trades: Trade[];
  month: Date;
}) {
  const year =
    month.getFullYear();

  const monthIndex =
    month.getMonth();

  const firstDay =
    new Date(
      year,
      monthIndex,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      year,
      monthIndex + 1,
      0
    ).getDate();

  const offset =
    firstDay === 0
      ? 6
      : firstDay - 1;

  const cells: Array<
    number | null
  > = [];

  for (
    let i = 0;
    i < offset;
    i++
  ) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(day);
  }

  return (
    <div className="calendar">

      <div className="weekdays">

        {[
          "M",
          "T",
          "W",
          "T",
          "F",
          "S",
          "S",
        ].map(
          (day, index) => (
            <span key={index}>
              {day}
            </span>
          )
        )}

      </div>

      <div className="calendar-grid">

        {cells.map(
          (day, index) => {

            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="calendar-cell empty"
                />
              );
            }

            const dayTrades =
              trades.filter(
                (trade) => {

                  const date =
                    new Date(
                      trade.date
                    );

                  return (
                    !Number.isNaN(
                      date.getTime()
                    ) &&
                    date.getFullYear() ===
                      year &&
                    date.getMonth() ===
                      monthIndex &&
                    date.getDate() ===
                      day
                  );
                }
              );

            const pnl =
              dayTrades.reduce(
                (sum, trade) =>
                  sum +
                  Number(
                    trade.pnl || 0
                  ),
                0
              );

            return (
              <div
                key={day}
                className={`calendar-cell ${
                  dayTrades.length > 0
                    ? pnl >= 0
                      ? "calendar-profit"
                      : "calendar-loss"
                    : ""
                }`}
              >

                <span>
                  {day}
                </span>

                {dayTrades.length >
                  0 && (
                  <small>
                    {pnl >= 0
                      ? "+"
                      : "-"}
                    $
                    {Math.abs(
                      pnl
                    ).toFixed(0)}
                  </small>
                )}

              </div>
            );
          }
        )}

      </div>

      <div className="calendar-legend">

        <span>
          <i className="profit-dot" />
          Profit
        </span>

        <span>
          <i className="loss-dot" />
          Loss
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function sumPnl(
  trades: Trade[]
) {
  return trades.reduce(
    (sum, trade) =>
      sum +
      Number(trade.pnl || 0),
    0
  );
}

function formatMoney(
  value: number
) {
  const number =
    Number(value || 0);

  return `${
    number < 0 ? "-$" : "+$"
  }${Math.abs(number).toFixed(
    2
  )}`;
}

function formatAxisMoney(
  value: number
) {
  const number =
    Number(value || 0);

  const abs =
    Math.abs(number);

  if (abs >= 1000) {
    return `$${(
      number / 1000
    ).toFixed(1)}k`;
  }

  return `$${number.toFixed(0)}`;
}

function formatShortDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}