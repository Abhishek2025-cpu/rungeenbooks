const path = require('path');
const Book = require('../Models/Book');

const Review = require('../Models/Review');
const BookLike = require('../Models/bookLikeModel');
const AuthorInfo = require('../Models/authorInfoModel');

const fs = require('fs');

exports.addBook = async (req, res) => {
  console.log("FILES:", req.files);
  console.log("BODY:", req.body);

  try {
    const { name, about, category, price, authorId, isFree } = req.body;

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
      isFree: isFree === 'true' // ✅ Convert string to Boolean
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

    // Step 1: Fetch all books in the category
    const books = await Book.find({ category: categoryId }).lean();

    // Step 2: Enhance each book
    const enrichedBooks = await Promise.all(
      books.map(async (book) => {
        // Fetch author details
        const authorDetails = await AuthorInfo.findById(book.authorId).lean();

        // Fetch reviews
        const reviews = await Review.find({ book: book._id })
    .populate('user', '_id firstname lastname profileImage')


          .lean();

        // Count likes
        const likesCount = await BookLike.countDocuments({ book: book._id });

        // Fetch related books from same category excluding current book
        const relatedBooks = await Book.find({
          category: categoryId,
          _id: { $ne: book._id },
        })
          .select('name coverImage price isFree') // limit fields
          .limit(5)
          .lean();

        return {
          ...book,
          authorDetails,
          reviews,
          likesCount,
          relatedBooks,
        };
      })
    );

    return res.status(200).json({
      message: 'Books fetched successfully',
      books: enrichedBooks,
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

    // 1. Fetch the main book
    const book = await Book.findById(id)
      .populate('category')
      .populate('authorId')
      .lean();

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // 2. Prepare response fields
    const { authorId, category, ...rest } = book;

    // 3. Remove category.images
    const cleanCategory = { ...category };
    delete cleanCategory.images;

    // 4. Get reviews
    const reviews = await Review.find({ book: id }).populate('user', '_id firstname lastname profileImage').lean();

    // 5. Count likes
    const likesCount = await BookLike.countDocuments({ book: id });

    // 6. Fetch related books by category (excluding the current book)
    const relatedBooks = await Book.find({
      category: book.category._id,
      _id: { $ne: id },
    })
      .select('name coverImage price isFree') // Fetch only needed fields
      .limit(5) // Optional: limit the number of related books
      .lean();

    // 7. Return full response
    res.json({
      success: true,
      book: {
        ...rest,
        category: cleanCategory,
        authorDetails: authorId,
      },
      reviews,
      likesCount,
      relatedBooks,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};




exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.files?.length) {
      const fileMap = {};
      req.files.forEach(file => {
        fileMap[file.fieldname] = file;
      });

      if (fileMap['pdf']) {
        updates.pdfUrl = `/uploads/${fileMap['pdf'].filename}`;
      }

      if (fileMap['coverImage']) {
        updates.coverImage = `/uploads/${fileMap['coverImage'].filename}`;
      }
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      book: updatedBook
    });
  } catch (err) {
    console.error('Update Book Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Book.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Delete Book Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};



exports.toggleBookStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the current book
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Toggle the status
    const updatedStatus = !book.status;

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { status: updatedStatus },
      { new: true }
    );

    res.json({
      success: true,
      message: `Book ${updatedBook.status ? 'enabled' : 'disabled'} successfully`,
      book: updatedBook
    });
  } catch (err) {
    console.error('Toggle Book Status Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};











