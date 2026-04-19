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
  const [loading, setLoading] = useState(true); // Initialize as true
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStartTime, setRefStartTime] = useState<number | null>(null);
  const [refEndTime, setRefEndTime] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchCumulativeData = async () => {
      try {
        const res = await fetch(`http://46.101.3.179:5000/api/CommulativeGainLoss/${company}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        
        const jsonData: DBCommulativeRow[] = await res.json();

        if (isMounted) {
          const filtered: StockData[] = jsonData
            .filter((row) => row["Date Time"] && row.CumulativeGainLoss != null)
            .map((row) => ({
              "Date Time": row["Date Time"],
              timestamp: new Date(row["Date Time"]).getTime(),
              CumulativeGainLoss: Number(row.CumulativeGainLoss),
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

          setData(filtered);
          setStartIndex(0);
          setEndIndex(filtered.length > 0 ? filtered.length - 1 : 0);
        }
      } catch (err) {
        console.error("Commulative Fetch Error:", err);
        if (isMounted) setData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCumulativeData();

    return () => {
      isMounted = false;
    };
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
    if (visible.length === 0) return [];

    const step = Math.ceil(visible.length / 12);
    const middleTicks = visible.filter((_, i) => i % step === 0).map(d => d.timestamp);
    
    return [
      visible[0].timestamp,
      ...middleTicks.filter(t => t !== visible[0].timestamp && t !== visible[visible.length - 1].timestamp),
      visible[visible.length - 1].timestamp,
    ];
  };

  // --- STYLED PLACEHOLDER FOR NO DATA ---
  if (!loading && data.length === 0) {
    return (
      <div style={{ 
        height: 450, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        color: '#888',
        padding: '20px'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '15px', opacity: 0.5 }}>📈</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '18px' }}>
          Cumulative Analysis Pending
        </h3>
        <p style={{ margin: 0, fontSize: '13px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.6' }}>
          Compiling directional performance history for <strong>{company}</strong>.<br/> 
          Full visualization typically populates within <strong>24 hours</strong>.
        </p>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2' }}>
        <div>Compiling cumulative performance data...</div>
      </div>
    );
  }
  
  return (
    <div onDoubleClick={resetZoom} style={{ userSelect: "none" }}>
      <ResponsiveContainer width="100%" height={450}>
        <AreaChart
          data={data}
          syncId="stockSync"
          onMouseDown={(e) => { if (e?.activeLabel) setRefStartTime(Number(e.activeLabel)); }}
          onMouseMove={(e) => { if (refStartTime !== null && e?.activeLabel) setRefEndTime(Number(e.activeLabel)); }}
          onMouseUp={handleZoom}
        >
          <defs>
            <linearGradient id="colorGainLoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1976d2" stopOpacity={0.7} />
              <stop offset="40%" stopColor="#1976d2" stopOpacity={0.35} />
              <stop offset="75%" stopColor="#1976d2" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#1976d2" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={generateXTicks(data, startIndex, endIndex)}
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={(time) => new Date(time).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
            label={{ value: "Date (Month / Year)", position: "insideBottom", offset: -20, style: { fontWeight: "bold", fontSize: 12, fill: "#888" } }}
          />
          <YAxis
            tick={{ fill: '#888', fontSize: 12 }}
            label={{ value: "Cumulative Performance", angle: -90, position: "insideLeft", style: { fontWeight: "bold", fontSize: 12, fill: "#888" } }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
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
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          {refStartTime !== null && refEndTime !== null && (
            <ReferenceArea x1={refStartTime} x2={refEndTime} strokeOpacity={0.3} fill="#1976d2" />
          )}
          <Brush
            dataKey="timestamp"
            height={30}
            startIndex={startIndex}
            endIndex={endIndex}
            stroke="#444"
            fill="rgba(0,0,0,0.2)"
            tickFormatter={(time) => new Date(time).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
            onChange={(e) => {
              if (e?.startIndex !== undefined && e?.endIndex !== undefined) {
                setStartIndex(e.startIndex);
                setEndIndex(e.endIndex);
              }
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CommulativeChart;