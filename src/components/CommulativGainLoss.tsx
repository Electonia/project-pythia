import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Brush,
  ReferenceArea,
} from "recharts";

// 1. Define the chart data shape
interface StockData {
  "Date Time": string;
  CumulativeGainLoss: number;
  timestamp: number;
}

// 2. Define the expected shape from your SQL API
interface DBCommulativeRow {
  "Date Time": string;
  CumulativeGainLoss: number | string | null;
}

interface Props {
  company: string;
}

const CommulativeChart = ({ company }: Props) => {
  const [data, setData] = useState<StockData[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStartTime, setRefStartTime] = useState<number | null>(null);
  const [refEndTime, setRefEndTime] = useState<number | null>(null);

  useEffect(() => {
    // Fetch JSON directly from your API
    fetch(`http://46.101.3.179:5000/api/CommulativeGainLoss/${company}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((jsonData: DBCommulativeRow[]) => {
        const filtered: StockData[] = jsonData
          .filter((row) => row["Date Time"] && row.CumulativeGainLoss != null)
          .map((row) => ({
            "Date Time": row["Date Time"],
            timestamp: new Date(row["Date Time"]).getTime(),
            CumulativeGainLoss: Number(row.CumulativeGainLoss),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        if (filtered.length > 0) {
          setData(filtered);
          setStartIndex(0);
          setEndIndex(filtered.length - 1);
        }
      })
      .catch((err) => console.error("Commulative Fetch Error:", err));
  }, [company]);

  const handleZoom = () => {
    if (refStartTime === null || refEndTime === null) return;
    const minTime = Math.min(refStartTime, refEndTime);
    const maxTime = Math.max(refStartTime, refEndTime);

    const newStartIndex = data.findIndex((d) => d.timestamp >= minTime);
    const newEndIndex = data.findIndex((d) => d.timestamp >= maxTime);

    setStartIndex(newStartIndex !== -1 ? newStartIndex : 0);
    setEndIndex(newEndIndex !== -1 ? newEndIndex : data.length - 1);
    setRefStartTime(null);
    setRefEndTime(null);
  };

  const resetZoom = () => {
    setStartIndex(0);
    setEndIndex(data.length - 1);
  };

  const generateXTicks = (data: StockData[], start: number, end: number) => {
    if (!data.length) return [];
    const visible = data.slice(start, end + 1);
    const step = Math.ceil(visible.length / 12);
    const middleTicks = visible.filter((_, i) => i % step === 0).map(d => d.timestamp);
    
    return [
      visible[0].timestamp,
      ...middleTicks.filter(t => t !== visible[0].timestamp && t !== visible[visible.length - 1].timestamp),
      visible[visible.length - 1].timestamp,
    ];
  };

  if (!data.length) return <div style={{ padding: "20px", color: "#666" }}>Loading Cumulative Data...</div>;

  return (
    <div onDoubleClick={resetZoom} style={{ userSelect: "none" }}>
      <ResponsiveContainer width="100%" height={450}>
        <AreaChart
          data={data}
          syncId="stockSync" // Must match your other charts to sync scrolling/tooltips
          onMouseDown={(e) => { if (e?.activeLabel) setRefStartTime(Number(e.activeLabel)); }}
          onMouseMove={(e) => { if (refStartTime !== null && e?.activeLabel) setRefEndTime(Number(e.activeLabel)); }}
          onMouseUp={handleZoom}
        >
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={generateXTicks(data, startIndex, endIndex)}
            tickFormatter={(time) => new Date(time).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
            label={{ value: "Date (Month / Year)", position: "insideBottom", offset: -10, style: { fontWeight: "bold", fontSize: 14, fill: "#555" } }}
          />
          <YAxis
            label={{ value: "Cumulative Performance", angle: -90, position: "insideLeft", style: { fontWeight: "bold", fontSize: 14, fill: "#555" } }}
          />
          <Tooltip
            labelFormatter={(label) => typeof label === "number" 
              ? new Date(label).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) 
              : label}
          />
          <Legend verticalAlign="top" align="center" height={36} />
          <Area
            type="monotone"
            dataKey="CumulativeGainLoss"
            name="Cumulative Directional Performance"
            stroke="#1976d2"
            fill="url(#colorGainLoss)"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
          {refStartTime !== null && refEndTime !== null && (
            <ReferenceArea x1={refStartTime} x2={refEndTime} strokeOpacity={0.3} fill="#1976d2" />
          )}
          <Brush
            dataKey="timestamp"
            height={35}
            startIndex={startIndex}
            endIndex={endIndex}
            stroke="#1976d2"
            travellerWidth={10}
            tickFormatter={(time) => new Date(time).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
            onChange={(e) => {
              if (e?.startIndex !== undefined && e?.endIndex !== undefined) {
                setStartIndex(e.startIndex);
                setEndIndex(e.endIndex);
              }
            }}
          />
          <defs>
            <linearGradient id="colorGainLoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1976d2" stopOpacity={0.4} />
              <stop offset="75%" stopColor="#1976d2" stopOpacity={0.05} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CommulativeChart;