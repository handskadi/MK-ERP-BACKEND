const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');  // Import the User model
const { getUserActivity } = require('../models/user');
const { logUserActivity } = require('../models/user');




// Register a new user (with password hashing)
const registerUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body; // Add role here

  const existingUser = await User.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const newUser = await User.addUser(name, email, hashedPassword, phone, role);  // Pass role to addUser
    res.status(201).json({ message: "User registered successfully. Verification required.", userId: newUser.insertId });
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
};


// Login (with JWT token generation)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.validateUser(email, password);  // Check user credentials

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Create JWT token
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ token });
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

// Get a user by ID
const getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.getUserById(userId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
};

// Create a new user
const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);  // Hash password before saving

  try {
    const newUser = await User.addUser(name, email, hashedPassword);
    res.status(201).json({ message: "User created", userId: newUser.insertId });
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
};

// Update a user by ID
const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, role } = req.body;

  try {
      let hashedPassword = null;
      if (password) {
          hashedPassword = await bcrypt.hash(password, 10);
      }

      const updatedUser = await User.updateUser(userId, name, email, hashedPassword, role);
      
      if (updatedUser.affectedRows > 0) {
          await logUserActivity(userId, 'account_update', req.ip, req.headers['user-agent']);
          res.status(200).json({ message: 'User updated successfully' });
      } else {
          res.status(404).json({ message: 'User not found or no changes made' });
      }
  } catch (err) {
      res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};




// Delete a user by ID
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const deletedUser = await User.deleteUser(userId);
    if (deletedUser.affectedRows > 0) {
      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    console.log("📌 Debug - Received params:", req.params);

    if (!req.params.id) {
      console.error("❌ Error: Missing user ID in request parameters");
      return res.status(400).json({ message: "User ID is required" });
    }

    const userId = parseInt(req.params.id, 10);
    console.log("📌 Debug - Parsed user ID:", userId);

    if (isNaN(userId) || userId <= 0) {
      console.error("❌ Error: Invalid user ID:", req.params.id);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const activity = await getUserActivity(userId);
    res.json(activity);
  } catch (error) {
    console.error("❌ Error in getUserActivity:", error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser, 
  getUserActivity 

};
