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

const StockChart = ({ company }: Props) => {
  const [data, setData] = useState<StockData[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStartTime, setRefStartTime] = useState<number | null>(null);
  const [refEndTime, setRefEndTime] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/data/${company}.csv`)
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        const filtered = (result.data as StockData[])
          .filter((r) => r["Date Time"] && r.Close != null)
          .map((r) => ({
            ...r,
            timestamp: new Date(r["Date Time"]).getTime()
          }));

        setData(filtered);
        setStartIndex(0);
        setEndIndex(filtered.length - 1);
      });
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
    const totalPoints = visible.length;

    const maxTicks = 12;
    const step = Math.ceil(totalPoints / maxTicks);

    const middleTicks = visible
      .filter((_, i) => i % step === 0)
      .map(d => d.timestamp);

    const ticks = [
      visible[0].timestamp,
      ...middleTicks.filter(
        t => t !== visible[0].timestamp && t !== visible[visible.length - 1].timestamp
      ),
      visible[visible.length - 1].timestamp
    ];

    return ticks;
  };

  return (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart
        data={data} syncId="stockSync"
        onMouseDown={(e) => { if (e?.activeLabel) setRefStartTime(Number(e.activeLabel)); }}
        onMouseMove={(e) => { if (refStartTime !== null && e?.activeLabel) setRefEndTime(Number(e.activeLabel)); }}
        onMouseUp={handleZoom}
        onDoubleClick={resetZoom}
      >
        <CartesianGrid stroke="#ccc" />

        {/* X-axis with label */}
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          ticks={generateXTicks(data, startIndex, endIndex)}
          tickFormatter={(time) =>
            new Date(time).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          }
          label={{
            value: "Date (Month / Year)",
            position: "insideBottom",
            offset: -10,
            style: { fontWeight: "bold", fontSize: 14, fill: "#555" }
          }}
        />

        <YAxis
          label={{
            value: "Price (USD)",
            angle: -90,
            position: "insideLeft",
            style: { fontWeight: "bold", fontSize: 14, fill: "#555" }
          }}
        />

        <Tooltip
          labelFormatter={(label) => {
            if (typeof label === "number") {
              return new Date(label).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "2-digit"
              });
            }
            return label;
          }}
        />

        <Legend verticalAlign="top" align="center" />

        <Line
          type="monotone"
          dataKey="Close"
          name="Actual Price"
          stroke="#1976d2"
          strokeWidth={3}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Predicted"
          name="Predicted Price"
          stroke="#ff9800"
          strokeWidth={3}
          dot={false}
        />

        {/* Drag selection */}
        {refStartTime !== null && refEndTime !== null && (
          <ReferenceArea
            x1={refStartTime}
            x2={refEndTime}
            strokeOpacity={0.3}
          />
        )}

        {/* Brush slider with styling */}
        <Brush
          dataKey="timestamp"
          height={35}
          startIndex={startIndex}
          endIndex={endIndex}
          stroke="#8884d8"
          travellerWidth={10}
          tickFormatter={(time) =>
            new Date(time).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
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
  );
};

export default StockChart;