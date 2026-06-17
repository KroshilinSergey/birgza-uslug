const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  console.log("=== AUTH DEBUG ===");
  console.log("Token:", token ? token.substring(0, 30) + "..." : "NO TOKEN");
  console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
  
  if (!token) {
    console.log("❌ No token");
    return res.status(401).json({ success: false, message: "Не авторизован" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified, userId:", decoded.id);
    
    const { User } = global.db;
    if (!User) {
      console.log("❌ User model not loaded");
      return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ success: false, message: "Пользователь не найден" });
    }

    console.log("✅ User authorized:", user.name);
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    return res.status(401).json({ success: false, message: "Не авторизован" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Нет доступа" });
    }
    next();
  };
};

module.exports = { protect, authorize, generateToken };
