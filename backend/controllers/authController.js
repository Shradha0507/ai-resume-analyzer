const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { getUsersContainer } = require("../services/cosmosService");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function register(req, res) {
  const startedAt = Date.now();

  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const usersContainer = getUsersContainer();
    const normalizedEmail = String(email).trim().toLowerCase();

    // ✅ COSMOS QUERY (instead of findOne)
    const query = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: normalizedEmail }]
    };

    const { resources } = await usersContainer.items.query(query).fetchAll();
    const existingUser = resources[0];

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const newUser = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword
    };

    // ✅ COSMOS INSERT (instead of insertOne)
    await usersContainer.items.create(newUser);

    console.log(`[auth] Registered user ${normalizedEmail} in ${Date.now() - startedAt}ms`);

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error("[auth] Register error:", error);
    return res.status(500).json({ message: "Registration failed." });
  }
}

async function login(req, res) {
  const startedAt = Date.now();

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }

    const usersContainer = getUsersContainer();
    const normalizedEmail = String(email).trim().toLowerCase();

    // ✅ COSMOS QUERY
    const query = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: normalizedEmail }]
    };

    const { resources } = await usersContainer.items.query(query).fetchAll();
    const user = resources[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!process.env.JWT_SECRET) {
      console.error("[auth] JWT_SECRET is missing.");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`[auth] Login success for ${normalizedEmail} in ${Date.now() - startedAt}ms`);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("[auth] Login error:", error);
    return res.status(500).json({ message: "Login failed." });
  }
}

module.exports = {
  register,
  login
};