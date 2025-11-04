# 23124318 Concacts Frontend

这是一个基于 **HTML + JavaScript + CSS** 构建的轻量级通讯录前端项目，  
支持联系人分组展示、搜索、新增、编辑、删除、多手机号绑定、同名合并提示以及个人资料管理。

---

## 📁 项目结构

```text
23124318_concacts_frontend/
├─ src/
│ ├─ concacts.html # 主页面（通讯录界面）
│ ├─ app.js # 主逻辑脚本
│ ├─ me.js # 个人资料逻辑
│ ├─ config.js # 后端 API 地址配置
│ ├─ style.css # 样式文件（统一 UI 风格）
│ └─ assets/ # 图标、头像、UI 资源等
├─ README.md # 项目说明文件
└─ codestyle.md # 前端代码规范文件
```

---

## 🚀 启动与运行

### 1️⃣ 克隆仓库

```bash
git clone https://github.com/<你的GitHub用户名>/23124318_concacts_frontend.git
cd 23124318_concacts_frontend
```

### 2️⃣ 启动本地预览

方法一（推荐）：使用 VSCode 插件 Live Server 打开 src/concacts.html。
方法二：直接在浏览器中双击 concacts.html 文件运行。

### 3️⃣ 配置后端 API 地址

修改 src/config.js 文件中的 API_BASE 为你后端服务的实际地址，例如：
// src/config.js
const API_BASE = "http://localhost:5173/api";

## ✨ 功能概览

| 功能模块         | 说明                                       |
| ---------------- | ------------------------------------------ |
| 🔐 用户登录/注册 | 登录验证并保存 Token（localStorage）       |
| 📇 联系人展示    | 按姓名首字母分组，右侧提供索引跳转         |
| ➕ 新增联系人    | 可同时添加多个手机号（逗号或空格分隔）     |
| ✏️ 编辑联系人    | 支持修改姓名、手机号、邮箱                 |
| ❌ 删除联系人    | 点击后二次确认，删除后实时刷新列表         |
| 📞 同名合并检测  | 新增或导入时检测同名联系人，提示是否合并   |
| 🧍 个人资料面板  | 点击左上角头像打开，可编辑头像、邮箱、签名 |
| 🔍 搜索功能      | 实时搜索姓名、手机号或邮箱                 |
| 🚪 退出登录      | 清除 Token 并跳转至登录页                  |

---

## 🎨 界面风格

- 整体风格参考苹果通讯录 UI；
- 采用圆角卡片布局；
- 统一浅色系设计；
- 响应式布局，支持桌面端与移动端；
- 所有交互动画均平滑过渡。

---

## 🧩 技术栈

- **HTML5**：语义化结构；
- **CSS3**：Flex 布局 + 变量主题；
- **JavaScript (ES6+)**：主逻辑与事件绑定；
- **Fetch API**：与后端 RESTful 接口通信；
- **localStorage**：保存 Token 与用户信息；
- **模块化脚本结构**：app.js + me.js + config.js。

---

## 🔧 开发规范

- 所有接口调用统一在 `app.js`；
- 公共函数独立封装（如 `bearer()`、`firstChar()`）；
- 同名联系人检测与合并在前端完成用户交互提示；
- 页面交互采用原生 DOM 操作，无框架依赖；
- 样式统一在 `style.css` 管理；
- 前后端分离，后端为独立仓库 `23124318_concacts_backend`。

---

## 🧾 License

MIT License © 2025 JiaYi Chen  
本项目仅用于课程作业与学习示例用途。
