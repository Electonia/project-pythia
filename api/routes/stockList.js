import express from "express";
import { pool } from "../db.js"; // This is the Promise from your db.js

const router = express.Router();

router.get("/api/stock-list", async (req, res) => {
  try {
    // 1. You MUST await the pool because it is a Promise in your db.js
    const connectedPool = await pool; 
    
    // 2. MSSQL uses .request().query() syntax
    const result = await connectedPool.request().query("SELECT stock_name, stock_ticker FROM stock_id");
    
    // 3. MSSQL returns data in result.recordset
    // We send result.recordset so the frontend gets the array of stocks
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching stock list:", error);
    // Send an empty array on error to prevent frontend crash
    res.status(500).json([]); 
  }
});

export default router;