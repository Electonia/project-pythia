import express from "express";
import { sql, pool } from "../db.js";

const router = express.Router();

router.get("/api/Finbert/:company", async (req, res) => {
  try {
    const { company } = req.params;
    const db = await pool;

    // GainLoss.js
const result = await db.request()
  .input("company", sql.VarChar, company)
  .query(`
    SELECT 
      [date_time] AS [Date Time],
      finbert AS [finbert_sentiment_score]    
    FROM stock_values
    WHERE stock = @company
    ORDER BY [date_time]
  `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default router;