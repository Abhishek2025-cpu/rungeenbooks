const Book = require('../Models/book');
const Category = require('../Models/categoryModel');
const fs = require('fs');
const path = require('path');




exports.addBook = async (req, res) => {
  try {
    const { name, author, about, status, categoryId, language } = req.body;

    // if (!name || !author || !language || !categoryId) {
    //   return res.status(400).json({ error: "Missing required fields" });
    // }

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const imagePaths = req.files?.map(file => file.path) || [];

    const book = new Book({
      name,
      author,
      about,
      language,
      status,
      category: categoryId,
      images: imagePaths,
    });

    await book.save();
    res.status(201).json({ message: 'Book added successfully', book });

  } catch (error) {
    console.error("🔥 Error in addBook:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};



exports.getBooksByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const books = await Book.find({ categoryId }).populate('categoryId', 'name');
    res.status(200).json(books);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
