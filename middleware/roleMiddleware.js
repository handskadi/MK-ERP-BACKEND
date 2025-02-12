const roleMiddleware = (roles) => {
  return (req, res, next) => {
    console.log("📌 Debug - Role Middleware - Params:", req.params);

    if (!req.user || !req.user.role) {
      console.error("❌ Role Middleware Error: req.user or req.user.role is undefined");
      return res.status(403).json({ message: "Forbidden: No role found in token" });
    }

    if (!roles.includes(req.user.role)) {
      console.error(`❌ Access Denied: User role '${req.user.role}' does not have permission.`);
      return res.status(403).json({ message: "Forbidden: You do not have the required permissions" });
    }

    console.log("📌 Debug - Role Middleware - User Role:", req.user.role);

    // ✅ Only validate req.params.id for routes that require it
    if (req.params && req.params.id) {
      if (isNaN(Number(req.params.id))) {
        console.error("❌ Role Middleware Error: Invalid or missing user ID in request params:", req.params.id);
        return res.status(400).json({ message: "Invalid request. User ID must be a valid number." });
      }
    }

    console.log("✅ Role Middleware Passed");
    next();
  };
};

module.exports = roleMiddleware;
