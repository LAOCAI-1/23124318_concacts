import "express-async-errors";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import { auth } from "./middlewares/auth.js";
import authRouter from "./routes/auth.js";
import contactsRouter from "./routes/contacts.js";
import meRouter from "./routes/me.js"; // ← 新增

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/me", auth, meRouter); // ← 新增：需要 Bearer Token
app.use("/api/contacts", auth, contactsRouter);

app.use((req, res) => res.status(404).json({ error: "Not Found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Error", detail: err.message });
});

const port = process.env.PORT || 5173;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
