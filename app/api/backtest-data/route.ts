import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function detectDelimiter(line: string) {
  if (line.includes(",")) return ",";
  if (line.includes(";")) return ";";
  if (line.includes("\t")) return "\t";
  return ",";
}

function parseNumber(value: string) {
  const cleaned = value.replace(/"/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseTime(value: string) {
  const cleaned = value.replace(/"/g, "").trim();

  if (!cleaned) return 0;

  // Unix timestamp
  if (/^\d+$/.test(cleaned)) {
    const n = Number(cleaned);

    // seconds
    if (n < 100000000000) return n * 1000;

    // milliseconds
    return n;
  }

  const parsed = Date.parse(cleaned);

  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  return 0;
}

function findColumn(headers: string[], names: string[]) {
  for (const name of names) {
    const index = headers.findIndex(
      (h) => h.toLowerCase().trim() === name.toLowerCase()
    );

    if (index !== -1) return index;
  }

  return -1;
}

function parseCSV(content: string): Candle[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);

  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.replace(/"/g, "").trim());

  const timeIndex = findColumn(headers, [
    "timestamp",
    "time",
    "datetime",
    "date",
    "date/time",
    "date_time",
  ]);

  const openIndex = findColumn(headers, ["open", "o"]);
  const highIndex = findColumn(headers, ["high", "h"]);
  const lowIndex = findColumn(headers, ["low", "l"]);
  const closeIndex = findColumn(headers, ["close", "c"]);
  const volumeIndex = findColumn(headers, [
    "volume",
    "vol",
    "tick_volume",
    "tick volume",
  ]);

  if (
    timeIndex === -1 ||
    openIndex === -1 ||
    highIndex === -1 ||
    lowIndex === -1 ||
    closeIndex === -1
  ) {
    throw new Error(
      `Could not detect required columns. Found: ${headers.join(", ")}`
    );
  }

  const candles: Candle[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delimiter);

    const time = parseTime(parts[timeIndex]);
    const open = parseNumber(parts[openIndex]);
    const high = parseNumber(parts[highIndex]);
    const low = parseNumber(parts[lowIndex]);
    const close = parseNumber(parts[closeIndex]);

    const volume =
      volumeIndex !== -1 ? parseNumber(parts[volumeIndex]) : 0;

    if (
      time > 0 &&
      open > 0 &&
      high > 0 &&
      low > 0 &&
      close > 0
    ) {
      candles.push({
        time,
        open,
        high,
        low,
        close,
        volume,
      });
    }
  }

  return candles;
}

function aggregateCandles(
  candles: Candle[],
  minutes: number
): Candle[] {
  if (minutes === 1) return candles;

  const interval = minutes * 60 * 1000;

  const result: Candle[] = [];

  let current: Candle | null = null;
  let currentBucket = -1;

  for (const candle of candles) {
    const bucket = Math.floor(candle.time / interval);

    if (bucket !== currentBucket) {
      if (current) {
        result.push(current);
      }

      currentBucket = bucket;

      current = {
        time: bucket * interval,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      };
    } else if (current) {
      current.high = Math.max(current.high, candle.high);
      current.low = Math.min(current.low, candle.low);
      current.close = candle.close;
      current.volume += candle.volume;
    }
  }

  if (current) {
    result.push(current);
  }

  return result;
}

export async function GET() {
  try {
    const dataDirectory = path.join(
      process.cwd(),
      "data",
      "xauusd"
    );

    if (!fs.existsSync(dataDirectory)) {
      return NextResponse.json(
        {
          error:
            "data/xauusd folder does not exist.",
        },
        { status: 404 }
      );
    }

    const files = fs
      .readdirSync(dataDirectory)
      .filter((file) =>
        file.toLowerCase().endsWith(".csv")
      )
      .sort();

    if (files.length === 0) {
      return NextResponse.json(
        {
          error:
            "No CSV files found inside data/xauusd.",
        },
        { status: 404 }
      );
    }

    let allCandles: Candle[] = [];

    const fileResults: {
      file: string;
      candles: number;
    }[] = [];

    for (const file of files) {
      const filePath = path.join(dataDirectory, file);

      const content = fs.readFileSync(
        filePath,
        "utf8"
      );

      const candles = parseCSV(content);

      allCandles.push(...candles);

      fileResults.push({
        file,
        candles: candles.length,
      });
    }

    // Remove duplicate timestamps
    const candleMap = new Map<number, Candle>();

    for (const candle of allCandles) {
      candleMap.set(candle.time, candle);
    }

    allCandles = Array.from(candleMap.values());

    // Sort oldest → newest
    allCandles.sort(
      (a, b) => a.time - b.time
    );

    const result = {
      symbol: "XAUUSD",
      files,
      fileResults,
      candles1m: allCandles,
      candleCount: allCandles.length,
      startTime:
        allCandles.length > 0
          ? allCandles[0].time
          : null,
      endTime:
        allCandles.length > 0
          ? allCandles[allCandles.length - 1].time
          : null,
      timeframes: {
        "1m": allCandles,
        "5m": aggregateCandles(
          allCandles,
          5
        ),
        "15m": aggregateCandles(
          allCandles,
          15
        ),
        "30m": aggregateCandles(
          allCandles,
          30
        ),
        "1h": aggregateCandles(
          allCandles,
          60
        ),
        "4h": aggregateCandles(
          allCandles,
          240
        ),
        "1d": aggregateCandles(
          allCandles,
          1440
        ),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to read historical data.",
      },
      { status: 500 }
    );
  }
}