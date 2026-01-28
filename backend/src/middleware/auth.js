import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token ausente. Use Authorization: Bearer <token>." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id_usuario, tipo, nome, email }
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
