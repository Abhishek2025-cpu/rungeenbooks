const mongoose = require('mongoose');

const SMTPSettingSchema = new mongoose.Schema(
  {
    mail_host: { type: String, required: true },
    mail_port: { type: Number, required: true },
    mail_username: { type: String, required: true },
    mail_password: { type: String, required: true },
    mail_encryption: { type: String, required: true }, // e.g. 'tls' or 'ssl'
  },
  { timestamps: true }
);
module.exports = mongoose.model('SMTPSetting', SMTPSettingSchema);

