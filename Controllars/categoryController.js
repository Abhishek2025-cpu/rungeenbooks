const Category = require('../Models/categoryModel');
const { cloudinary } = require('../config/cloudinary');

// Add Category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || req.files.length === 0) {
      return res.status(400).json({ message: 'Name and images are required.' });
    }

    const images = req.files.map(file => ({
      public_id: file.filename,
      url: file.path,
    }));

    const category = await Category.create({ name, images });
    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (req.files.length > 0) {
      // Delete old images
      for (let img of category.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      const newImages = req.files.map(file => ({
        public_id: file.filename,
        url: file.path,
      }));
      category.images = newImages;
    }

    if (name) category.name = name;

    await category.save();
    res.json({ message: 'Category updated', category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    for (let img of category.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle Active/Inactive
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.status = category.status === 'active' ? 'inactive' : 'active';
    await category.save();

    res.json({ message: `Category status updated to ${category.status}`, category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
