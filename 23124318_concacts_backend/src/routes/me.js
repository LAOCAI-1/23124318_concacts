import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

/** 工具：把手机号输入归一（字符串/数组 -> 数组；支持逗号/空格/顿号） */
function normalizePhones(input) {
  if (!input) return [];
  if (Array.isArray(input))
    return input.map((s) => String(s).trim()).filter(Boolean);
  return String(input)
    .replace(/[、，\s]+/g, ",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function validatePhones(arr) {
  if (!Array.isArray(arr)) return "phones 应为数组";
  const seen = new Set();
  for (const p of arr) {
    if (p.length > 50) return "手机号过长";
    if (seen.has(p)) return "手机号重复";
    seen.add(p);
  }
  return null;
}

/** GET /api/me 读取当前用户资料 + 个人手机号 */
router.get("/", async (req, res) => {
  const uid = req.user.id;

  const [[u]] = await pool.query(
    "SELECT id, username, role, full_name, email, avatar_url, bio, created_at FROM users WHERE id=?",
    [uid]
  );
  if (!u) return res.status(404).json({ error: "Not Found" });

  const [phones] = await pool.query(
    "SELECT phone FROM user_phones WHERE user_id=? ORDER BY id ASC",
    [uid]
  );

  res.json({ ...u, phones: phones.map((x) => x.phone) });
});

/** PUT /api/me 更新资料（全量替换 phones） */
router.put("/", async (req, res) => {
  const uid = req.user.id;
  const {
    full_name = null,
    email = null,
    avatar_url = null,
    bio = null,
  } = req.body || {};
  const phones = normalizePhones(req.body?.phones);

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "邮箱格式不正确" });
  }
  if (avatar_url && avatar_url.length > 255) {
    return res.status(400).json({ error: "头像地址过长" });
  }
  if (bio && bio.length > 255) {
    return res.status(400).json({ error: "签名字数过长" });
  }
  const perr = validatePhones(phones);
  if (perr) return res.status(400).json({ error: perr });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 更新资料
    const [ret] = await conn.query(
      "UPDATE users SET full_name=?, email=?, avatar_url=?, bio=? WHERE id=?",
      [
        full_name?.trim() || null,
        email?.trim() || null,
        avatar_url?.trim() || null,
        bio?.trim() || null,
        uid,
      ]
    );
    if (ret.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Not Found" });
    }

    // 替换个人手机号
    await conn.query("DELETE FROM user_phones WHERE user_id=?", [uid]);
    for (const p of phones) {
      await conn.query(
        "INSERT INTO user_phones (user_id, phone) VALUES (?, ?)",
        [uid, p]
      );
    }

    await conn.commit();

    // 返回最新数据
    const [[u]] = await conn.query(
      "SELECT id, username, role, full_name, email, avatar_url, bio, created_at FROM users WHERE id=?",
      [uid]
    );
    res.json({ ...u, phones });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "保存失败", detail: e.message });
  } finally {
    conn.release();
  }
});

export default router;
