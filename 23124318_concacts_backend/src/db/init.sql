-- 0) 重新创建数据库
DROP DATABASE IF EXISTS concacts;
CREATE DATABASE concacts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE concacts;

-- 1) users：账号 + 个人资料
CREATE TABLE users (
  id          INT          NOT NULL AUTO_INCREMENT,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('user','admin') DEFAULT 'user',
  -- 个人资料
  full_name   VARCHAR(100) DEFAULT NULL,
  email       VARCHAR(100) DEFAULT NULL,
  avatar_url  VARCHAR(255) DEFAULT NULL,
  bio         VARCHAR(255) DEFAULT NULL,
  created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_users_name (full_name),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) 用户手机号（你的“个人手机号”多条就存这里）
CREATE TABLE user_phones (
  id         INT         NOT NULL AUTO_INCREMENT,
  user_id    INT         NOT NULL,
  phone      VARCHAR(50) NOT NULL,
  created_at TIMESTAMP   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_up_user (user_id),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- 去重：同一用户内，手机号唯一
  CONSTRAINT uniq_user_self_phone UNIQUE (user_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) contacts：联系人主体
CREATE TABLE contacts (
  id          INT           NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(100)  DEFAULT NULL,
  created_at  TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  user_id     INT           NOT NULL,
  PRIMARY KEY (id),
  KEY idx_contacts_user (user_id),
  KEY idx_contacts_name (name),
  CONSTRAINT fk_contacts_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) contact_phones：联系人多手机号（同一用户下号码全局唯一 + 同一联系人内不重复）
CREATE TABLE contact_phones (
  id          INT         NOT NULL AUTO_INCREMENT,
  contact_id  INT         NOT NULL,
  user_id     INT         NOT NULL,
  phone       VARCHAR(50) NOT NULL,
  created_at  TIMESTAMP   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cp_contact (contact_id),
  KEY idx_cp_user    (user_id),
  CONSTRAINT fk_cp_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uniq_user_phone     UNIQUE (user_id, phone),
  CONSTRAINT uniq_contact_phone  UNIQUE (contact_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) 调试视图（可选）
CREATE OR REPLACE VIEW v_contacts_flat AS
SELECT c.id AS contact_id, c.user_id, c.name, c.email AS contact_email, p.phone, c.created_at
FROM contacts c
LEFT JOIN contact_phones p ON p.contact_id = c.id
ORDER BY c.user_id, c.name, p.id;
