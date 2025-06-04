const Category = require('../Models/categoryModel');
const cloudinary = require('../config/cloudinary');

// Optional: Unique ID generator (or you can remove this logic if not needed)


exports.createCategory = async (req, res) => {
  try {
    console.log("➡️ Received request:", req.body);
    console.log("➡️ Files received:", req.files);

    const { name } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const uploadImageToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'categories', resource_type: 'image' },
          (err, result) => {
            if (err) {
              console.error("❌ Cloudinary Upload Error:", err);
              return reject(new Error("Cloudinary error: " + err.message));
            }
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );
        stream.end(fileBuffer);
      });
    };

    const uploadedImages = await Promise.all(
      req.files.map(file => uploadImageToCloudinary(file.buffer))
    );

    const category = new Category({
      name,
      images: uploadedImages
    });

    await category.save();

    res.status(201).json({
      message: '✅ Category created successfully',
      category
    });

  } catch (error) {
    console.error("❌ Error creating category:", error);
    res.status(500).json({ message: '❌ Category creation failed', error: error.message });
  }
};


// Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};


// Get Single Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
};


// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Upload new images if any
    if (req.files && req.files.length > 0) {
      // Delete existing images from Cloudinary
      for (let img of category.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      const uploadImageToCloudinary = (fileBuffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'categories', resource_type: 'image' },
            (err, result) => {
              if (err) return reject(err);
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );
          stream.end(fileBuffer);
        });
      };

      const uploadedImages = await Promise.all(
        req.files.map(file => uploadImageToCloudinary(file.buffer))
      );

      category.images = uploadedImages;
    }

    if (name) category.name = name;

    await category.save();
    res.status(200).json({ message: 'Category updated', category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};


// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Delete images from Cloudinary
    for (let img of category.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};


// Toggle Active/Inactive
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.status = category.status === 'active' ? 'inactive' : 'active';
    await category.save();

    res.status(200).json({
      message: `Category status updated to ${category.status}`,
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle status', error: error.message });
  }
};
