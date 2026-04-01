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
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [refStartTime, setRefStartTime] = useState<number | null>(null);
  const [refEndTime, setRefEndTime] = useState<number | null>(null);

  // FETCH DATA FROM API
  useEffect(() => {
    fetch(`http://46.101.3.179:5000/api/stocks/${company}`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((result: StockApiResponse[]) => {
        //  CLEAN + VALIDATE DATA
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

        //  REMOVE DUPLICATE TIMESTAMPS
        const uniqueData = Array.from(
          new Map(formatted.map((item) => [item.timestamp, item])).values()
        );

        setData(uniqueData);
        setStartIndex(0);
        setEndIndex(uniqueData.length - 1);

        // reset zoom
        setRefStartTime(null);
        setRefEndTime(null);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      });
  }, [company]);

  //  ZOOM HANDLER
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

  //  RESET ZOOM
  const resetZoom = () => {
    setStartIndex(0);
    setEndIndex(data.length - 1);
  };

  //  SAFE TICKS (NO DUPLICATES)
  const generateXTicks = (data: StockData[], start: number, end: number) => {
    if (!data.length) return [];

    const visible = data.slice(start, end + 1);
    if (!visible.length) return [];

    const step = Math.ceil(visible.length / 12);

    const ticks = [
      visible[0].timestamp,
      ...visible
        .filter((_, i) => i % step === 0)
        .map((d) => d.timestamp),
      visible[visible.length - 1].timestamp
    ];

    return [...new Set(ticks)];
  };

  //  PREVENT EMPTY RENDER
  if ( ! data || data.length === 0) {
    return <div>No valid data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart
        data={data}
        syncId="stockSync"
        onMouseDown={(e) => {
          if (e?.activeLabel) setRefStartTime(Number(e.activeLabel));
        }}
        onMouseMove={(e) => {
          if (refStartTime !== null && e?.activeLabel) {
            setRefEndTime(Number(e.activeLabel));
          }
        }}
        onMouseUp={handleZoom}
        onDoubleClick={resetZoom}
      >
        <CartesianGrid stroke="#ccc" />

        {/*  X AXIS */}
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          ticks={generateXTicks(data, startIndex, endIndex)}
          tickFormatter={(time) =>
            new Date(time).toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit"
            })
          }
        />

        {/*  Y AXIS */}
        <YAxis
            tickFormatter={(value) => `${value}`}
            label={{
              value: "Price (USD)",
              angle: -90,
              position: "insideLeft",
              style: { fontWeight: "bold", fontSize: 14, fill: "#555" }
            }}
          />

        {/*  TOOLTIP */}
        <Tooltip
          labelFormatter={(label) =>
            new Date(Number(label)).toLocaleDateString()
          }
        />

        <Legend verticalAlign="top" align="center" />

        {/*  LINES */}
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

        {/*  SAFE REFERENCE AREA */}
        {refStartTime !== null &&
          refEndTime !== null && (
            <ReferenceArea
              x1={refStartTime}
              x2={refEndTime}
              strokeOpacity={0.3}
              fill = "#8884D8"
            />
          )}

        {/*  BRUSH */}
        <Brush
          dataKey="timestamp"
          height={35}
          startIndex={startIndex}
          endIndex={endIndex}
          travellerWidth={10}
          onChange={(e) => {
            if (
              e &&
              typeof e.startIndex === "number" &&
              typeof e.endIndex === "number" &&
              e.startIndex >= 0 &&
              e.endIndex < data.length
            ) {
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