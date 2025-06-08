const Book = require('../Models/book');
const Category = require('../Models/categoryModel');
const fs = require('fs');
const path = require('path');

exports.addBook = async (req, res) => {
  try {
    const { bookName, author, about, status } = req.body;
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const images = req.files.map(file => ({
      filename: file.filename,
      path: file.path,
    }));

    const book = new Book({
      categoryId,
      bookName,
      author,
      about,
      status,
      images,
    });

    await book.save();
    res.status(201).json({ message: 'Book added successfully', book });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
