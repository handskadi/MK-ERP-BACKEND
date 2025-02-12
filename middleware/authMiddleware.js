const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ Auth Middleware Error: No token provided");
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Ensure userId is a number
    const parsedUserId = parseInt(decoded.userId, 10);
    if (isNaN(parsedUserId) || !Number.isInteger(parsedUserId)) {
      console.error("❌ Invalid User ID in Token:", decoded.userId);
      return res.status(400).json({ message: "Invalid user ID format in token" });
    }

    req.user = {
      userId: parsedUserId,
      role: decoded.role,
    };

    console.log("📌 Debug - Auth Middleware - User:", req.user);

    // Check if user changed password
    db.query("SELECT passwordUpdatedAt FROM users WHERE id = ?", [req.user.userId], (err, result) => {
      if (err) {
        console.error("❌ SQL Error in Middleware:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
      }

      if (result.length > 0 && result[0].passwordUpdatedAt) {
        const lastPasswordUpdate = new Date(result[0].passwordUpdatedAt).getTime();
        if (decoded.iat * 1000 < lastPasswordUpdate) {
          return res.status(401).json({ message: "Session expired. Please log in again." });
        }
      }

      console.log("✅ Auth Middleware Passed");
      next(); // 🔥 Move to next middleware
    });

  } catch (error) {
    console.error("❌ JWT Verification Failed:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
