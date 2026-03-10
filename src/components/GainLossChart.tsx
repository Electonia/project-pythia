import { useEffect, useState } from "react";
import Papa from "papaparse";
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
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStartTime, setRefStartTime] = useState<number | null>(null);
  const [refEndTime, setRefEndTime] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/data/${company}.csv`)
      .then((response) => response.text())
      .then((csvText) => {
        const result = Papa.parse<StockData>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        const parsedData = result.data
          .filter((row) => row["Date Time"] && row.GainLoss != null)
          .sort(
            (a, b) =>
              new Date(a["Date Time"]).getTime() -
              new Date(b["Date Time"]).getTime()
          )
          .map((row) => ({
            ...row,
            Gain: row.GainLoss >= 0 ? row.GainLoss : 0,
            Loss: row.GainLoss < 0 ? row.GainLoss : 0,
            timestamp: new Date(row["Date Time"]).getTime(),
          }));

        setData(parsedData);
        setStartIndex(0);
        setEndIndex(parsedData.length - 1);
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

  const generateXTicks = (data: FormattedStockData[], start: number, end: number) => {
    if (!data.length) return [];
    const visible = data.slice(start, end + 1);
    const totalPoints = visible.length;
    const maxTicks = 12;
    const step = Math.ceil(totalPoints / maxTicks);
    const middleTicks = visible.filter((_, i) => i % step === 0).map(d => d.timestamp);
    const ticks = [
      visible[0].timestamp,
      ...middleTicks.filter(
        t => t !== visible[0].timestamp && t !== visible[visible.length - 1].timestamp
      ),
      visible[visible.length - 1].timestamp,
    ];
    return ticks;
  };

  return (
    <div onDoubleClick={resetZoom}>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart
          data={data}
          onMouseDown={(e) => { if (e?.activeLabel) setRefStartTime(Number(e.activeLabel)); }}
          onMouseMove={(e) => { if (refStartTime !== null && e?.activeLabel) setRefEndTime(Number(e.activeLabel)); }}
          onMouseUp={handleZoom}
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
              new Date(time).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
            }
            label={{
              value: "Date (Day / Month)",
              position: "insideBottom",
              offset: -10,
              style: { fontWeight: "bold", fontSize: 14, fill: "#555" }
            }}
          />

          {/* Y-axis with styling */}
          <YAxis
            tickFormatter={(value) => `${value}`}
            label={{
              value: "Gain / Loss (USD)",
              angle: -90,
              position: "insideLeft",
              style: { fontWeight: "bold", fontSize: 14, fill: "#555" }
            }}
          />

          <Tooltip
            formatter={(value?: number, name?: string) =>
              value !== undefined ? [value, name] : ["-", name]
            }
            labelFormatter={(label) =>
              typeof label === "number"
                ? new Date(label).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                : label
            }
          />

          <Legend verticalAlign="top" align="center" />

          {/* Gain / Loss Bars */}
          <Bar dataKey="Gain" name="Gain" fill="#4caf50" radius={[8, 8, 0, 0]} barSize={20} />
          <Bar dataKey="Loss" name="Loss" fill="#f44336" radius={[8, 8, 0, 0]} barSize={20} />

          {/* Drag selection area */}
          {refStartTime !== null && refEndTime !== null && (
            <ReferenceArea x1={refStartTime} x2={refEndTime} strokeOpacity={0.3} />
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