import express from "express";
import bcrypt from "bcryptjs";
import { sql, pool } from "../db.js";

const router = express.Router();

// --- REGISTRATION ENDPOINT ---
router.post('/api/register', async (req, res) => {
    const { name, username, email, password } = req.body;
    try {
        const db = await pool;
        const checkUser = await db.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Username = @username OR Email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: "Username or Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.request()
            .input('name', sql.NVarChar, name)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query(`INSERT INTO Users (FullName, Username, Email, PasswordHash) VALUES (@name, @username, @email, @password)`);

        res.status(201).json({ message: "Registration successful!" });
    } catch (err) {
        console.error("SQL Error during Registration:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// --- LOGIN ENDPOINT (ADD THIS HERE) ---
router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const db = await pool;
        
        // 1. Find user by email
        const result = await db.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        const user = result.recordset[0];

        // 2. Check if user exists
        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        // 3. Compare passwords using bcrypt
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        // 4. Success Response
        res.status(200).json({ 
            message: "Login successful", 
            user: { 
                name: user.FullName, 
                username: user.Username,
                email: user.Email 
            } 
        });

    } catch (err) {
        console.error("SQL Error during Login:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;