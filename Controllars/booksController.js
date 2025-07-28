const path = require('path');
const Book = require('../Models/Book');

const Review = require('../Models/Review');
const BookLike = require('../Models/bookLikeModel');
const AuthorInfo = require('../Models/authorInfoModel');

exports.addBook = async (req, res) => {
  console.log("FILES:", req.files);
  console.log("BODY:", req.body);

  try {
    const { name, about, category, price,authorId  } = req.body;

    // Map files by fieldname
    const fileMap = {};
    req.files?.forEach(file => {
      fileMap[file.fieldname] = file;
    });

    const pdfFile = fileMap['pdf'];
    const coverImage = fileMap['coverImage'];

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const newBook = new Book({
      name,
      about,
      category,
      price,
      pdfUrl: `/uploads/${pdfFile.filename}`,
      coverImage: coverImage ? `/uploads/${coverImage.filename}` : undefined,
      authorId,
    });

    await newBook.save();

    return res.status(201).json({
      message: 'Book added successfully',
      book: {
        ...newBook.toObject(),
        pdf: newBook.pdfUrl,
      }
    });
  } catch (err) {
    console.error('Add Book Error:', err);
    return res.status(500).json({
      error: 'Something went wrong',
      details: err.message
    });
  }
};




exports.getBooksByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const books = await Book.find({ category: categoryId });

    return res.status(200).json({
      message: 'Books fetched successfully',
      books,
    });
  } catch (err) {
    console.error('Get Books By Category Error:', err);
    return res.status(500).json({
      error: 'Something went wrong',
      details: err.message,
    });
  }
};




exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get book
    const book = await Book.findById(id).populate('category').populate('authorId');

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // 2. Get reviews
    const reviews = await Review.find({ book: id }).populate('user', 'name email');

    // 3. Count likes
    const likesCount = await BookLike.countDocuments({ book: id });

    // 4. Prepare response
    res.json({
      success: true,
      book,
      author: book.authorId, // from population
      reviews,
      likesCount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};











