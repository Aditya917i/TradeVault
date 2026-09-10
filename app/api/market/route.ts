import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const symbolParam = request.nextUrl.searchParams.get("symbol");

    if (!symbolParam) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    const symbol = symbolParam
      .trim()
      .toUpperCase()
      .replace("/", "");

    if (!symbol) {
      return NextResponse.json(
        { error: "Invalid symbol" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://biquote.io/api/${encodeURIComponent(symbol)}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            `No market data found for ${symbol}`,
        },
        {
          status: response.status,
        }
      );
    }

    const changePercent =
      typeof data.dayDiffPercent === "number"
        ? data.dayDiffPercent
        : 0;

    let direction = "FLAT";

    if (changePercent > 0) {
      direction = "BULLISH";
    } else if (changePercent < 0) {
      direction = "BEARISH";
    }

    return NextResponse.json({
      symbol: data.symbol || symbol,

      description:
        data.description || symbol,

      price:
        typeof data.mid === "number"
          ? data.mid
          : null,

      bid:
        typeof data.bid === "number"
          ? data.bid
          : null,

      ask:
        typeof data.ask === "number"
          ? data.ask
          : null,

      spread:
        typeof data.spread === "number"
          ? data.spread
          : null,

      high:
        typeof data.high === "number"
          ? data.high
          : null,

      low:
        typeof data.low === "number"
          ? data.low
          : null,

      changePercent,

      direction,

      marketState:
        data.marketState || "unknown",

      timestamp:
        data.timestamp || null,

      stale:
        data.stale === true,
    });
  } catch (error) {
    console.error("Market API error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch market data",
      },
      {
        status: 500,
      }
    );
  }
}