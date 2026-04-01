const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", authMiddleware, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

module.exports = router;