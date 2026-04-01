// server.js
import express from "express";
import cors from "cors";
import stocksRouter from "./routes/stocks.js";
import GainLossRouter from "./routes/GainLoss.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(stocksRouter); 
app.use(GainLossRouter);

app.listen(5000, () => console.log("Server running on port 5000"));