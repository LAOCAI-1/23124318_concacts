# 🧠 23124318 Concacts Backend

基于 **Node.js + Express + MySQL** 的通讯录后端项目。  
实现了用户注册登录（JWT 鉴权）、联系人增删改查、同名合并、多手机号支持、个人资料管理等功能。

---

## 📁 项目结构

```text
23124318_concacts_backend/
├─ src/
│  ├─ app.js                  # 项目主入口
│  ├─ db/
│  │  └─ pool.js              # MySQL 连接池
│  ├─ routes/                 # 路由层
│  │  ├─ auth.js              # 登录注册接口
│  │  └─ contacts.js          # 联系人接口
│  ├─ controller/             # 控制器层（业务逻辑）
│  │  ├─ authController.js
│  │  └─ contactsController.js
│  ├─ middlewares/            # 中间件
│  │  └─ auth.js              # JWT 验证
│  ├─ schema.sql              # 数据库建表脚本
│  └─ utils/                  # 工具函数
├─ .env.example               # 环境变量示例
├─ package.json
├─ README.md
└─ codestyle.md
```

## ⚙️ 环境配置与运行

### 1️⃣ 安装依赖

npm install

### 2️⃣ 初始化数据库

CREATE DATABASE concacts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

### 3️⃣ 配置环境变量

复制 .env.example 为 .env 并填写内容（以下为示例）：

```
PORT=5173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=concacts
JWT_SECRET=my_secret_key
TOKEN_EXPIRES=1h
```

### 4️⃣ 启动服务器

```
npm run dev

默认服务地址：

http://localhost:5173/api
```

## 🔌 API 模块说明

| 功能模块         | 说明                     |
| ---------------- | ------------------------ |
| 🔐 用户注册/登录 | JWT 鉴权、密码哈希       |
| 👤 用户资料管理  | 查看与更新个人资料       |
| 📇 联系人管理    | 新增、编辑、删除联系人   |
| 📞 多手机号支持  | 同一联系人可绑定多个号码 |
| 🔁 同名合并检测  | 新增时检测并提示是否合并 |
| 🚫 权限控制      | 用户仅能访问自己的数据   |
| 🧾 RESTful       | API 统一接口格式         |

## 🧩 技术栈

**Node.js(v18+)**

**Express (v4+)**

**MySQL (InnoDB)**

**JWT（jsonwebtoken**

**bcrypt（密码加密）**

**dotenv（环境变量）**

**RESTful API 架构**

## 📐 开发规范

- 路由与控制器分层；

- 所有接口返回统一 JSON；

- 写操作均需 JWT 鉴权；

- 密码使用 bcrypt 哈希存储；

- 外键开启级联删除；

代码风格参考 Airbnb JavaScript Style Guide。

## 🧾 License

MIT License © 2025 JiaYi Chen
本项目仅用于课程作业与学习示例用途。

