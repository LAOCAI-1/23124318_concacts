import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

const router = Router();

/** 注册 */
router.post("/register", async (req, res) => {
  const { username, password, role = "user" } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username/password required" });
  }
  const [exists] = await pool.query("SELECT id FROM users WHERE username=?", [
    username,
  ]);
  if (exists.length)
    return res.status(409).json({ error: "Username already exists" });

  const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [username, hashed, role === "admin" ? "admin" : "user"]
  );
  res.status(201).json({ message: "Registered" });
});

/** 登录 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username/password required" });
  }
  const [rows] = await pool.query("SELECT * FROM users WHERE username=?", [
    username,
  ]);
  if (!rows.length) return res.status(401).json({ error: "User not found" });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES || "1h" }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

export default router;
