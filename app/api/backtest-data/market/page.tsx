"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Star,
  Plus,
  X,
  Activity,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

type Market = {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number;
  direction:
    | "BULLISH"
    | "BEARISH"
    | "FLAT";
  bid: number | null;
  ask: number | null;
  spread: number | null;
  high: number | null;
  low: number | null;
  marketState: string;
  timestamp: string | null;
  stale: boolean;
};

const DEFAULT_SYMBOLS = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
];

const DEFAULT_WATCHLIST = [
  "XAUUSD",
  "EURUSD",
];

const sessions = [
  {
    name: "Asian Session",
    time: "05:30 - 11:30 IST",
  },
  {
    name: "London Session",
    time: "12:30 - 16:30 IST",
  },
  {
    name: "New York Session",
    time: "17:30 - 22:00 IST",
  },
];

export default function MarketPage() {
  const [markets, setMarkets] =
    useState<Market[]>([]);

  const [watchlist, setWatchlist] =
    useState<string[]>(DEFAULT_WATCHLIST);

  const [selectedSymbol, setSelectedSymbol] =
    useState("XAUUSD");

  const [showAdd, setShowAdd] =
    useState(false);

  const [newSymbol, setNewSymbol] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [adding, setAdding] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  // ============================================
  // LOAD WATCHLIST
  // ============================================

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "tradevault-watchlist"
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

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
    }
  }, []);

  // ============================================
  // SAVE WATCHLIST
  // ============================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "tradevault-watchlist",
        JSON.stringify(watchlist)
      );
    } catch (error) {
      console.error(
        "Error saving watchlist:",
        error
      );
    }
  }, [watchlist]);

  // ============================================
  // FETCH ONE MARKET
  // ============================================

  const fetchMarket = async (
    symbol: string
  ): Promise<Market | null> => {
    try {
      const response = await fetch(
        `/api/market?symbol=${encodeURIComponent(
          symbol
        )}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Unable to load ${symbol}`
        );
      }

      return data as Market;
    } catch (error) {
      console.error(
        `Error fetching ${symbol}:`,
        error
      );

      return null;
    }
  };

  // ============================================
  // FETCH ALL MARKETS
  // ============================================

  const loadMarkets = async () => {
    setLoading(true);
    setError("");

    try {
      const symbols = Array.from(
        new Set([
          ...DEFAULT_SYMBOLS,
          ...watchlist,
        ])
      );

      const results =
        await Promise.all(
          symbols.map((symbol) =>
            fetchMarket(symbol)
          )
        );

      const validMarkets =
        results.filter(
          (
            market
          ): market is Market =>
            market !== null
        );

      setMarkets(validMarkets);

      if (validMarkets.length === 0) {
        setError(
          "No market data could be loaded."
        );
      }

      setLastUpdated(
        new Date().toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load market data."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================

  useEffect(() => {
    loadMarkets();

    const interval =
      setInterval(() => {
        loadMarkets();
      }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [watchlist.join(",")]);

  // ============================================
  // SELECTED MARKET
  // ============================================

  const selectedMarket =
    markets.find(
      (market) =>
        market.symbol ===
        selectedSymbol
    ) || null;

  // ============================================
  // ADD MARKET
  // ============================================

  const addToWatchlist = async () => {
    const symbol = newSymbol
      .trim()
      .toUpperCase()
      .replace("/", "");

    if (!symbol) {
      return;
    }

    setAdding(true);
    setError("");

    const market =
      await fetchMarket(symbol);

    if (!market) {
      setError(
        `No market data found for "${symbol}". Check the symbol and try again.`
      );

      setAdding(false);
      return;
    }

    setMarkets((previous) => {
      const exists =
        previous.some(
          (item) =>
            item.symbol ===
            market.symbol
        );

      if (exists) {
        return previous.map(
          (item) =>
            item.symbol ===
            market.symbol
              ? market
              : item
        );
      }

      return [
        ...previous,
        market,
      ];
    });

    if (
      !watchlist.includes(
        market.symbol
      )
    ) {
      setWatchlist((previous) => [
        ...previous,
        market.symbol,
      ]);
    }

    setSelectedSymbol(
      market.symbol
    );

    setNewSymbol("");
    setShowAdd(false);
    setAdding(false);
  };

  // ============================================
  // REMOVE WATCHLIST
  // ============================================

  const removeFromWatchlist = (
    symbol: string
  ) => {
    setWatchlist((previous) =>
      previous.filter(
        (item) =>
          item !== symbol
      )
    );

    if (
      selectedSymbol === symbol
    ) {
      setSelectedSymbol(
        "XAUUSD"
      );
    }
  };

  // ============================================
  // FORMAT PRICE
  // ============================================

  const formatPrice = (
    price: number | null
  ) => {
    if (price === null) {
      return "--";
    }

    if (price >= 1000) {
      return price.toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );
    }

    if (price >= 10) {
      return price.toFixed(3);
    }

    return price.toFixed(5);
  };

  // ============================================
  // FORMAT CHANGE
  // ============================================

  const formatChange = (
    change: number
  ) => {
    if (change > 0) {
      return `+${change.toFixed(2)}%`;
    }

    return `${change.toFixed(2)}%`;
  };

  // ============================================
  // FORMAT TIME
  // ============================================

  const formatMarketTime = (
    timestamp: string | null
  ) => {
    if (!timestamp) {
      return "--";
    }

    try {
      return new Date(
        timestamp
      ).toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );
    } catch {
      return "--";
    }
  };

  // ============================================
  // BULLISH / BEARISH COUNTS
  // ============================================

  const bullishCount =
    markets.filter(
      (market) =>
        market.direction ===
        "BULLISH"
    ).length;

  const bearishCount =
    markets.filter(
      (market) =>
        market.direction ===
        "BEARISH"
    ).length;

  // ============================================
  // LOADING
  // ============================================

  if (loading && markets.length === 0) {
    return (
      <main className="min-h-screen bg-[#0b0f14] text-white p-6">

        <div className="rounded-2xl border border-white/10 bg-[#11161d] p-12 text-center">

          <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />

          <h2 className="font-semibold">
            Loading market data...
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Connecting to live market prices.
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">

              <BarChart3 className="w-5 h-5 text-blue-400" />

            </div>

            <div>

              <h1 className="text-2xl md:text-3xl font-bold">
                Market
              </h1>

              <p className="text-gray-400 text-sm mt-1">
                Live market data for your trading watchlist.
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated}
              </span>
            )}

            <button
              onClick={loadMarkets}
              disabled={loading}
              className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>

          </div>

        </div>

      </div>

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 flex items-start gap-3">

          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />

          <div>

            <p className="text-sm text-red-400 font-semibold">
              Market data error
            </p>

            <p className="text-xs text-gray-500 mt-1">
              {error}
            </p>

          </div>

          <button
            onClick={() =>
              setError("")
            }
            className="ml-auto text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* ========================================
          MARKET CARDS
      ======================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {markets
          .filter((market) =>
            DEFAULT_SYMBOLS.includes(
              market.symbol
            )
          )
          .map((market) => (

            <button
              key={market.symbol}
              onClick={() =>
                setSelectedSymbol(
                  market.symbol
                )
              }
              className={`text-left rounded-2xl border p-4 transition ${
                selectedSymbol ===
                market.symbol
                  ? "border-blue-500/40 bg-blue-500/[0.07]"
                  : "border-white/10 bg-[#11161d] hover:bg-white/[0.03]"
              }`}
            >

              <div className="flex items-center justify-between">

                <span className="font-bold">
                  {market.symbol}
                </span>

                {market.direction ===
                "BULLISH" ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : market.direction ===
                  "BEARISH" ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <Activity className="w-4 h-4 text-gray-400" />
                )}

              </div>

              <p className="text-lg font-bold mt-3">
                {formatPrice(
                  market.price
                )}
              </p>

              <div
                className={`flex items-center gap-1 text-xs mt-1 ${
                  market.changePercent > 0
                    ? "text-green-400"
                    : market.changePercent < 0
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >

                {market.changePercent >
                0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : market.changePercent <
                  0 ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : null}

                {formatChange(
                  market.changePercent
                )}

              </div>

            </button>

          ))}

      </div>

      {/* ========================================
          MAIN MARKET
      ======================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

        {/* ======================================
            MARKET DETAIL
        ====================================== */}

        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-[#11161d] overflow-hidden">

          {selectedMarket ? (

            <>

              {/* HEADER */}

              <div className="p-5 border-b border-white/10">

                <div className="flex items-center justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <h2 className="text-xl font-bold">
                        {selectedMarket.symbol}
                      </h2>

                      <span
                        className={`text-[10px] px-2 py-1 rounded-md ${
                          selectedMarket.direction ===
                          "BULLISH"
                            ? "bg-green-500/10 text-green-400"
                            : selectedMarket.direction ===
                              "BEARISH"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {selectedMarket.direction}
                      </span>

                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      {selectedMarket.name}
                    </p>

                  </div>

                  <div className="text-right">

                    <p
                      className={`text-[10px] ${
                        selectedMarket.marketState ===
                        "open"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {selectedMarket.marketState ===
                      "open"
                        ? "● MARKET OPEN"
                        : "● MARKET CLOSED"}
                    </p>

                    {selectedMarket.stale && (
                      <p className="text-[9px] text-yellow-500 mt-1">
                        Last known price
                      </p>
                    )}

                  </div>

                </div>

              </div>

              {/* PRICE */}

              <div className="p-5">

                <p className="text-xs text-gray-500">
                  Current Price
                </p>

                <div className="flex flex-wrap items-end gap-3 mt-1">

                  <span className="text-3xl md:text-4xl font-bold">
                    {formatPrice(
                      selectedMarket.price
                    )}
                  </span>

                  <span
                    className={`text-sm font-semibold mb-1 ${
                      selectedMarket.changePercent >
                      0
                        ? "text-green-400"
                        : selectedMarket.changePercent <
                          0
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {formatChange(
                      selectedMarket.changePercent
                    )}
                  </span>

                </div>

              </div>

              {/* BID / ASK / HIGH / LOW */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 pb-5">

                <InfoBox
                  label="Bid"
                  value={formatPrice(
                    selectedMarket.bid
                  )}
                />

                <InfoBox
                  label="Ask"
                  value={formatPrice(
                    selectedMarket.ask
                  )}
                />

                <InfoBox
                  label="Day High"
                  value={formatPrice(
                    selectedMarket.high
                  )}
                />

                <InfoBox
                  label="Day Low"
                  value={formatPrice(
                    selectedMarket.low
                  )}
                />

              </div>

              {/* CHART PLACEHOLDER */}

              <div className="px-5 pb-5">

                <div className="h-[280px] rounded-xl border border-white/5 bg-[#0b0f14] relative overflow-hidden">

                  <div className="absolute inset-0 opacity-20">

                    <div className="absolute top-1/4 left-0 right-0 border-t border-white/10" />

                    <div className="absolute top-2/4 left-0 right-0 border-t border-white/10" />

                    <div className="absolute top-3/4 left-0 right-0 border-t border-white/10" />

                    <div className="absolute left-1/4 top-0 bottom-0 border-l border-white/10" />

                    <div className="absolute left-2/4 top-0 bottom-0 border-l border-white/10" />

                    <div className="absolute left-3/4 top-0 bottom-0 border-l border-white/10" />

                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">

                    <div className="text-center">

                      <BarChart3 className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />

                      <p className="text-gray-500 text-sm">
                        Live price connected
                      </p>

                      <p className="text-gray-600 text-xs mt-1">
                        Candlestick chart is the next upgrade
                      </p>

                    </div>

                  </div>

                  <div className="absolute bottom-3 left-3 flex gap-1">

                    {[
                      "1m",
                      "5m",
                      "15m",
                      "1H",
                      "4H",
                      "1D",
                    ].map(
                      (
                        timeframe,
                        index
                      ) => (
                        <button
                          key={timeframe}
                          className={`px-2.5 py-1 rounded-md text-[10px] ${
                            index === 1
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-white/5 text-gray-500"
                          }`}
                        >
                          {timeframe}
                        </button>
                      )
                    )}

                  </div>

                </div>

              </div>

              {/* LAST UPDATE */}

              <div className="px-5 pb-5">

                <p className="text-[10px] text-gray-600">
                  Market quote:
                  {" "}
                  {formatMarketTime(
                    selectedMarket.timestamp
                  )}
                </p>

              </div>

            </>

          ) : (

            <div className="p-12 text-center">

              <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />

              <p className="text-gray-500">
                Select a market.
              </p>

            </div>

          )}

        </div>

        {/* ======================================
            WATCHLIST
        ====================================== */}

        <div className="rounded-2xl border border-white/10 bg-[#11161d] overflow-hidden">

          <div className="p-5 border-b border-white/10 flex items-center justify-between">

            <div>

              <h2 className="font-semibold">
                Watchlist
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Live market prices
              </p>

            </div>

            <button
              onClick={() =>
                setShowAdd(true)
              }
              className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20"
            >
              <Plus className="w-4 h-4" />
            </button>

          </div>

          <div className="p-3">

            {watchlist.length === 0 ? (

              <div className="p-8 text-center">

                <Star className="w-8 h-8 text-gray-600 mx-auto mb-3" />

                <p className="text-sm text-gray-500">
                  Your watchlist is empty.
                </p>

              </div>

            ) : (

              watchlist.map(
                (symbol) => {

                  const market =
                    markets.find(
                      (item) =>
                        item.symbol ===
                        symbol
                    );

                  return (
                    <div
                      key={symbol}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition"
                    >

                      <button
                        onClick={() =>
                          setSelectedSymbol(
                            symbol
                          )
                        }
                        className="text-left flex-1"
                      >

                        <p className="font-semibold text-sm">
                          {symbol}
                        </p>

                        <p className="text-[10px] text-gray-500 mt-1">
                          {market
                            ? market.name
                            : "Loading..."}
                        </p>

                      </button>

                      {market && (

                        <div className="text-right mr-3">

                          <p className="text-sm font-semibold">
                            {formatPrice(
                              market.price
                            )}
                          </p>

                          <p
                            className={`text-[10px] ${
                              market.changePercent >
                              0
                                ? "text-green-400"
                                : market.changePercent <
                                  0
                                ? "text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            {formatChange(
                              market.changePercent
                            )}
                          </p>

                        </div>

                      )}

                      <button
                        onClick={() =>
                          removeFromWatchlist(
                            symbol
                          )
                        }
                        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

      </div>

      {/* ========================================
          MARKET BIAS
      ======================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-5">

          <div className="flex items-center gap-2">

            <TrendingUp className="w-5 h-5 text-green-400" />

            <h3 className="font-semibold">
              Bullish Markets
            </h3>

          </div>

          <p className="text-2xl font-bold text-green-400 mt-4">
            {bullishCount}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Positive daily change
          </p>

        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">

          <div className="flex items-center gap-2">

            <TrendingDown className="w-5 h-5 text-red-400" />

            <h3 className="font-semibold">
              Bearish Markets
            </h3>

          </div>

          <p className="text-2xl font-bold text-red-400 mt-4">
            {bearishCount}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Negative daily change
          </p>

        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">

          <div className="flex items-center gap-2">

            <Target className="w-5 h-5 text-blue-400" />

            <h3 className="font-semibold">
              Focus Market
            </h3>

          </div>

          <p className="text-2xl font-bold text-blue-400 mt-4">
            {selectedSymbol}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Currently selected
          </p>

        </div>

      </div>

      {/* ========================================
          TRADING SESSIONS
      ======================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#11161d] p-5 mb-6">

        <div className="flex items-center gap-2 mb-5">

          <Clock className="w-5 h-5 text-blue-400" />

          <div>

            <h2 className="font-semibold">
              Trading Sessions
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Session schedule in IST
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {sessions.map(
            (session) => (

              <div
                key={session.name}
                className="rounded-xl border border-white/5 bg-[#0b0f14] p-4"
              >

                <p className="font-semibold text-sm">
                  {session.name}
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  {session.time}
                </p>

              </div>

            )
          )}

        </div>

      </div>

      {/* ========================================
          ADD MARKET MODAL
      ======================================== */}

      {showAdd && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11161d] shadow-2xl">

            <div className="flex items-center justify-between p-5 border-b border-white/10">

              <div>

                <h2 className="font-semibold">
                  Add Market
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Enter a real market symbol
                </p>

              </div>

              <button
                onClick={() =>
                  setShowAdd(false)
                }
                className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <div className="p-5">

              <label className="text-xs text-gray-400">
                Symbol
              </label>

              <input
                value={newSymbol}
                onChange={(event) =>
                  setNewSymbol(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    addToWatchlist();
                  }
                }}
                placeholder="Example: USDCHF or BTCUSD"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-[#0b0f14] border border-white/10 outline-none focus:border-blue-500/50 text-sm"
              />

              <p className="text-[10px] text-gray-600 mt-2">
                Examples: XAUUSD, USDCHF,
                AUDUSD, USDCAD, BTCUSD
              </p>

              <button
                onClick={
                  addToWatchlist
                }
                disabled={adding}
                className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-semibold text-sm transition flex items-center justify-center gap-2"
              >

                {adding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading market...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Market
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

// ============================================
// INFO BOX
// ============================================

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0b0f14] p-3">

      <p className="text-[10px] text-gray-500">
        {label}
      </p>

      <p className="text-sm font-semibold mt-1">
        {value}
      </p>

    </div>
  );
}