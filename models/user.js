const db = require('../config/db');  // MySQL database connection
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Get all users
const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT id, name, email FROM users', (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Get a user by ID
const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT id, name, email, phone, isVerified, status FROM users WHERE id = ?', [id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0] || null);
    });
  });
};



// Get a user by email
const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT id, name, email, phone, isVerified, status, password, verificationCode, verificationExpires FROM users WHERE email = ?',
      [email],
      (err, result) => {
        if (err) return reject(err);
        console.log("User fetched from DB:", result[0]);  // Debugging
        resolve(result[0] || null);
      }
    );
  });
};





// Add a new user (Hash password before saving)
const addUser = async (name, email, password, phone = null, role = 'user') => {
  return new Promise(async (resolve, reject) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password, phone, status, role) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [name, email, hashedPassword, phone, 'active', role], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};




// Validate user login
const validateUser = async (email, password) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
      if (err) return reject(err);
      if (!result[0]) return resolve(null);

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return resolve(null);

      resolve(user);
    });
  });
};

// Update a user by ID (including optional password update)
const updateUser = async (id, name, email, password = null, role = null) => {
  return new Promise(async (resolve, reject) => {
    let query = 'UPDATE users SET name = ?, email = ?';
    let params = [name, email];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);  // 🔹 Ensure password is hashed
      query += ', password = ?';
      params.push(hashedPassword);
    }

    if (role) {
      query += ', role = ?';
      params.push(role);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};




// Delete a user by ID
const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const updateUserVerification = (id, verificationCode = null, verified = false) => {
  const expiryTime = verificationCode 
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : null; // Convert to MySQL DATETIME format
  
  return new Promise((resolve, reject) => {
    db.query(
      'UPDATE users SET verificationCode = ?, isVerified = ?, verificationExpires = ? WHERE id = ?',
      [verificationCode, verified, expiryTime, id],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

// Store Reset Token in Database
const setResetToken = (email) => {
  return new Promise((resolve, reject) => {
      const token = crypto.randomBytes(32).toString('hex'); // Generate a secure token
      const expires = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

      db.query(
          'UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE email = ?',
          [token, expires, email],
          (err, result) => {
              if (err) return reject(err);
              resolve({ token, expires });
          }
      );
  });
};


// Find User by Reset Token
const getUserByResetToken = (token) => {
  return new Promise((resolve, reject) => {
      db.query(
          'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpires > NOW()',
          [token],
          (err, result) => {
              if (err) return reject(err);
              resolve(result[0] || null);
          }
      );
  });
};

// Update User Password
const updateUserPassword = async (id, newPassword) => {
  return new Promise(async (resolve, reject) => {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const now = new Date();

      db.query(
          'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpires = NULL, passwordUpdatedAt = ? WHERE id = ?',
          [hashedPassword, now, id],
          (err, result) => {
              if (err) return reject(err);
              resolve(result);
          }
      );
  });
};

const logUserActivity = (userId, action, ip, userAgent) => {
  return new Promise((resolve, reject) => {
      db.query(
          'INSERT INTO user_activity (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
          [userId, action, ip, userAgent],
          (err, result) => {
              if (err) return reject(err);
              resolve(result);
          }
      );
  });
};


const getUserActivity = (userId) => {
  return new Promise((resolve, reject) => {
    console.log("📌 Debug - getUserActivity - Received userId:", userId);

    if (!userId || isNaN(userId)) {
      console.error("❌ SQL Error: Invalid userId received:", userId);
      return reject(new Error("Invalid user ID format"));
    }

    const sql = "SELECT * FROM user_activity WHERE user_id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("❌ SQL Error:", err);
        return reject(err);
      }
      resolve(results);
    });
  });
};




module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,  // ✅ Added this function to exports
  addUser,
  validateUser,
  updateUser,
  deleteUser,
  updateUserVerification,
  setResetToken,
  getUserByResetToken,
  updateUserPassword,
  logUserActivity ,
  getUserActivity 
};
