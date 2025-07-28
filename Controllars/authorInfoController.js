const AuthorInfo = require('../Models/authorInfoModel');

// Add Author
exports.addAuthor = async (req, res) => {
  try {
    const { name, info } = req.body;
    const profile = req.file?.path;

    if (!name || !info || !profile) {
      return res.status(400).json({ success: false, message: 'All fields are required including profile image.' });
    }

    const author = await AuthorInfo.create({ name, info, profile });
    res.status(201).json({ success: true, author });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get All Authors
exports.getAuthors = async (req, res) => {
  try {
    const authors = await AuthorInfo.find();
    res.json({ success: true, authors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update Author
exports.updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, info } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (info) updateData.info = info;
    if (req.file) updateData.profile = req.file.path;

    const updated = await AuthorInfo.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) return res.status(404).json({ success: false, message: 'Author not found' });

    res.json({ success: true, author: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
