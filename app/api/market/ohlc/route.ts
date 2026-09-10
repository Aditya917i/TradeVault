import { NextRequest, NextResponse } from "next/server";

const allowedIntervals = new Set([
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
]);

export async function GET(request: NextRequest) {
  try {
    const symbolParam = request.nextUrl.searchParams.get("symbol");
    const intervalParam =
      request.nextUrl.searchParams.get("interval") || "5m";
    const limitParam =
      request.nextUrl.searchParams.get("limit") || "80";

    if (!symbolParam) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    const symbol = symbolParam
      .trim()
      .toUpperCase()
      .replaceAll("/", "");

    const interval = intervalParam.trim().toLowerCase();

    const parsedLimit = Number.parseInt(limitParam, 10);
    const limit = Math.min(
      Math.max(Number.isNaN(parsedLimit) ? 80 : parsedLimit, 10),
      200
    );

    if (!allowedIntervals.has(interval)) {
      return NextResponse.json(
        { error: "Invalid interval" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://biquote.io/api/${encodeURIComponent(
        symbol
      )}/ohlc?interval=${encodeURIComponent(interval)}&limit=${limit}`,
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
            `No OHLC data found for ${symbol}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      symbol: data.symbol || symbol,
      interval: data.interval || interval,
      bars: Array.isArray(data.bars) ? data.bars : [],
    });
  } catch (error) {
    console.error("OHLC API error:", error);

    return NextResponse.json(
      { error: "Unable to fetch OHLC data" },
      { status: 500 }
    );
  }
}