const API_ME = `${API_BASE}/me`;

function bearer() {
  const t = localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${t}` };
}
function firstChar(s) {
  return (s || "").trim().charAt(0).toUpperCase() || "我";
}
function normPhonesInput(str) {
  if (!str) return [];
  return String(str)
    .replace(/[、，\s]+/g, ",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function setAvatarPreview(el, name, url) {
  if (url && /^https?:\/\//i.test(url)) {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.textContent = "";
  } else {
    el.style.backgroundImage = "none";
    el.textContent = firstChar(name);
  }
}

async function meFetch() {
  const res = await fetch(API_ME, { headers: bearer() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(data.error || "读取个人资料失败");
    return null;
  }
  return data;
}
async function meSave(payload) {
  const res = await fetch(API_ME, {
    method: "PUT",
    headers: { ...bearer(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(data.error || "保存失败");
    return null;
  }
  return data;
}

const meSheet = document.querySelector("#meSheet");
const openMeBtn = document.querySelector("#openMe");
const meCloseBtn = document.querySelector("#meClose");
const meSaveBtn = document.querySelector("#meSave");

openMeBtn.onclick = async () => {
  const me = await meFetch();
  if (!me) return;
  document.querySelector("#me_full_name").value = me.full_name || "";
  document.querySelector("#me_email").value = me.email || "";
  document.querySelector("#me_avatar_url").value = me.avatar_url || "";
  document.querySelector("#me_bio").value = me.bio || "";
  document.querySelector("#me_phones").value = (me.phones || []).join(", ");
  document.querySelector("#meUserInfo").textContent = `账号：${me.username}（${
    me.role
  }）  创建于：${new Date(me.created_at).toLocaleString()}`;
  setAvatarPreview(
    document.querySelector("#meAvatarPreview"),
    me.full_name || me.username,
    me.avatar_url
  );
  meSheet.style.display = "flex";
};
meCloseBtn.onclick = () => (meSheet.style.display = "none");

meSaveBtn.onclick = async () => {
  const payload = {
    full_name: document.querySelector("#me_full_name").value.trim() || null,
    email: document.querySelector("#me_email").value.trim() || null,
    avatar_url: document.querySelector("#me_avatar_url").value.trim() || null,
    bio: document.querySelector("#me_bio").value.trim() || null,
    phones: normPhonesInput(document.querySelector("#me_phones").value),
  };
  const updated = await meSave(payload);
  if (updated) {
    // 更新顶栏头像字母
    document.querySelector("#openMe").textContent = firstChar(
      updated.full_name || updated.username
    );
    meSheet.style.display = "none";
    // 可选：把最新 user 信息回存 localStorage（不含密码）
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...u, username: updated.username, role: updated.role })
      );
    } catch {}
  }
};
