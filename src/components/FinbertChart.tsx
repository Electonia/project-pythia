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
  ReferenceArea,
} from "recharts";

// 1. Define the shape of the data used by the Chart
interface StockData {
  "Date Time": string;
  finbert_sentiment_score: number;
  timestamp: number;
}

// 2. Define the shape of the data coming from your SQL API
interface DBFinbertRow {
  "Date Time": string;
  finbert_sentiment_score: number | string | null;
}

interface Props {
  company: string;
}

const FinbertSentimentChart = ({ company }: Props) => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true); // Start as loading
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStart, setRefStart] = useState<number | null>(null);
  const [refEnd, setRefEnd] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchSentimentData = async () => {
      try {
        const res = await fetch(`http://46.101.3.179:5000/api/Finbert/${company}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        
        const jsonData: DBFinbertRow[] = await res.json();

        if (isMounted) {
          const parsedData: StockData[] = jsonData
            .filter((row) => row["Date Time"])
            .map((row) => ({
              "Date Time": row["Date Time"],
              timestamp: new Date(row["Date Time"]).getTime(),
              finbert_sentiment_score:
                row.finbert_sentiment_score != null
                  ? Number(row.finbert_sentiment_score)
                  : 0,
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

          setData(parsedData);
          setStartIndex(0);
          setEndIndex(parsedData.length > 0 ? parsedData.length - 1 : 0);
        }
      } catch (err) {
        console.error("Finbert Fetch Error:", err);
        if (isMounted) setData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSentimentData();

    return () => {
      isMounted = false;
    };
  }, [company]);

  const handleZoom = () => {
    if (refStart === null || refEnd === null) return;

    const minTime = Math.min(refStart, refEnd);
    const maxTime = Math.max(refStart, refEnd);

    const newStartIndex = data.findIndex((d) => d.timestamp >= minTime);
    const newEndIndex = data.findIndex((d) => d.timestamp >= maxTime);

    setStartIndex(newStartIndex !== -1 ? newStartIndex : 0);
    setEndIndex(newEndIndex !== -1 ? newEndIndex : data.length - 1);

    setRefStart(null);
    setRefEnd(null);
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
    const middleTicks = visible
      .filter((_, i) => i % step === 0)
      .map((d) => d.timestamp);

    return [
      visible[0].timestamp,
      ...middleTicks.filter(
        (t) => t !== visible[0].timestamp && t !== visible[visible.length - 1].timestamp
      ),
      visible[visible.length - 1].timestamp,
    ];
  };

  // --- STYLED PLACEHOLDER FOR NO DATA ---
  if (!loading && data.length === 0) {
    return (
      <div style={{ 
        height: 400, 
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
        <div style={{ fontSize: '40px', marginBottom: '15px', opacity: 0.5 }}>📊</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#ff9800', fontSize: '18px' }}>
          Sentiment Analysis Pending
        </h3>
        <p style={{ margin: 0, fontSize: '13px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.6' }}>
          AI is currently analyzing financial news sentiment for <strong>{company}</strong>.<br/> 
          Results typically populate within <strong>24 hours</strong>.
        </p>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff9800' }}>
        <div>Analyzing sentiment patterns...</div>
      </div>
    );
  }

  return (
    <div onDoubleClick={resetZoom} style={{ userSelect: "none" }}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data} 
          syncId="stockSync" 
          onMouseDown={(e) => e?.activeLabel && setRefStart(Number(e.activeLabel))}
          onMouseMove={(e) => {
            if (refStart !== null && e?.activeLabel) {
              setRefEnd(Number(e.activeLabel));
            }
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
            tickFormatter={(time) =>
              new Date(time).toLocaleDateString("en-GB", {
                month: "short",
                year: "2-digit",
              })
            }
          />

          <YAxis
            type="number"
            domain={[-1, 1]} 
            tick={{ fill: '#888', fontSize: 12 }}
            label={{
              value: "FinBERT Score",
              angle: -90,
              position: "insideLeft",
              style: { fontWeight: "bold", fontSize: 12, fill: "#888" },
            }}
          />

          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
            labelFormatter={(label) =>
              typeof label === "number"
                ? new Date(label).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                  })
                : label
            }
          />

          <Legend verticalAlign="top" align="center" height={36}/>

          <Line
            type="monotone"
            dataKey="finbert_sentiment_score"
            name="FinBERT Sentiment"
            stroke="#ff9800"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false} 
          />

          {refStart !== null && refEnd !== null && (
            <ReferenceArea
              x1={refStart}
              x2={refEnd}
              strokeOpacity={0.3}
              fill="#ff9800"
            />
          )}

          <Brush
            dataKey="timestamp"
            height={30}
            startIndex={startIndex}
            endIndex={endIndex}
            stroke="#444"
            fill="rgba(0,0,0,0.2)"
            tickFormatter={(time) =>
              new Date(time).toLocaleDateString("en-GB", {
                month: "short",
                year: "2-digit",
              })
            }
            onChange={(e) => {
              if (e?.startIndex !== undefined && e?.endIndex !== undefined) {
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

export default FinbertSentimentChart;