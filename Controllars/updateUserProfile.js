const mongoose = require('mongoose');
const User = require('../Models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

exports.updateUserProfile = async (req, res) => {
  const userId = req.params.userId;

  console.log('Received request to update user:', userId);
  console.log('Request body:', req.body);
  console.log('File info:', req.file);

  try {
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: 0, message: 'Invalid user ID format' });
    }

    const { email, phone, username } = req.body;

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: 0, message: `User not found with ID ${userId}` });
    }

    // Check for duplicate email
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== userId) {
        return res.status(400).json({ success: 0, message: 'Email already in use' });
      }
    }

    // Check for duplicate username
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists && usernameExists._id.toString() !== userId) {
        return res.status(400).json({ success: 0, message: 'Username already in use' });
      }
    }

    // Handle image upload
    if (req.file) {
      try {
        // Delete previous image from Cloudinary
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
      } catch (cloudinaryErr) {
        console.error('Cloudinary Error:', cloudinaryErr);
        return res.status(500).json({
          success: 0,
          message: 'Failed to upload/delete image on Cloudinary',
          error: cloudinaryErr.message,
        });
      } finally {
        // Always try to remove local file
        try {
          fs.unlinkSync(req.file.path);
        } catch (fsErr) {
          console.warn('Failed to delete temp file:', fsErr.message);
        }
      }
    }

    // Apply updates
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
    res.status(500).json({
      success: 0,
      message: 'Server error while updating user profile',
      error: err.message,
    });
  }
};
