import jwt from "jsonwebtoken";

/**
 * 认证中间件函数，用于验证请求中的JWT令牌
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express的next函数，用于传递控制权给下一个中间件
 * @returns {void} 如果验证通过则调用next()，否则返回401错误响应
 */
export function auth(req, res, next) {
  try {
    // 获取Authorization头，如果不存在则默认为空字符串
    const header = req.headers.authorization || "";
    // 分割Authorization头，提取认证方案和令牌
    const [scheme, token] = header.split(" ");

    // 检查认证方案是否为Bearer且令牌存在
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 使用JWT密钥验证令牌并解码有效载荷
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { id, username, role, iat, exp }

    // 将用户信息附加到请求对象上，供后续中间件和路由处理程序使用
    req.user = {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };

    // 令牌验证成功，继续处理请求
    next();
  } catch (e) {
    // 处理令牌验证失败的情况（无效或过期的令牌）
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
