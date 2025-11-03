// ====== 全局配置 ======
const API_CONTACTS = `${API_BASE}/contacts`;
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function bearer() {
  const t = localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${t}` };
}
function firstChar(s) {
  return (s || "").trim().charAt(0).toUpperCase() || "？";
}
function normPhonesInput(str) {
  if (!str) return [];
  return String(str)
    .replace(/[、，\s]+/g, ",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

// 显隐工具
function show(el) {
  if (!el) return;
  el.style.display = "flex";
  el.setAttribute("data-open", "1");
}
function hide(el) {
  if (!el) return;
  el.style.display = "none";
  el.removeAttribute("data-open");
}

// ====== 状态 ======
let LIST = []; // 原始列表
let EDIT_ID = null; // 当前编辑ID（null=新增）

// 合并流程的暂存
let MERGE_TARGET = null; // 已有同名联系人对象
let MERGE_INCOMING = null; // 新提交的数据 {name,email,phones}

// ====== 渲染（按首字母分组） ======
function render(list) {
  const groups = {};
  list.forEach((it) => {
    const k = firstChar(it.name);
    if (!groups[k]) groups[k] = [];
    groups[k].push(it);
  });
  const keys = Object.keys(groups).sort();
  const listEl = $("#list");
  const indexbar = $("#indexbar");
  listEl.innerHTML = "";
  indexbar.innerHTML = "";

  keys.forEach((k) => {
    const sec = document.createElement("div");
    sec.className = "section";
    sec.id = `sec-${k}`;

    const title = document.createElement("div");
    title.className = "section-title";
    title.textContent = k;
    sec.appendChild(title);

    const card = document.createElement("div");
    card.className = "card";

    groups[k].forEach((row) => {
      const cell = document.createElement("div");
      cell.className = "cell";

      const ava = document.createElement("div");
      ava.className = "avatar";
      ava.textContent = firstChar(row.name);
      cell.appendChild(ava);

      const main = document.createElement("div");
      const nm = document.createElement("div");
      nm.className = "name";
      nm.textContent = row.name;
      const sub = document.createElement("div");
      sub.className = "sub";
      const phones = (row.phones || []).join("、");
      sub.textContent = phones || row.email || "—";
      main.appendChild(nm);
      main.appendChild(sub);
      cell.appendChild(main);

      const ops = document.createElement("div");
      ops.className = "ops";
      const be = document.createElement("button");
      be.className = "btn ghost";
      be.textContent = "编辑";
      be.onclick = () => openEdit(row);
      const bd = document.createElement("button");
      bd.className = "btn danger";
      bd.textContent = "删除";
      bd.onclick = () => delContact(row.id);
      ops.appendChild(be);
      ops.appendChild(bd);
      cell.appendChild(ops);

      card.appendChild(cell);
    });

    sec.appendChild(card);
    listEl.appendChild(sec);

    const anchor = document.createElement("a");
    anchor.href = `#sec-${k}`;
    anchor.textContent = k;
    indexbar.appendChild(anchor);
  });

  if (keys.length === 0) {
    listEl.innerHTML = `<div style="color:#9ca3af;padding:32px;text-align:center;">空空如也，点右下角“＋”新增联系人</div>`;
  }
}

// ====== 拉取列表 ======
async function fetchList() {
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "./login.html";
    return;
  }
  const res = await fetch(API_CONTACTS, { headers: bearer() });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    alert(data.error || "加载失败");
    return;
  }
  LIST = data;
  render(LIST);
}

// ====== 搜索 ======
function bindSearch() {
  $("#q")?.addEventListener("input", (e) => {
    const kw = e.target.value.trim();
    if (!kw) {
      render(LIST);
      return;
    }
    const lower = kw.toLowerCase();
    const flt = LIST.filter((it) => {
      const hitName = it.name.toLowerCase().includes(lower);
      const hitPhone = (it.phones || []).some((p) => String(p).includes(lower));
      const hitEmail = (it.email || "").toLowerCase().includes(lower);
      return hitName || hitPhone || hitEmail;
    });
    render(flt);
  });
}

// ====== 新增/编辑弹层 ======
let sheet, sheetTitle;
function openAdd() {
  EDIT_ID = null;
  sheetTitle.textContent = "新增联系人";
  $("#f_name").value = "";
  $("#f_phones").value = "";
  $("#f_email").value = "";
  show(sheet);
}
function openEdit(row) {
  EDIT_ID = row.id;
  sheetTitle.textContent = "编辑联系人";
  $("#f_name").value = row.name || "";
  $("#f_phones").value = (row.phones || []).join(", ");
  $("#f_email").value = row.email || "";
  show(sheet);
}

// ====== 合并弹层 ======
const mergeSheet = $("#mergeSheet");
const m_old_name = $("#m_old_name");
const m_old_phones = $("#m_old_phones");
const m_old_email = $("#m_old_email");
const m_new_name = $("#m_new_name");
const m_new_phones = $("#m_new_phones");
const m_new_email = $("#m_new_email");

function openMerge(oldRow, incoming) {
  MERGE_TARGET = oldRow;
  MERGE_INCOMING = incoming;

  m_old_name.textContent = oldRow.name || "-";
  m_old_phones.textContent = (oldRow.phones || []).join("、") || "-";
  m_old_email.textContent = oldRow.email || "-";

  m_new_name.textContent = incoming.name || "-";
  m_new_phones.textContent = (incoming.phones || []).join("、") || "-";
  m_new_email.textContent = incoming.email || "-";

  show(mergeSheet);
}

async function doMerge() {
  if (!MERGE_TARGET || !MERGE_INCOMING) {
    hide(mergeSheet);
    return;
  }
  const old = MERGE_TARGET;
  const inc = MERGE_INCOMING;

  // 合并手机号（去重）
  const mergedPhones = uniq([...(old.phones || []), ...(inc.phones || [])]);

  // 邮箱：已有优先；已有为空则采用新邮箱；若两者都非空且不同，仍保留已有（可后续手动编辑）
  let mergedEmail = old.email || null;
  if (!mergedEmail && inc.email) mergedEmail = inc.email;

  const headers = { ...bearer(), "Content-Type": "application/json" };
  const payload = { name: old.name, email: mergedEmail, phones: mergedPhones };

  const res = await fetch(`${API_CONTACTS}/${old.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(data.error || "合并失败");
    return;
  }

  hide(mergeSheet);
  MERGE_TARGET = null;
  MERGE_INCOMING = null;
  fetchList();
}

// ====== 保存（新增或更新） ======
async function saveContact() {
  const name = $("#f_name").value.trim();
  const phones = normPhonesInput($("#f_phones").value);
  const email = $("#f_email").value.trim() || null;
  if (!name) {
    alert("姓名必填");
    return;
  }

  const headers = { ...bearer(), "Content-Type": "application/json" };

  if (EDIT_ID == null) {
    // —— 新增路径：检测同名（忽略大小写）——
    const lowerName = name.toLowerCase();
    const same = LIST.find((it) => (it.name || "").toLowerCase() === lowerName);
    if (same) {
      // 打开合并面板
      openMerge(same, { name, email, phones });
      // 先不创建新联系人，等待用户选择
      hide(sheet);
      return;
    }

    // 无同名，正常创建
    const res = await fetch(API_CONTACTS, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, email, phones }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "创建失败");
      return;
    }
  } else {
    // —— 编辑更新 ——（允许改名，不触发合并弹窗）
    const res = await fetch(`${API_CONTACTS}/${EDIT_ID}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ name, email, phones }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "更新失败");
      return;
    }
  }

  hide(sheet);
  fetchList();
}

// ====== 删除 ======
async function delContact(id) {
  if (!confirm("确认删除该联系人？")) return;
  const res = await fetch(`${API_CONTACTS}/${id}`, {
    method: "DELETE",
    headers: bearer(),
  });
  if (res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    alert(data.error || "删除失败");
    return;
  }
  fetchList();
}

// ====== 退出 ======
function doLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.href = "./login.html";
}

// ====== 入口：等 DOM 就绪再绑定 ======
document.addEventListener("DOMContentLoaded", () => {
  // 基本节点
  sheet = $("#sheet");
  sheetTitle = $("#sheetTitle");
  const fab = $("#fab");
  const sheetCancel = $("#sheetCancel");
  const sheetOK = $("#sheetOK");
  const logoutBtn = $("#logout");
  const meSheet = $("#meSheet");
  const openMe = $("#openMe");
  const meClose = $("#meClose");

  // 顶部小头像字母
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    $("#openMe").textContent = firstChar(u.username || "我");
  } catch {}

  // 绑定事件
  fab?.addEventListener("click", (e) => {
    e.stopPropagation();
    openAdd();
  });
  sheetCancel?.addEventListener("click", () => hide(sheet));
  sheetOK?.addEventListener("click", saveContact);

  // 合并弹层按钮
  $("#mergeCancel")?.addEventListener("click", () => {
    hide(mergeSheet);
    MERGE_TARGET = null;
    MERGE_INCOMING = null;
  });
  $("#mergeOK")?.addEventListener("click", doMerge);

  // 点击遮罩关闭
  sheet?.addEventListener("click", (e) => {
    if (e.target === sheet) hide(sheet);
  });
  meSheet?.addEventListener("click", (e) => {
    if (e.target === meSheet) hide(meSheet);
  });
  mergeSheet?.addEventListener("click", (e) => {
    if (e.target === mergeSheet) {
      hide(mergeSheet);
      MERGE_TARGET = null;
      MERGE_INCOMING = null;
    }
  });

  // ESC 关闭
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hide(sheet);
      hide(meSheet);
      hide(mergeSheet);
    }
  });

  openMe?.addEventListener("click", () => show(meSheet));
  meClose?.addEventListener("click", () => hide(meSheet));
  logoutBtn?.addEventListener("click", doLogout);

  bindSearch();
  fetchList();
});
