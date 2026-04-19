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
            .input('search', sql.NVarChar, query + '%') 
            .query(`
                SELECT TOP 10 stock_name, stock_ticker 
                FROM stocks 
                WHERE stock_name LIKE @search OR stock_ticker LIKE @search
            `);
            
        // We need to map the results so the frontend receives 'name' and 'ticker' 
        // as it expects in the SearchResult interface
        const formattedResults = result.recordset.map(row => ({
            name: row.stock_name,
            ticker: row.stock_ticker
        }));

        res.json(formattedResults);
    } catch (err) {
        console.error("DETAILED SEARCH ERROR:", err.message);
        res.status(500).json({ error: "Search failed", details: err.message });
    }
});

// --- 3. VERIFY AND ADD TO stock_id ---
router.post("/api/add-stock", async (req, res) => {
    const { name, ticker } = req.body;
    
    // Safety check: ensure we actually have data
    if (!name || !ticker) {
        return res.status(400).json({ message: "Name and Ticker are required." });
    }

    try {
        const db = await pool;

        // 1. Verify it exists in the MASTER table using correct column names
        const verify = await db.request()
            .input('ticker', sql.NVarChar, ticker)
            .query("SELECT * FROM stocks WHERE stock_ticker = @ticker");

        if (verify.recordset.length === 0) {
            return res.status(400).json({ message: "Stock not found in master records." });
        }

        // 2. Check if it's already in the dashboard list (stock_id table)
        const exists = await db.request()
            .input('ticker', sql.NVarChar, ticker)
            .query("SELECT * FROM stock_id WHERE stock_ticker = @ticker");

        if (exists.recordset.length > 0) {
            return res.status(400).json({ message: "Stock is already in your dashboard." });
        }

        // 3. Insert into dashboard list using CORRECT column names: stock_name and stock_ticker
        await db.request()
            .input('name', sql.NVarChar, name)
            .input('ticker', sql.NVarChar, ticker)
            .query("INSERT INTO stock_id (stock_name, stock_ticker) VALUES (@name, @ticker)");

        res.status(201).json({ 
            message: "Company Stock Added successfully! Data will be uploaded within 24-Hours." 
        });

    } catch (err) {
        // This will show you the exact SQL error in your PM2 logs/terminal
        console.error("CRITICAL ADD ERROR:", err.message);
        res.status(500).json({ 
            message: "Internal server error", 
            details: err.message 
        });
    }
});

export default router;