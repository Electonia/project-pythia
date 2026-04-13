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
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStart, setRefStart] = useState<number | null>(null);
  const [refEnd, setRefEnd] = useState<number | null>(null);

  useEffect(() => {
    // Fetch from your Node.js API
    fetch(`http://46.101.3.179:5000/api/Finbert/${company}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
      })
      .then((jsonData: DBFinbertRow[]) => {
        // Map Database rows to Chart format
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

        if (parsedData.length > 0) {
          setData(parsedData);
          setStartIndex(0);
          setEndIndex(parsedData.length - 1);
        }
      })
      .catch((err) => {
        console.error("Finbert Fetch Error:", err);
      });
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

  if (!data.length) return <div style={{ padding: "20px", color: "#666" }}>Loading FinBERT Sentiment Data...</div>;

  return (
    <div onDoubleClick={resetZoom} style={{ userSelect: "none" }}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data} 
          syncId="stockSync" // Allows syncing with GainLoss chart
          onMouseDown={(e) => e?.activeLabel && setRefStart(Number(e.activeLabel))}
          onMouseMove={(e) => {
            if (refStart !== null && e?.activeLabel) {
              setRefEnd(Number(e.activeLabel));
            }
          }}
          onMouseUp={handleZoom}
        >
          <CartesianGrid stroke="#ccc" />

          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={generateXTicks(data, startIndex, endIndex)}
            tickFormatter={(time) =>
              new Date(time).toLocaleDateString("en-GB", {
                month: "short",
                year: "2-digit",
              })
            }
            label={{
              value: "Date (Month / Year)",
              position: "insideBottom",
              offset: -20,
              style: { fontWeight: "bold", fontSize: 14, fill: "#555" },
            }}
          />

          <YAxis
            type="number"
            domain={[-1, 1]} // Sentiment range is usually -1 to 1
            label={{
              value: "FinBERT Score",
              angle: -90,
              position: "insideLeft",
              style: { fontWeight: "bold", fontSize: 14, fill: "#555" },
            }}
          />

          <Tooltip
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
            strokeWidth={3}
            dot={false}
            isAnimationActive={false} // Improves performance during zoom/sync
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
            height={35}
            startIndex={startIndex}
            endIndex={endIndex}
            stroke="#ff9800"
            travellerWidth={10}
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