import express from "express";
import { sql, pool } from "../db.js";

const router = express.Router();

// --- 1. GET ACTIVE DASHBOARD STOCKS ---
router.get("/api/stock-list", async (req, res) => {
    try {
        const db = await pool;
        const result = await db.request().query("SELECT stock_name, stock_ticker FROM stock_id ORDER BY stock_name ASC");
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error fetching dashboard stocks:", error);
        res.status(500).json([]);
    }
});

// --- 2. SEARCH MASTER TABLE (Search-as-you-type) ---
router.get("/api/search-stocks", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const db = await pool;
        const result = await db.request()
            // Ensure this is exactly like this:
            .input('search', sql.NVarChar, query + '%') 
            .query(`
                SELECT TOP 10 name, ticker 
                FROM stocks 
                WHERE name LIKE @search OR ticker LIKE @search
            `);
            
        res.json(result.recordset);
    } catch (err) {
        // This will print the EXACT error to your server terminal/logs
        console.error("DETAILED SEARCH ERROR:", err.message);
        res.status(500).json({ error: "Search failed", details: err.message });
    }
});

// --- 3. VERIFY AND ADD TO stock_id ---
router.post("/api/add-stock", async (req, res) => {
    const { name, ticker } = req.body;
    try {
        const db = await pool;

        // Verify it exists in the MASTER table
        const verify = await db.request()
            .input('ticker', sql.NVarChar, ticker)
            .query("SELECT * FROM stocks WHERE ticker = @ticker");

        if (verify.recordset.length === 0) {
            return res.status(400).json({ message: "Stock not found in master records." });
        }

        // Check if it's already in the dashboard list
        const exists = await db.request()
            .input('ticker', sql.NVarChar, ticker)
            .query("SELECT * FROM stock_id WHERE stock_ticker = @ticker");

        if (exists.recordset.length > 0) {
            return res.status(400).json({ message: "Stock is already in your dashboard." });
        }

        // Insert into dashboard list
        await db.request()
            .input('name', sql.NVarChar, name)
            .input('ticker', sql.NVarChar, ticker)
            .query("INSERT INTO stock_id (stock_name, stock_ticker) VALUES (@name, @ticker)");

        res.status(201).json({ message: "Added successfully" });
    } catch (err) {
        console.error("Add error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;