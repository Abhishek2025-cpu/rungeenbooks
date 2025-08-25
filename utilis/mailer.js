const nodemailer = require("nodemailer");
const SMTPSetting = require("../Models/SMTPSetting");

// Function to create transporter dynamically from DB
const getTransporter = async () => {
  const smtp = await SMTPSetting.findOne();
  if (!smtp) throw new Error("SMTP settings not configured");

  return nodemailer.createTransport({
    host: smtp.mail_host,
    port: smtp.mail_port,
    secure: smtp.mail_encryption === "ssl", // true for 465, false for 587
    auth: {
      user: smtp.mail_username,
      pass: smtp.mail_password,
    },
  });
};

module.exports = { getTransporter };
