const SMTPSetting = require("../Models/SMTPSetting");

// GET SMTP Settings
exports.getSMTP = async (req, res) => {
  try {
    const smtp = await SMTPSetting.findOne();

    if (!smtp) {
      return res.status(404).json({
        status: false,
        message: "SMTP settings not found",
      });
    }

    res.json({
      status: true,
      data: smtp,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// UPDATE or CREATE SMTP Settings
exports.updateSMTP = async (req, res) => {
  try {
    const { mail_host, mail_port, mail_username, mail_password, mail_encryption } = req.body;

    // Validation
    if (!mail_host || !mail_port || !mail_username || !mail_password || !mail_encryption) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    let smtp = await SMTPSetting.findOne();

    if (smtp) {
      // Update existing
      smtp.mail_host = mail_host;
      smtp.mail_port = mail_port;
      smtp.mail_username = mail_username;
      smtp.mail_password = mail_password;
      smtp.mail_encryption = mail_encryption;
      await smtp.save();
    } else {
      // Create new if not exists
      smtp = await SMTPSetting.create({
        mail_host,
        mail_port,
        mail_username,
        mail_password,
        mail_encryption,
      });
    }

    res.json({
      status: true,
      message: "SMTP settings updated successfully",
      data: smtp,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};
