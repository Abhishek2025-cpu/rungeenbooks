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
