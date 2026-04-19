import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceArea,
} from "recharts";

interface StockData {
  "Date Time": string;
  GainLoss: number;
}

interface Props {
  company: string;
}

interface FormattedStockData extends StockData {
  Gain: number;
  Loss: number;
  timestamp: number;
}

const GainLossChart = ({ company }: Props) => {
  const [data, setData] = useState<FormattedStockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStartTime, setRefStartTime] = useState<number | null>(null);
  const [refEndTime, setRefEndTime] = useState<number | null>(null);

 useEffect(() => {
    // 1. Create a variable to track if the component is still mounted
    let isMounted = true;

    const fetchData = async () => {
      // 2. We only set loading if we aren't already loading 
      // or we handle it inside the async flow
      try {
        const response = await fetch(`http://46.101.3.179:5000/api/GainLoss/${company}`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const jsonData: StockData[] = await response.json();
        
        if (isMounted) {
          const parsedData = jsonData
            .filter((row) => row["Date Time"] && row.GainLoss != null)
            .sort((a, b) => new Date(a["Date Time"]).getTime() - new Date(b["Date Time"]).getTime())
            .map((row) => ({
              ...row,
              Gain: row.GainLoss >= 0 ? row.GainLoss : 0,
              Loss: row.GainLoss < 0 ? row.GainLoss : 0,
              timestamp: new Date(row["Date Time"]).getTime(),
            }));

          setData(parsedData);
          setStartIndex(0);
          setEndIndex(parsedData.length > 1 ? parsedData.length - 1 : 0);
          setLoading(false); // Set to false only when data arrives
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (isMounted) {
          setData([]);
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function to prevent memory leaks/state updates on unmounted components
    return () => { isMounted = false; };
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

  const generateXTicks = (data: FormattedStockData[], start: number, end: number) => {
    if (!data.length) return [];
    const visible = data.slice(start, end + 1);
    if (visible.length === 0) return [];
    
    const step = Math.ceil(visible.length / 12);
    const middleTicks = visible.filter((_, i) => i % step === 0).map(d => d.timestamp);
    
    return [
      visible[0].timestamp,
      ...middleTicks.filter(
        t => t !== visible[0].timestamp && t !== visible[visible.length - 1].timestamp
      ),
      visible[visible.length - 1].timestamp,
    ];
  };

  // --- STYLED PLACEHOLDER FOR NO DATA ---
  if (!loading && (!data || data.length === 0)) {
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
        <div style={{ fontSize: '40px', marginBottom: '15px', opacity: 0.5 }}>📉</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#f44336', fontSize: '18px' }}>
          Gain/Loss Data Processing
        </h3>
        <p style={{ margin: 0, fontSize: '13px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.6' }}>
          Historical performance metrics for <strong>{company}</strong> are being calculated.<br/> 
          Check back in <strong>24 hours</strong> for full analytics.
        </p>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4caf50' }}>
        <div>Calculating gains and losses...</div>
      </div>
    );
  }

  return (
    <div onDoubleClick={resetZoom} style={{ userSelect: "none" }}>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart
          data={data}
          onMouseDown={(e) => { if (e?.activeLabel) setRefStartTime(Number(e.activeLabel)); }}
          onMouseMove={(e) => { if (refStartTime !== null && e?.activeLabel) setRefEndTime(Number(e.activeLabel)); }}
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
            tickFormatter={(time) =>
              new Date(time).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
            }
          />

          <YAxis
            tick={{ fill: '#888', fontSize: 12 }}
            label={{
              value: "Gain / Loss (USD)",
              angle: -90,
              position: "insideLeft",
              style: { fontWeight: "bold", fontSize: 12, fill: "#888" }
            }}
          />

          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
            itemStyle={{ fontSize: '13px' }}
            labelFormatter={(label) =>
              typeof label === "number"
                ? new Date(label).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                : label
            }
          />

          <Legend verticalAlign="top" align="center" height={36} />

          <Bar dataKey="Gain" name="Gain" fill="#4caf50" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="Loss" name="Loss" fill="#f44336" radius={[0, 0, 4, 4]} barSize={20} />

          {refStartTime !== null && refEndTime !== null && (
            <ReferenceArea x1={refStartTime} x2={refEndTime} fill="rgba(255,255,255,0.1)" strokeOpacity={0.3} />
          )}

          <Brush
            dataKey="timestamp"
            height={30}
            startIndex={startIndex}
            endIndex={endIndex}
            stroke="#444"
            fill="rgba(0,0,0,0.2)"
            tickFormatter={(time) =>
              new Date(time).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
            }
            onChange={(e) => {
              if (e?.startIndex !== undefined && e?.endIndex !== undefined) {
                setStartIndex(e.startIndex);
                setEndIndex(e.endIndex);
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GainLossChart;