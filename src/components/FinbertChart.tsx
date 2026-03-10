import { useEffect, useState } from "react";
import Papa from "papaparse";
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

interface StockData {
  "Date Time": string;
  finbert_sentiment_score: number;
  timestamp: number;
}

interface CSVRow {
  "Date Time": string;
  finbert_sentiment_score: string | number;
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
    fetch(`/data/${company}.csv`)
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse<CSVRow>(csvText, {
          header: true,
          skipEmptyLines: true,
        });

        const filtered: StockData[] = result.data
          .filter((row) => row["Date Time"])
          .map((row) => ({
            "Date Time": row["Date Time"],
            timestamp: new Date(row["Date Time"]).getTime(),
            finbert_sentiment_score:
              row.finbert_sentiment_score !== "" &&
              row.finbert_sentiment_score != null
                ? Number(row.finbert_sentiment_score)
                : 0,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        setData(filtered);
        setStartIndex(0);
        setEndIndex(filtered.length - 1);
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
    const totalPoints = visible.length;
    const maxTicks = 12;

    const step = Math.ceil(totalPoints / maxTicks);

    const middleTicks = visible
      .filter((_, i) => i % step === 0)
      .map((d) => d.timestamp);

    return [
      visible[0].timestamp,
      ...middleTicks.filter(
        (t) =>
          t !== visible[0].timestamp &&
          t !== visible[visible.length - 1].timestamp
      ),
      visible[visible.length - 1].timestamp,
    ];
  };

  if (!data.length) return <div>Loading chart...</div>;

  return (
    <div onDoubleClick={resetZoom}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data} syncId="stockSync"
          onMouseDown={(e) =>
            e?.activeLabel && setRefStart(Number(e.activeLabel))
          }
          onMouseMove={(e) => {
            if (refStart !== null && e?.activeLabel) {
              setRefEnd(Number(e.activeLabel));
            }
          }}
          onMouseUp={handleZoom}
        >
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />

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
              offset: -10,
              style: { fontWeight: "bold", fontSize: 14, fill: "#555" },
            }}
          />

          <YAxis
            type="number"
            domain={[-1, 1]}
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

          <Legend verticalAlign="top" align="center" />

          <Line
            type="monotone"
            dataKey="finbert_sentiment_score"
            name="FinBERT Sentiment Score"
            stroke="#ff9800"
            strokeWidth={3}
            dot={false}
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