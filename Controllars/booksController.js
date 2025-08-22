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
    const { name, about, category, price, authorId, isFree, language } = req.body;

    // Validate language
    if (!['English', 'Hindi'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language. Must be English or Hindi' });
    }

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
      isFree: isFree === 'true',
      language  // ✅ Include language
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

    const books = await Book.find({ category: categoryId }).lean();

    const enrichedBooks = await Promise.all(
      books.map(async (book) => {
        const authorDetails = await AuthorInfo.findById(book.authorId).lean();

        const reviewsRaw = await Review.find({ book: book._id })
          .populate('user', '_id firstname lastname profileImage')
          .lean();

        const reviews = reviewsRaw.map((review) => ({
          ...review,
          user: {
            _id: review.user._id,
            name: `${review.user.firstname || ''} ${review.user.lastname || ''}`.trim(),
            profile: review.user.profileImage || '',
          },
        }));

        const likesCount = await BookLike.countDocuments({ book: book._id });

        const relatedBooks = await Book.find({
          category: categoryId,
          _id: { $ne: book._id },
        })
          .select('name coverImage price isFree')
          .limit(5)
          .lean();

        const averageRating = reviews.length
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : null;

        return {
          ...book,
          authorDetails,
          reviews,
          likesCount,
          averageRating: averageRating ? parseFloat(averageRating) : 0,
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

    const book = await Book.findById(id)
      .populate('category')
      .populate('authorId')
      .lean();

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const { authorId, category, ...rest } = book;
    const cleanCategory = { ...category };
    delete cleanCategory.images;

    const reviewsRaw = await Review.find({ book: id })
      .populate('user', '_id firstname lastname profileImage')
      .lean();

    const reviews = reviewsRaw.map((review) => ({
      ...review,
      user: {
        _id: review.user._id,
        name: `${review.user.firstname || ''} ${review.user.lastname || ''}`.trim(),
        profile: review.user.profileImage || '',
      },
    }));

    const likesCount = await BookLike.countDocuments({ book: id });

    const relatedBooks = await Book.find({
      category: book.category._id,
      _id: { $ne: id },
    })
      .select('name coverImage price isFree')
      .limit(5)
      .lean();

    const averageRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({
      success: true,
      book: {
        ...rest,
        category: cleanCategory,
        authorDetails: authorId,
        averageRating: averageRating ? parseFloat(averageRating) : 0,
      reviews,
      likesCount,
      relatedBooks,
      }
    
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


//latest books

exports.getLatestBooks = async (req, res) => {
  try {
    // Step 1: Get distinct categories
    const categories = await Book.distinct('category');

    const latestBooks = await Promise.all(
      categories.map(async (categoryId) => {
        // Step 2: Get the latest book in this category
        const latestBook = await Book.findOne({ category: categoryId })
          .sort({ updatedAt: -1 }) // newest first
          .lean();

        if (!latestBook) return null;

        // Step 3: Enrich with author, reviews, likeCount
        const authorDetails = await AuthorInfo.findById(latestBook.authorId).lean();

        const reviewsRaw = await Review.find({ book: latestBook._id })
          .populate('user', '_id firstname lastname profileImage')
          .lean();

        const reviews = reviewsRaw.map((review) => ({
          ...review,
          user: {
            _id: review.user._id,
            name: `${review.user.firstname || ''} ${review.user.lastname || ''}`.trim(),
            profile: review.user.profileImage || '',
          },
        }));

        const averageRating = reviews.length
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : null;

        const likeCount = await BookLike.countDocuments({ book: latestBook._id });

        return {
          ...latestBook,
          authorDetails,
          reviews,
          likeCount,
          averageRating: averageRating ? parseFloat(averageRating) : 0,
        };
      })
    );

    const filteredBooks = latestBooks.filter(Boolean); // remove nulls if any

    res.status(200).json({
      message: 'Latest books from each category fetched successfully',
      books: filteredBooks,
    });
  } catch (err) {
    console.error('Get Latest Books Error:', err);
    res.status(500).json({
      error: 'Something went wrong',
      details: err.message,
    });
  }
};



// ...existing code...

// Search books by name and category
exports.searchBooks = async (req, res) => {
  try {
    const { name, categoryId } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Book name is required for search' });
    }

    const query = {
      name: { $regex: name, $options: 'i' }
    };
    if (categoryId) {
      query.category = categoryId;
    }

    const books = await Book.find(query).lean();

    res.status(200).json({
      message: 'Books fetched successfully',
      books
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
};

// Filter books by age and price
exports.filterBooks = async (req, res) => {
  try {
    const { minAge, maxAge, minPrice, maxPrice } = req.query;

    const query = {};

    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = Number(minAge);
      if (maxAge) query.age.$lte = Number(maxAge);
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const books = await Book.find(query).lean();

    res.status(200).json({
      message: 'Books filtered successfully',
      books
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
};












