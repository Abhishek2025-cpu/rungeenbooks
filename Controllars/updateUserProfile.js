const User = require('../Models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { email, phone, username } = req.body;

    // Fetch current user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: 0, message: 'User not found' });

    // Check for duplicate email/username
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ success: 0, message: 'Email already in use' });
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) return res.status(400).json({ success: 0, message: 'Username already in use' });
    }

    // ✅ Upload new profile picture (if any)
    if (req.file) {
      // Delete old image from Cloudinary (if exists)
      if (user.profileImage?.public_id) {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'user-profiles',
      });

      user.profileImage = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      fs.unlinkSync(req.file.path); // Remove local temp file
    }

    // ✅ Update fields
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (username) user.username = username;

    await user.save();

    res.status(200).json({
      success: 1,
      message: 'User profile updated successfully',
      user,
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ success: 0, message: 'Server error', error: err.message });
  }
};
