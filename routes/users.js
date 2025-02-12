const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const validateUserData = require('../middleware/userMiddleware');
const checkApiKey = require('../middleware/apiKeyMiddleware');  // API key check
const authMiddleware = require('../middleware/authMiddleware'); // JWT Authentication
const roleMiddleware = require('../middleware/roleMiddleware'); // Role-based access control
const { getUserActivity } = require('../controllers/UserController');


// Apply API key middleware to all user routes
router.use(checkApiKey);



// Route to get all users (Admin Only)
router.get('/users', authMiddleware, roleMiddleware('admin'), UserController.getAllUsers);

// Route to get a user by ID (Authenticated users only)
router.get('/users/:id', authMiddleware, UserController.getUserById);

// Route to create a new user (Admin Only)
router.post('/users', validateUserData, authMiddleware, roleMiddleware('admin'), UserController.createUser);

// Route to update a user by ID (Admin or Same User)
router.put('/users/:id', validateUserData, authMiddleware, roleMiddleware('admin', true), UserController.updateUser);

// Route to delete a user by ID (Admin or Same User)
router.delete('/users/:id', authMiddleware, roleMiddleware('admin', true), UserController.deleteUser);


// ✅ Rout to get Activities
// ✅ Ensure this route correctly receives an ID
// ✅ Ensure this route correctly receives an ID
router.get(
    "/users/:id/activity",
    authMiddleware, // 🔥 Run authentication middleware first
    roleMiddleware(["admin"]), // 🔥 Then check role permissions
    async (req, res) => {
      try {
        console.log("📌 Debug - Route Handler - Calling getUserActivity with ID:", req.params.id);
  
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid User ID format" });
        }
  
        const activity = await getUserActivity(userId);
        res.json(activity);
      } catch (error) {
        console.error("❌ Error in /users/:id/activity:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  
  





module.exports = router;
