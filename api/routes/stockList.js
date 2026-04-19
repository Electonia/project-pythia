import express from "express";
// Ensure you use the correct exported variable from your db.js
import { pool } from "../db.js"; 

const router = express.Router();

// GET: /api/stock-list
router.get("/api/stock-list", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT stock_name, stock_ticker FROM stock_id");
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching stock list:", error);
    res.status(500).json({ error: "Failed to fetch stock list" });
  }
});

export default router;