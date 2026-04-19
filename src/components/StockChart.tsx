import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Brush,
  ReferenceArea
} from "recharts";

interface StockData {
  "Date Time": string;
  Close: number;
  Predicted: number;
  timestamp: number;
}

interface Props {
  company: string;
}

interface StockApiResponse {
  "Date Time": string;
  Close: number;
  Predicted: number;
}

const StockChart = ({ company }: Props) => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true); // Fixed: Start as true
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStartTime, setRefStartTime] = useState<number | null>(null);
  const [refEndTime, setRefEndTime] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchStockData = async () => {
      try {
        const res = await fetch(`http://46.101.3.179:5000/api/stocks/${company}`);
        if (!res.ok) throw new Error("API error");
        
        const result: StockApiResponse[] = await res.json();

        if (isMounted) {
          const formatted: StockData[] = result
            .filter(
              (r) =>
                r["Date Time"] &&
                r.Close != null &&
                r.Predicted != null &&
                !isNaN(new Date(r["Date Time"]).getTime())
            )
            .map((r) => ({
              ...r,
              Close: Number(r.Close),
              Predicted: Number(r.Predicted),
              timestamp: new Date(r["Date Time"]).getTime()
            }));

          const uniqueData = Array.from(
            new Map(formatted.map((item) => [item.timestamp, item])).values()
          ).sort((a, b) => a.timestamp - b.timestamp);

          setData(uniqueData);
          setStartIndex(0);
          setEndIndex(uniqueData.length > 0 ? uniqueData.length - 1 : 0);
          
          setRefStartTime(null);
          setRefEndTime(null);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (isMounted) setData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStockData();

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
    if (!visible.length) return [];

    const step = Math.ceil(visible.length / 12);
    const ticks = [
      visible[0].timestamp,
      ...visible.filter((_, i) => i % step === 0).map((d) => d.timestamp),
      visible[visible.length - 1].timestamp
    ];

    return [...new Set(ticks)];
  };

  if (!loading && data.length === 0) {
    return (
      <div style={{ 
        height: 450, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px',
        border: '1px dashed rgba(255, 255, 255, 0.1)', color: '#888', padding: '20px'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '15px', opacity: 0.5 }}>📉</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '18px' }}>No Pricing Data</h3>
        <p style={{ margin: 0, fontSize: '13px', textAlign: 'center', maxWidth: '300px' }}>
          Historical prices for <strong>{company}</strong> are still processing. Check back in 24 hours.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2' }}>
        <div>Loading market trends...</div>
      </div>
    );
  }

  return (
    <div onDoubleClick={resetZoom} style={{ userSelect: "none" }}>
      <ResponsiveContainer width="100%" height={450}>
        <LineChart
          data={data}
          syncId="stockSync"
          onMouseDown={(e) => { if (e?.activeLabel) setRefStartTime(Number(e.activeLabel)); }}
          onMouseMove={(e) => {
            if (refStartTime !== null && e?.activeLabel) setRefEndTime(Number(e.activeLabel));
          }}
          onMouseUp={handleZoom}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />

          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={generateXTicks(data, startIndex, endIndex)}
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={(time) => new Date(time).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
          />

          <YAxis
            tick={{ fill: '#888', fontSize: 12 }}
            label={{ value: "Price (USD)", angle: -90, position: "insideLeft", style: { fontWeight: "bold", fontSize: 12, fill: "#888" } }}
          />

          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
            labelFormatter={(label) => new Date(Number(label)).toLocaleDateString()}
          />

          <Legend verticalAlign="top" align="center" height={36} />

          <Line
            type="monotone"
            dataKey="Close"
            name="Actual Price"
            stroke="#1976d2"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Predicted"
            name="Predicted Price"
            stroke="#ff9800"
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
            tickFormatter={(time) => new Date(time).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
            onChange={(e) => {
              if (e && typeof e.startIndex === "number" && typeof e.endIndex === "number") {
                setStartIndex(e.startIndex);
                setEndIndex(e.endIndex);
              }
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;