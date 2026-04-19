import express from "express";
import db from "../db.js"; // Adjust the path to your DB connection file

const router = express.Router();

// GET: /api/stock-list
router.get("/api/stock-list", async (req, res) => {
  try {
    // Querying your stock_id table
    const [rows] = await db.query("SELECT stock_name, stock_ticker FROM stock_id");
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching stock list:", error);
    res.status(500).json({ error: "Failed to fetch stock list" });
  }
});

export default router;