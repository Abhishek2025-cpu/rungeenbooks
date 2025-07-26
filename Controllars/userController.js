const User = require('../Models/User');

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE user profile (with profileImage)
exports.updateReview = async (req, res) => {
  try {
    const { rating, description, userId } = req.body; // Get user ID from body

    const updated = await Review.findOneAndUpdate(
      { _id: req.params.id, user: userId }, // Match by review ID and user ID
      { rating, description },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Review not found or user not authorized" });
    }

    res.json({ success: true, message: "Review updated", review: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// DELETE user profile
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
