// server.js
import express from "express";
import cors from "cors";
import stocksRouter from "./routes/stocks.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(stocksRouter); 

app.listen(5000, () => console.log("Server running on port 5000"));