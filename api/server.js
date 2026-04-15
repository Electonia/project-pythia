import express from "express";
import cors from "cors";
import stocksRouter from "./routes/stocks.js";
import GainLossRouter from "./routes/GainLoss.js";
import FinbertRouter from "./routes/Finbert.js";
import ComulativeGainRouter from "./routes/CommulativeGainLoss.js";
import authRouter from "./routes/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

// We register them at the root. 
// The "/api" part must be inside each route file.
app.use(stocksRouter);
app.use(GainLossRouter);
app.use(FinbertRouter);
app.use(ComulativeGainRouter); 
app.use(authRouter);

app.listen(5000, () => console.log("Server running on port 5000"));