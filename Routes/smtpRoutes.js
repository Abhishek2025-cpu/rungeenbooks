const express = require("express");
const { getSMTP, updateSMTP } = require("../Controllars/smtpController");

const router = express.Router();

// Get SMTP
router.get("/get", getSMTP);

// Update SMTP
router.post("/update", updateSMTP);

module.exports = router;
