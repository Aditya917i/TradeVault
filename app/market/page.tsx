"use client";

import { useEffect, useMemo, useState } from "react";

type Direction = "BULLISH" | "BEARISH" | "FLAT";

type Market = {
  symbol: string;
  description: string;
  price: number | null;
  bid: number | null;
  ask: number | null;
  high: number | null;
  low: number | null;
  changePercent: number;
  direction: Direction;
  marketState: string;
  stale: boolean;
};

type Candle = {
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tickVolume: number;
  isOpen: boolean;
};

const DEFAULT_WATCHLIST = ["XAUUSD", "EURUSD"];

const DEFAULT_MARKETS = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
];

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
];

const WATCHLIST_STORAGE = "tradevault-watchlist";

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) {
    return "--";
  }

  if (price >= 100) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return price.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 5,
  });
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function CandlestickChart({
  candles,
}: {
  candles: Candle[];
}) {
  if (!candles.length) {
    return (
      <div className="h-[420px] flex items-center justify-center text-gray-500">
        No candle data available
      </div>
    );
  }

  const ordered = [...candles].sort(
    (a, b) =>
      new Date(a.openTime).getTime() -
      new Date(b.openTime).getTime()
  );

  const width = 1000;
  const height = 420;

  const paddingTop = 20;
  const paddingBottom = 35;
  const paddingLeft = 10;
  const paddingRight = 80;

  const chartWidth =
    width - paddingLeft - paddingRight;

  const chartHeight =
    height - paddingTop - paddingBottom;

  const highs = ordered.map((candle) => candle.high);
  const lows = ordered.map((candle) => candle.low);

  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);

  const priceRange = maxPrice - minPrice || 1;

  const xStep =
    chartWidth / Math.max(ordered.length, 1);

  const candleWidth = Math.max(
    3,
    Math.min(12, xStep * 0.65)
  );

  const getX = (index: number) =>
    paddingLeft + index * xStep + xStep / 2;

  const getY = (price: number) =>
    paddingTop +
    ((maxPrice - price) / priceRange) *
      chartHeight;

  const lastCandle = ordered[ordered.length - 1];

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[420px]"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((line) => {
          const y =
            paddingTop +
            (chartHeight / 4) * line;

          const price =
            maxPrice -
            (priceRange / 4) * line;

          return (
            <g key={line}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke="#1f2937"
                strokeWidth="1"
              />

              <text
                x={width - 10}
                y={y + 4}
                textAnchor="end"
                fill="#6b7280"
                fontSize="12"
              >
                {formatPrice(price)}
              </text>
            </g>
          );
        })}

        {/* Candles */}
        {ordered.map((candle, index) => {
          const x = getX(index);

          const highY = getY(candle.high);
          const lowY = getY(candle.low);

          const openY = getY(candle.open);
          const closeY = getY(candle.close);

          const bodyTop = Math.min(
            openY,
            closeY
          );

          const bodyBottom = Math.max(
            openY,
            closeY
          );

          const bodyHeight = Math.max(
            2,
            bodyBottom - bodyTop
          );

          const bullish =
            candle.close >= candle.open;

          const candleColor = bullish
            ? "#22c55e"
            : "#ef4444";

          return (
            <g key={`${candle.openTime}-${index}`}>
              {/* Wick */}
              <line
                x1={x}
                x2={x}
                y1={highY}
                y2={lowY}
                stroke={candleColor}
                strokeWidth="1.5"
              />

              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={candleColor}
                rx="1"
              />
            </g>
          );
        })}

        {/* Last price line */}
        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={getY(lastCandle.close)}
          y2={getY(lastCandle.close)}
          stroke="#facc15"
          strokeWidth="1"
          strokeDasharray="5 5"
        />

        <text
          x={width - paddingRight + 5}
          y={getY(lastCandle.close) - 5}
          fill="#facc15"
          fontSize="12"
        >
          {formatPrice(lastCandle.close)}
        </text>
      </svg>
    </div>
  );
}

export default function MarketPage() {
  const [watchlist, setWatchlist] = useState<string[]>(
    DEFAULT_WATCHLIST
  );

  const [watchlistLoaded, setWatchlistLoaded] =
    useState(false);

  const [markets, setMarkets] = useState<Market[]>(
    []
  );

  const [selectedSymbol, setSelectedSymbol] =
    useState("XAUUSD");

  const [timeframe, setTimeframe] =
    useState("5m");

  const [candles, setCandles] = useState<Candle[]>(
    []
  );

  const [loadingMarkets, setLoadingMarkets] =
    useState(true);

  const [loadingChart, setLoadingChart] =
    useState(true);

  const [marketError, setMarketError] =
    useState("");

  const [chartError, setChartError] =
    useState("");

  const [symbolInput, setSymbolInput] =
    useState("");

  const [addingSymbol, setAddingSymbol] =
    useState(false);

  const [addError, setAddError] =
    useState("");

  // Load saved watchlist
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          WATCHLIST_STORAGE
        );

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          setWatchlist(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Error loading watchlist:",
        error
      );
    } finally {
      setWatchlistLoaded(true);
    }
  }, []);

  // Save watchlist
  useEffect(() => {
    if (!watchlistLoaded) return;

    try {
      localStorage.setItem(
        WATCHLIST_STORAGE,
        JSON.stringify(watchlist)
      );
    } catch (error) {
      console.error(
        "Error saving watchlist:",
        error
      );
    }
  }, [watchlist, watchlistLoaded]);

  // Fetch one market
  async function fetchMarket(
    symbol: string
  ): Promise<Market> {
    const response = await fetch(
      `/api/market?symbol=${encodeURIComponent(
        symbol
      )}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          `Unable to load ${symbol}`
      );
    }

    return {
      symbol: data.symbol || symbol,
      description:
        data.description || symbol,
      price:
        typeof data.price === "number"
          ? data.price
          : null,
      bid:
        typeof data.bid === "number"
          ? data.bid
          : null,
      ask:
        typeof data.ask === "number"
          ? data.ask
          : null,
      high:
        typeof data.high === "number"
          ? data.high
          : null,
      low:
        typeof data.low === "number"
          ? data.low
          : null,
      changePercent:
        typeof data.changePercent ===
        "number"
          ? data.changePercent
          : 0,
      direction:
        data.direction === "BEARISH"
          ? "BEARISH"
          : data.direction === "FLAT"
          ? "FLAT"
          : "BULLISH",
      marketState:
        data.marketState || "unknown",
      stale: data.stale === true,
    };
  }

  // Load market data
  async function loadMarkets() {
    setLoadingMarkets(true);
    setMarketError("");

    try {
      const symbols = Array.from(
        new Set([
          ...DEFAULT_MARKETS,
          ...watchlist,
        ])
      );

      const results =
        await Promise.allSettled(
          symbols.map((symbol) =>
            fetchMarket(symbol)
          )
        );

      const successful: Market[] = [];

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          successful.push(result.value);
        }
      });

      setMarkets(successful);

      if (successful.length === 0) {
        setMarketError(
          "No market data available."
        );
      }
    } catch (error) {
      console.error(error);

      setMarketError(
        "Unable to load market data."
      );
    } finally {
      setLoadingMarkets(false);
    }
  }

  // Initial market load + refresh
  useEffect(() => {
    if (!watchlistLoaded) return;

    loadMarkets();

    const refreshTimer = setInterval(
      () => {
        loadMarkets();
      },
      30000
    );

    return () =>
      clearInterval(refreshTimer);
  }, [watchlist, watchlistLoaded]);

  // Load OHLC candles
  useEffect(() => {
    if (!selectedSymbol) return;

    let cancelled = false;

    async function loadChart() {
      setLoadingChart(true);
      setChartError("");

      try {
        const response = await fetch(
          `/api/market/ohlc?symbol=${encodeURIComponent(
            selectedSymbol
          )}&interval=${encodeURIComponent(
            timeframe
          )}&limit=80`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to load chart"
          );
        }

        if (!cancelled) {
          setCandles(
            Array.isArray(data.bars)
              ? data.bars
              : []
          );
        }
      } catch (error) {
        console.error(
          "Chart error:",
          error
        );

        if (!cancelled) {
          setCandles([]);
          setChartError(
            error instanceof Error
              ? error.message
              : "Unable to load chart"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingChart(false);
        }
      }
    }

    loadChart();

    const chartTimer = setInterval(
      loadChart,
      30000
    );

    return () => {
      cancelled = true;
      clearInterval(chartTimer);
    };
  }, [selectedSymbol, timeframe]);

  const selectedMarket = useMemo(
    () =>
      markets.find(
        (market) =>
          market.symbol === selectedSymbol
      ),
    [markets, selectedSymbol]
  );

  // Add symbol
  async function handleAddSymbol() {
    const symbol = symbolInput
      .trim()
      .toUpperCase()
      .replaceAll("/", "");

    if (!symbol) return;

    setAddingSymbol(true);
    setAddError("");

    try {
      const market =
        await fetchMarket(symbol);

      setMarkets((current) => {
        const exists = current.some(
          (item) =>
            item.symbol === market.symbol
        );

        if (exists) {
          return current.map((item) =>
            item.symbol === market.symbol
              ? market
              : item
          );
        }

        return [...current, market];
      });

      setWatchlist((current) => {
        if (current.includes(symbol)) {
          return current;
        }

        return [...current, symbol];
      });

      setSelectedSymbol(symbol);
      setSymbolInput("");
    } catch (error) {
      console.error(error);

      setAddError(
        error instanceof Error
          ? error.message
          : `No market data found for ${symbol}`
      );
    } finally {
      setAddingSymbol(false);
    }
  }

  function removeFromWatchlist(
    symbol: string
  ) {
    setWatchlist((current) =>
      current.filter(
        (item) => item !== symbol
      )
    );
  }

  const chartHigh = candles.length
    ? Math.max(
        ...candles.map(
          (candle) => candle.high
        )
      )
    : null;

  const chartLow = candles.length
    ? Math.min(
        ...candles.map(
          (candle) => candle.low
        )
      )
    : null;

  return (
    <main className="min-h-screen bg-[#0d1117] text-white p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Market
          </h1>

          <p className="text-gray-500 mt-1">
            Live market prices and
            candlestick charts
          </p>
        </div>

        {/* Add Symbol */}
        <div className="flex gap-2">
          <input
            value={symbolInput}
            onChange={(event) =>
              setSymbolInput(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAddSymbol();
              }
            }}
            placeholder="Add symbol e.g. BTCUSD"
            className="w-64 bg-[#161b22] border border-gray-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
          />

          <button
            onClick={handleAddSymbol}
            disabled={addingSymbol}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
          >
            {addingSymbol
              ? "Adding..."
              : "Add"}
          </button>
        </div>
      </div>

      {addError && (
        <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {addError}
        </div>
      )}

      {/* Watchlist */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Watchlist
          </h2>

          <span className="text-xs text-gray-500">
            Live updates every 30 seconds
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {watchlist.map((symbol) => (
            <button
              key={symbol}
              onClick={() =>
                setSelectedSymbol(symbol)
              }
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                selectedSymbol === symbol
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-[#161b22] border-gray-800 text-gray-300 hover:border-gray-600"
              }`}
            >
              <span>{symbol}</span>

              <span
                onClick={(event) => {
                  event.stopPropagation();
                  removeFromWatchlist(symbol);
                }}
                className="text-gray-600 hover:text-red-400"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Market Cards */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Markets
        </h2>

        {loadingMarkets ? (
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 text-center text-gray-500">
            Loading live market data...
          </div>
        ) : marketError ? (
          <div className="bg-[#161b22] border border-red-900/50 rounded-xl p-8 text-center text-red-400">
            {marketError}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {markets.map((market) => {
              const bullish =
                market.direction ===
                "BULLISH";

              const bearish =
                market.direction ===
                "BEARISH";

              return (
                <button
                  key={market.symbol}
                  onClick={() =>
                    setSelectedSymbol(
                      market.symbol
                    )
                  }
                  className={`text-left bg-[#161b22] border rounded-xl p-4 transition hover:border-gray-600 ${
                    selectedSymbol ===
                    market.symbol
                      ? "border-blue-500"
                      : "border-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">
                        {market.symbol}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {market.description}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        bullish
                          ? "text-green-400"
                          : bearish
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {market.direction}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-2xl font-bold">
                      {formatPrice(
                        market.price
                      )}
                    </p>

                    <p
                      className={`text-sm mt-1 ${
                        bullish
                          ? "text-green-400"
                          : bearish
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {formatPercent(
                        market.changePercent
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Chart */}
      <section className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden">
        {/* Chart Header */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">
                  {selectedSymbol}
                </h2>

                {selectedMarket && (
                  <span
                    className={`text-sm ${
                      selectedMarket.direction ===
                      "BULLISH"
                        ? "text-green-400"
                        : selectedMarket.direction ===
                          "BEARISH"
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {formatPercent(
                      selectedMarket.changePercent
                    )}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-1">
                Real OHLC market data
              </p>
            </div>

            {/* Timeframes */}
            <div className="flex flex-wrap gap-1 bg-[#0d1117] p-1 rounded-lg">
              {TIMEFRAMES.map((item) => (
                <button
                  key={item.value}
                  onClick={() =>
                    setTimeframe(
                      item.value
                    )
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                    timeframe === item.value
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* OHLC info */}
          {selectedMarket && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div>
                <p className="text-xs text-gray-500">
                  Bid
                </p>
                <p className="text-sm font-medium mt-1">
                  {formatPrice(
                    selectedMarket.bid
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Ask
                </p>
                <p className="text-sm font-medium mt-1">
                  {formatPrice(
                    selectedMarket.ask
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Day High
                </p>
                <p className="text-sm font-medium mt-1">
                  {formatPrice(
                    selectedMarket.high
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Day Low
                </p>
                <p className="text-sm font-medium mt-1">
                  {formatPrice(
                    selectedMarket.low
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chart Area */}
        <div className="p-4">
          {loadingChart ? (
            <div className="h-[420px] flex items-center justify-center">
              <div className="text-gray-500 text-sm">
                Loading {selectedSymbol}{" "}
                {timeframe} chart...
              </div>
            </div>
          ) : chartError ? (
            <div className="h-[420px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-400 text-sm">
                  {chartError}
                </p>

                <p className="text-gray-600 text-xs mt-2">
                  Try another timeframe or
                  symbol.
                </p>
              </div>
            </div>
          ) : (
            <CandlestickChart
              candles={candles}
            />
          )}
        </div>

        {/* Chart Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex flex-wrap gap-6 text-xs text-gray-500">
          <span>
            Candles: {candles.length}
          </span>

          {chartHigh !== null && (
            <span>
              Chart High:{" "}
              {formatPrice(chartHigh)}
            </span>
          )}

          {chartLow !== null && (
            <span>
              Chart Low:{" "}
              {formatPrice(chartLow)}
            </span>
          )}

          {candles.length > 0 && (
            <span>
              Last Close:{" "}
              {formatPrice(
                candles[candles.length - 1]
                  .close
              )}
            </span>
          )}

          <span className="ml-auto text-green-500">
            ● Live OHLC
          </span>
        </div>
      </section>
    </main>
  );
}