"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  CircleDollarSign,
  Crosshair,
  Percent,
  ArrowLeftRight,
  Clock3,
} from "lucide-react";

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState("position");

  return (
    <div className="min-h-screen bg-[#0a0d12] px-6 py-8 text-white lg:ml-64">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Trading Tools</h1>
        <p className="mt-2 text-sm text-gray-500">
          Useful calculators and tools for better trade planning
        </p>
      </div>

      {/* Tool Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ToolCard
          title="Position Size"
          description="Calculate your ideal lot size"
          icon={Calculator}
          active={activeTool === "position"}
          onClick={() => setActiveTool("position")}
        />

        <ToolCard
          title="Risk / Reward"
          description="Calculate your trade risk and reward"
          icon={Crosshair}
          active={activeTool === "risk"}
          onClick={() => setActiveTool("risk")}
        />

        <ToolCard
          title="Pip Calculator"
          description="Calculate pip value"
          icon={CircleDollarSign}
          active={activeTool === "pip"}
          onClick={() => setActiveTool("pip")}
        />

        <ToolCard
          title="Risk Calculator"
          description="Calculate risk percentage"
          icon={Percent}
          active={activeTool === "riskpercent"}
          onClick={() => setActiveTool("riskpercent")}
        />

        <ToolCard
          title="Trade Planner"
          description="Plan your entry and exit"
          icon={ArrowLeftRight}
          active={activeTool === "planner"}
          onClick={() => setActiveTool("planner")}
        />

        <ToolCard
          title="Trading Sessions"
          description="View major market sessions"
          icon={Clock3}
          active={activeTool === "sessions"}
          onClick={() => setActiveTool("sessions")}
        />
      </div>

      {/* Active Tool */}
      <div className="rounded-2xl border border-white/10 bg-[#11151c] p-6">
        {activeTool === "position" && <PositionSizeCalculator />}

        {activeTool === "risk" && <RiskRewardCalculator />}

        {activeTool === "pip" && <PipCalculator />}

        {activeTool === "riskpercent" && (
          <RiskPercentageCalculator />
        )}

        {activeTool === "planner" && <TradePlanner />}

        {activeTool === "sessions" && <TradingSessions />}
      </div>
    </div>
  );
}

/* =====================================================
   TOOL CARD
===================================================== */

function ToolCard({
  title,
  description,
  icon: Icon,
  active,
  onClick,
}: {
  title: string;
  description: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? "border-yellow-400/40 bg-yellow-400/[0.06]"
          : "border-white/10 bg-[#11151c] hover:border-white/20 hover:bg-white/[0.03]"
      }`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
          active
            ? "bg-yellow-400 text-black"
            : "bg-white/[0.06] text-gray-400"
        }`}
      >
        <Icon size={21} />
      </div>

      <h3 className="font-semibold">{title}</h3>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </button>
  );
}

/* =====================================================
   POSITION SIZE CALCULATOR
===================================================== */

function PositionSizeCalculator() {
  const [balance, setBalance] = useState("");
  const [risk, setRisk] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const result = useMemo(() => {
    const account = Number(balance);
    const riskPercent = Number(risk);
    const sl = Number(stopLoss);

    if (
      !account ||
      !riskPercent ||
      !sl ||
      account <= 0 ||
      riskPercent <= 0 ||
      sl <= 0
    ) {
      return null;
    }

    const riskAmount = account * (riskPercent / 100);

    const lotSize = riskAmount / (sl * 100);

    return {
      riskAmount,
      lotSize,
    };
  }, [balance, risk, stopLoss]);

  return (
    <CalculatorContainer
      title="Position Size Calculator"
      description="Calculate the lot size based on your account risk."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Input
          label="Account Balance ($)"
          value={balance}
          onChange={setBalance}
          placeholder="5000"
        />

        <Input
          label="Risk (%)"
          value={risk}
          onChange={setRisk}
          placeholder="1"
        />

        <Input
          label="Stop Loss (pips)"
          value={stopLoss}
          onChange={setStopLoss}
          placeholder="50"
        />
      </div>

      {result && (
        <ResultBox
          items={[
            [
              "Risk Amount",
              `$${result.riskAmount.toFixed(2)}`,
            ],
            [
              "Suggested Lot Size",
              result.lotSize.toFixed(2),
            ],
          ]}
        />
      )}
    </CalculatorContainer>
  );
}

/* =====================================================
   RISK REWARD
===================================================== */

function RiskRewardCalculator() {
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const result = useMemo(() => {
    const e = Number(entry);
    const sl = Number(stopLoss);
    const tp = Number(takeProfit);

    if (!e || !sl || !tp) return null;

    const risk = Math.abs(e - sl);
    const reward = Math.abs(tp - e);

    if (risk === 0) return null;

    return reward / risk;
  }, [entry, stopLoss, takeProfit]);

  return (
    <CalculatorContainer
      title="Risk / Reward Calculator"
      description="Calculate the potential reward compared with your risk."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Input
          label="Entry Price"
          value={entry}
          onChange={setEntry}
          placeholder="3500"
        />

        <Input
          label="Stop Loss"
          value={stopLoss}
          onChange={setStopLoss}
          placeholder="3490"
        />

        <Input
          label="Take Profit"
          value={takeProfit}
          onChange={setTakeProfit}
          placeholder="3520"
        />
      </div>

      {result !== null && (
        <ResultBox
          items={[
            [
              "Risk / Reward",
              `1 : ${result.toFixed(2)}`,
            ],
          ]}
        />
      )}
    </CalculatorContainer>
  );
}

/* =====================================================
   PIP CALCULATOR
===================================================== */

function PipCalculator() {
  const [lotSize, setLotSize] = useState("");
  const [pipSize, setPipSize] = useState("0.0001");

  const result = useMemo(() => {
    const lots = Number(lotSize);
    const pip = Number(pipSize);

    if (!lots || !pip) return null;

    const pipValue = lots * 100000 * pip;

    return pipValue;
  }, [lotSize, pipSize]);

  return (
    <CalculatorContainer
      title="Pip Calculator"
      description="Estimate the monetary value of one pip."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Lot Size"
          value={lotSize}
          onChange={setLotSize}
          placeholder="0.10"
        />

        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Pip Size
          </label>

          <select
            value={pipSize}
            onChange={(e) =>
              setPipSize(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-[#0a0d12] px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50"
          >
            <option value="0.0001">
              Forex - 0.0001
            </option>

            <option value="0.01">
              JPY - 0.01
            </option>
          </select>
        </div>
      </div>

      {result !== null && (
        <ResultBox
          items={[
            [
              "Approx. Pip Value",
              `$${result.toFixed(2)}`,
            ],
          ]}
        />
      )}
    </CalculatorContainer>
  );
}

/* =====================================================
   RISK PERCENTAGE
===================================================== */

function RiskPercentageCalculator() {
  const [balance, setBalance] = useState("");
  const [riskAmount, setRiskAmount] =
    useState("");

  const result = useMemo(() => {
    const b = Number(balance);
    const r = Number(riskAmount);

    if (!b || !r) return null;

    return (r / b) * 100;
  }, [balance, riskAmount]);

  return (
    <CalculatorContainer
      title="Risk Percentage Calculator"
      description="Find out what percentage of your account you are risking."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Account Balance ($)"
          value={balance}
          onChange={setBalance}
          placeholder="5000"
        />

        <Input
          label="Risk Amount ($)"
          value={riskAmount}
          onChange={setRiskAmount}
          placeholder="50"
        />
      </div>

      {result !== null && (
        <ResultBox
          items={[
            [
              "Risk Percentage",
              `${result.toFixed(2)}%`,
            ],
          ]}
        />
      )}
    </CalculatorContainer>
  );
}

/* =====================================================
   TRADE PLANNER
===================================================== */

function TradePlanner() {
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] =
    useState("LONG");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] =
    useState("");
  const [takeProfit, setTakeProfit] =
    useState("");

  return (
    <CalculatorContainer
      title="Trade Planner"
      description="Prepare your trade before entering the market."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Symbol"
          value={symbol}
          onChange={setSymbol}
          placeholder="XAUUSD"
        />

        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Direction
          </label>

          <select
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-[#0a0d12] px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50"
          >
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>

        <Input
          label="Entry"
          value={entry}
          onChange={setEntry}
          placeholder="3500"
        />

        <Input
          label="Stop Loss"
          value={stopLoss}
          onChange={setStopLoss}
          placeholder="3490"
        />

        <Input
          label="Take Profit"
          value={takeProfit}
          onChange={setTakeProfit}
          placeholder="3520"
        />
      </div>

      {symbol && entry && (
        <ResultBox
          items={[
            ["Symbol", symbol.toUpperCase()],
            ["Direction", direction],
            ["Entry", entry],
            ["Stop Loss", stopLoss || "-"],
            ["Take Profit", takeProfit || "-"],
          ]}
        />
      )}
    </CalculatorContainer>
  );
}

/* =====================================================
   TRADING SESSIONS
===================================================== */

function TradingSessions() {
  const sessions = [
    {
      name: "Sydney",
      time: "05:30 AM - 02:30 PM IST",
    },
    {
      name: "Tokyo / Asia",
      time: "05:30 AM - 02:30 PM IST",
    },
    {
      name: "London",
      time: "12:30 PM - 09:30 PM IST",
    },
    {
      name: "New York",
      time: "05:30 PM - 02:30 AM IST",
    },
  ];

  return (
    <CalculatorContainer
      title="Trading Sessions"
      description="Major forex market sessions in Indian Standard Time."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <div
            key={session.name}
            className="rounded-xl border border-white/10 bg-[#0a0d12] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {session.name}
              </span>

              <span className="rounded-lg bg-white/5 px-3 py-1 text-xs text-gray-400">
                IST
              </span>
            </div>

            <p className="mt-3 text-sm text-yellow-400">
              {session.time}
            </p>
          </div>
        ))}
      </div>
    </CalculatorContainer>
  );
}

/* =====================================================
   CONTAINERS
===================================================== */

function CalculatorContainer({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-400">
        {label}
      </label>

      <input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#0a0d12] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-yellow-400/50"
      />
    </div>
  );
}

function ResultBox({
  items,
}: {
  items: [string, string][];
}) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] p-5"
        >
          <p className="text-xs uppercase tracking-wider text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-yellow-400">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}