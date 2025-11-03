// src/routes/contacts.js
import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

/** 工具：把逗号分隔/空格分隔的手机号字符串整理为数组（也支持直接数组） */
function normalizePhones(input) {
  if (!input) return [];
  if (Array.isArray(input))
    return input.map((s) => String(s).trim()).filter(Boolean);
  // 统一替换全角逗号/顿号/空格为半角逗号
  const cleaned = String(input).replace(/[、，\s]+/g, ",");
  return cleaned
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 工具：基础字段校验 */
function validateBase({ name, email }) {
  if (!name || !name.trim()) return "姓名必填";
  if (email && email.length > 0) {
    // 轻量校验，可换成更严格的
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!ok) return "邮箱格式不正确";
  }
  return null;
}

/** 工具：手机号基本校验（可按需替换为你的准入规则） */
function validatePhones(phones) {
  if (!Array.isArray(phones)) return "phones 应为数组";
  if (phones.length === 0) return null; // 允许联系人暂时无手机号
  const seen = new Set();
  for (const p of phones) {
    if (p.length > 50) return "手机号过长";
    if (seen.has(p)) return "同一联系人内手机号重复";
    seen.add(p);
  }
  return null;
}

/** 把某用户的一组手机号插入到 contact_phones，捕获重复错误 */
async function insertPhonesForContact(conn, userId, contactId, phones) {
  for (const phone of phones) {
    try {
      await conn.query(
        "INSERT INTO contact_phones (contact_id, user_id, phone) VALUES (?, ?, ?)",
        [contactId, userId, phone]
      );
    } catch (err) {
      // ER_DUP_ENTRY (唯一索引冲突)：说明该用户下此号码已存在（别的联系人占用了）
      if (err && err.code === "ER_DUP_ENTRY") {
        const e = new Error(`该号码已存在于你的通讯录：${phone}`);
        e.status = 409;
        throw e;
      }
      throw err;
    }
  }
}

/** 查询并聚合出 phones 数组（列表场景） */
async function listContactsWithPhones(userId) {
  const [contacts] = await pool.query(
    "SELECT id, name, email, created_at FROM contacts WHERE user_id=? ORDER BY id DESC",
    [userId]
  );
  if (contacts.length === 0) return [];

  const ids = contacts.map((c) => c.id);
  const [rows] = await pool.query(
    `SELECT contact_id, phone FROM contact_phones
     WHERE user_id=? AND contact_id IN (${ids.map(() => "?").join(",")})
     ORDER BY id ASC`,
    [userId, ...ids]
  );
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.contact_id)) map.set(r.contact_id, []);
    map.get(r.contact_id).push(r.phone);
  }
  return contacts.map((c) => ({ ...c, phones: map.get(c.id) || [] }));
}

/** 查询单个联系人详情（含 phones） */
async function getContactDetail(userId, contactId) {
  const [[c]] = await pool.query(
    "SELECT id, name, email, created_at FROM contacts WHERE user_id=? AND id=?",
    [userId, contactId]
  );
  if (!c) return null;
  const [phones] = await pool.query(
    "SELECT phone FROM contact_phones WHERE user_id=? AND contact_id=? ORDER BY id ASC",
    [userId, contactId]
  );
  return { ...c, phones: phones.map((p) => p.phone) };
}

/** 列表 */
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const data = await listContactsWithPhones(userId);
  res.json(data);
});

/** 新增（支持多个手机号） */
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { name, email = null } = req.body || {};
  const phones = normalizePhones(req.body?.phones);

  const baseErr = validateBase({ name, email });
  if (baseErr) return res.status(400).json({ error: baseErr });

  const phoneErr = validatePhones(phones);
  if (phoneErr) return res.status(400).json({ error: phoneErr });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ret] = await conn.query(
      "INSERT INTO contacts (name, email, user_id) VALUES (?, ?, ?)",
      [name.trim(), email?.trim() || null, userId]
    );
    const contactId = ret.insertId;

    if (phones.length > 0) {
      await insertPhonesForContact(conn, userId, contactId, phones);
    }

    await conn.commit();

    const detail = await getContactDetail(userId, contactId);
    res.status(201).json(detail);
  } catch (err) {
    await conn.rollback();
    const code = err.status || 500;
    res.status(code).json({ error: err.message || "创建失败" });
  } finally {
    conn.release();
  }
});

/** 详情 */
router.get("/:id", async (req, res) => {
  const userId = req.user.id;
  const id = +req.params.id;
  const detail = await getContactDetail(userId, id);
  if (!detail) return res.status(404).json({ error: "Not Found" });
  res.json(detail);
});

/** 更新（全量替换 phones） */
router.put("/:id", async (req, res) => {
  const userId = req.user.id;
  const id = +req.params.id;
  const { name, email = null } = req.body || {};
  const phones = normalizePhones(req.body?.phones);

  const baseErr = validateBase({ name, email });
  if (baseErr) return res.status(400).json({ error: baseErr });

  const phoneErr = validatePhones(phones);
  if (phoneErr) return res.status(400).json({ error: phoneErr });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 先确认归属
    const [[own]] = await conn.query(
      "SELECT id FROM contacts WHERE id=? AND user_id=?",
      [id, userId]
    );
    if (!own) {
      await conn.rollback();
      return res.status(404).json({ error: "Not Found" });
    }

    await conn.query(
      "UPDATE contacts SET name=?, email=? WHERE id=? AND user_id=?",
      [name.trim(), email?.trim() || null, id, userId]
    );

    // 替换手机号：先删再插
    await conn.query(
      "DELETE FROM contact_phones WHERE contact_id=? AND user_id=?",
      [id, userId]
    );
    if (phones.length > 0) {
      await insertPhonesForContact(conn, userId, id, phones);
    }

    await conn.commit();

    const detail = await getContactDetail(userId, id);
    res.json(detail);
  } catch (err) {
    await conn.rollback();
    const code = err.status || 500;
    res.status(code).json({ error: err.message || "更新失败" });
  } finally {
    conn.release();
  }
});

/** 删除 */
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  const id = +req.params.id;
  const [ret] = await pool.query(
    "DELETE FROM contacts WHERE id=? AND user_id=?",
    [id, userId]
  );
  if (ret.affectedRows === 0)
    return res.status(404).json({ error: "Not Found" });
  // 级联会自动删 phones
  res.status(204).end();
});

export default router;
