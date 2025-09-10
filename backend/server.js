const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// OpenAI client (v5+) with optional custom base URL (Azure/OpenRouter/self-hosted)
const OpenAI = require("openai");
let openai = null;

// Only initialize OpenAI if API key is provided
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  console.log("✅ OpenAI client initialized");
} else {
  console.log("⚠️  OpenAI API key not provided - AI features will use mock responses");
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));

// Static serving for uploaded media
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Map Mongoose connection state to readable label
function getMongoStatus() {
  const state = mongoose.connection.readyState;
  return (
    {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }[state] || "unknown"
  );
}

// Health endpoint to clarify environment issues
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    port: Number(process.env.PORT || 5000),
    mongo: {
      uri: (process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hernext").replace(/:\\w+@/, ":***@"),
      status: getMongoStatus(),
    },
    openai: {
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      provider: (() => {
        const url = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").toLowerCase();
        if (url.includes("azure")) return "azure-openai";
        if (url.includes("openrouter")) return "openrouter";
        if (url.includes("localhost") || url.includes("127.0.0.1")) return "self-hosted-compatible";
        return "openai";
      })(),
    },
    uploads: {
      path: uploadsDir,
      exists: fs.existsSync(uploadsDir),
    },
  });
});

// Simple root endpoint
app.get("/", (_req, res) => {
  res.json({
    status: "running",
    message: "HerNext backend is up. See /api/health for diagnostics.",
  });
});

// ✅ Connect to MongoDB (local or Atlas)
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hernext";
mongoose.connect(mongoUri) // change to Atlas URL if using online DB
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Define User Schema
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  mobile: String,
  city: String,
  state: String,
  batch: String
});

const User = mongoose.model("User", UserSchema);

// ✅ Register API
app.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, mobile, city, state, batch } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        details: { required: ["fullName", "email", "password"] },
      });
    }

    const user = new User({ fullName, email, password, mobile, city, state, batch });
    await user.save();
    res.json({ message: "User registered successfully!" });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(400).json({ error: "Registration failed", details: String(err.message || err) });
  }
});

// ✅ Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  try {
  const user = await User.findOne({ email, password });
  if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ message: "Login successful!", user });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: String(err.message || err) });
  }
});

// =============================
// AI Chat Endpoint
// =============================
app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages, system, temperature, model } = req.body || {};

    // Build a minimal messages array if a single message is provided
    const userMessages = Array.isArray(messages) && messages.length
      ? messages
      : [{ role: "user", content: String(message || "") }];

    const systemMessage = {
      role: "system",
      content:
        String(
          system ||
            "You are a helpful and concise assistant. Respond directly to the user's text with clear, safe guidance. If the request is unclear, ask a brief clarifying question."
        ),
    };

    const chatMessages = [systemMessage, ...userMessages];

    // Guard against empty input
    const hasUserText = chatMessages.some(m => m && m.role && m.content && String(m.content).trim().length > 0);
    if (!hasUserText) return res.status(400).json({ error: "No message provided" });

    // If no OpenAI client is configured, return a helpful mock so frontend works
    if (!openai) {
      const lastUser = userMessages[userMessages.length - 1]?.content || "";
      const mockReplies = [
        "I'm here to help with your career transition! What specific area would you like guidance on?",
        "That's a great question! Let me help you explore your career options.",
        "I understand you're looking for career advice. Can you tell me more about your background?",
        "Career transitions can be challenging but rewarding. What skills are you looking to develop?",
        "I'd be happy to help you plan your career path. What's your current situation?"
      ];
      const randomReply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
      return res.json({ reply: randomReply, mock: true });
    }

    // Use a cost-effective model by default
    const completion = await openai.chat.completions.create({
      model: String(model || process.env.OPENAI_MODEL || "gpt-4o-mini"),
      messages: chatMessages,
      temperature: typeof temperature === "number" ? temperature : 0.6,
    });

    const reply = completion.choices?.[0]?.message?.content || "";
    return res.json({ reply });
  } catch (err) {
    console.error("/api/chat error", err);
    return res.status(500).json({ error: "Failed to get AI response", details: String(err.message || err) });
  }
});

// =============================
// Media Upload Endpoint (images/videos)
// =============================
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
    cb(null, `${timestamp}-${safeOriginal}`);
  }
});

const fileFilter = function (_req, file, cb) {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/ogg",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    return res.json({ url: publicUrl, filename: req.file.filename, mimetype: req.file.mimetype });
  } catch (err) {
    console.error("/api/upload error", err);
    return res.status(500).json({ error: "Upload failed", details: String(err.message || err) });
  }
});

// Centralized error handler to clarify Multer errors, etc.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // JSON parse errors
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON payload", details: String(err.message || err) });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large", limitMB: 50 });
  }
  if (err && err.message === "Unsupported file type") {
    return res.status(415).json({ error: "Unsupported file type" });
  }
  console.error("Unhandled server error", err);
  res.status(500).json({ error: "Server error", details: String(err.message || err) });
});

// =============================
// Profile Management API
// =============================
// In-memory storage for profiles (replace with DB later)
const profiles = new Map();

// POST /api/profile - Save profile data
app.post("/api/profile", async (req, res) => {
  try {
    const { name, role, company, domain, bio, interests, achievements, demoLink, profilePic } = req.body || {};
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const profileData = {
      id: Date.now().toString(),
      name: name.trim(),
      role: role || "",
      company: company || "",
      domain: domain || "",
      bio: bio || "",
      interests: Array.isArray(interests) ? interests : [],
      achievements: Array.isArray(achievements) ? achievements.filter(a => a && a.trim()) : [],
      demoLink: demoLink || "",
      profilePic: profilePic || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    profiles.set(name.toLowerCase(), profileData);
    
    res.json({ 
      message: "Profile saved successfully", 
      profile: profileData 
    });
  } catch (err) {
    console.error("/api/profile error", err);
    res.status(500).json({ error: "Failed to save profile", details: String(err.message || err) });
  }
});

// GET /api/profile/:name - Fetch profile by name
app.get("/api/profile/:name", (req, res) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: "Name parameter is required" });
    }

    const profile = profiles.get(name.toLowerCase());
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ profile });
  } catch (err) {
    console.error("/api/profile/:name error", err);
    res.status(500).json({ error: "Failed to fetch profile", details: String(err.message || err) });
  }
});

// GET /api/profiles - List all profiles
app.get("/api/profiles", (req, res) => {
  try {
    const allProfiles = Array.from(profiles.values());
    res.json({ profiles: allProfiles });
  } catch (err) {
    console.error("/api/profiles error", err);
    res.status(500).json({ error: "Failed to fetch profiles", details: String(err.message || err) });
  }
});

// 404 handler (last)
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", method: req.method, path: req.path });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
