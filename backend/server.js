require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

//--------------- MiddleWare-----------------
app.use(cors());
app.use(express.json());

// -----------DataBase Connection---------
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

//------------------- User Schema ------------------
const userSchema = new mongoose.Schema(
  {
    name: String,
    username: String,
    email: { type: String, unique: true },
    password: String,
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

//----------- Note Schema ----------------
const noteSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Note = mongoose.model("Note", noteSchema);

//--------- Auth ------------

//----------- Signup -------------
app.post("/api/signup", async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(400).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    username,
    email,
    password: hashed,
  });

  res.json({
    message: "Signup successful",
    userId: user._id,
    username: user.username,
  });
});

//-------------Login------------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    message: "Login successful",
    userId: user._id,
    username: user.username,
  });
});

//-------------Notes -------------

//--------------Add note---------------
app.post("/api/notes", async (req, res) => {
  const { title, description, userId } = req.body;

  if (!title || !description || !userId)
    return res.status(400).json({ message: "Missing fields" });

  const note = await Note.create({ title, description, userId });
  res.status(201).json(note);
});

//------------Get notes for user------------------
app.get("/api/notes/:userId", async (req, res) => {
  const notes = await Note.find({ userId: req.params.userId })
    .sort({ createdAt: -1 });
  res.json(notes);
});

// ------------Delete note-------------
app.delete("/api/notes/:id", async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.json({ message: "Note deleted" });
});

//--------------Server -------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(` Server is Started`)
);
