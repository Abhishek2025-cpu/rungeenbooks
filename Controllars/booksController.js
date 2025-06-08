const Book = require('../Models/book');
const Category = require('../Models/categoryModel');
const fs = require('fs');
const path = require('path');

// @route   POST /api/book/add-book
exports.addBook = async (req, res) => {
  try {
    const { name, author, about, status, categoryId, language } = req.body;

    if (!name || !author || !language || !categoryId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Find category by ID in the body
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // ✅ Handle uploaded images
    const imagePaths = req.files?.map(file => file.path) || [];

    const book = new Book({
      name,
      author,
      about,
      language,
      status,
      category: category._id,
      images: imagePaths,
    });

    await book.save();
    res.status(201).json({ message: '✅ Book added successfully', book });

  } catch (error) {
    console.error("🔥 Error in addBook:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};

// @route   GET /api/book/category/:categoryId
exports.getBooksByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const books = await Book.find({ category: categoryId }).populate('category', 'name');
    res.status(200).json(books);

  } catch (error) {
    console.error("🔥 Error in getBooksByCategory:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
