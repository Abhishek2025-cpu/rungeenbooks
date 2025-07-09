
const Book = require('../Models/bookModel');
const fs = require('fs/promises');
const cloudinary = require('cloudinary').v2;
const Review = require('../Models/Review'); 
const Like = require('../Models/Like');


exports.addBook = async (req, res) => {
  try {
    const {
      name,
      category,
      about,
      language,
      // Destructure all expected author fields
      authorName,
      authorPhoto,
      authorInfo,
      // Also get the old 'author' field as a fallback
      author,
      pdf,
    } = req.body;

    const files = req.files;

    // --- 1. Handle File Uploads Concurrently ---
    let coverImagePromise = null;
    if (files?.coverImage?.[0]) {
      coverImagePromise = cloudinary.uploader.upload(files.coverImage[0].path, {
        folder: 'books/images',
      });
    }

    let otherImagesPromises = [];
    if (files?.otherImages?.length > 0) {
      otherImagesPromises = files.otherImages.map(file =>
        cloudinary.uploader.upload(file.path, { folder: 'books/images' })
      );
    }

    const [coverImageResult, ...otherImagesResults] = await Promise.all([
      coverImagePromise,
      ...otherImagesPromises,
    ]);

    const coverImageUrl = coverImageResult ? coverImageResult.secure_url : '';
    const otherImagesUrls = otherImagesResults.map(result => result.secure_url);

    // --- 2. Handle PDF Data ---
    let pdfData = [];
    if (files?.pdf?.length > 0) {
      const result = await cloudinary.uploader.upload(files.pdf[0].path, {
        folder: 'books/pdfs',
        resource_type: 'raw',
      });
      pdfData.push({
        url: result.secure_url,
        price: req.body.price || 0,
        previewPages: req.body.previewPages || 2,
        subscriberId: '',
      });
    }

    // --- 3. Clean up all local files ---
    if (files) {
      const allFiles = Object.values(files).flat();
      for (const file of allFiles) {
        await fs.unlink(file.path);
      }
    }

    // --- 4. Create and Save the New Book ---
    const newBook = new Book({
      name: name?.trim(),
      category: category?.trim(),
      about: about ? (Array.isArray(about) ? about : [about]) : [],
      language: language?.trim(),
      images: {
        coverImage: coverImageUrl,
        otherImages: otherImagesUrls,
      },
      pdf: pdfData,
      authorDetails: {
        // Use authorName if present, otherwise fall back to the old 'author' field
        name: authorName?.trim() || author?.trim(),
        photo: authorPhoto?.trim(),
        info: authorInfo?.trim(),
      },
    });

    await newBook.save();

    res.status(201).json({
      message: '✅ Book added successfully!',
      book: newBook,
    });

  } catch (error) {
    console.error('❌ Error adding book:', error);

    // Attempt to clean up files even if an error occurs
    if (req.files) {
      const allFiles = Object.values(req.files).flat();
      for (const file of allFiles) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', file.path, cleanupError);
        }
      }
    }
    
    // Provide a more specific error message if it's a Multer error
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            message: `❌ File is too large. Maximum size is 10 MB.`,
        });
    }

    res.status(500).json({
      message: '❌ Failed to add book',
      error: error.message,
    });
  }
};






// Get books by category
exports.getBooksByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const books = await Book.find({ category: categoryId });

    const enhancedBooks = await Promise.all(books.map(async book => {
      const reviews = await Review.find({ bookId: book._id }).populate('userId', 'firstname lastname');
      const likesCount = await Like.countDocuments({ bookId: book._id });
      const averageRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

      return {
        ...book.toObject(),
        reviews,
        likesCount,
        averageRating
      };
    }));

    res.json({ books: enhancedBooks });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to fetch books', error: error.message });
  }
};



// Get single book by ID
exports.getBookById = async (req, res) => {
  try {
    const { bookId } = req.params;

    // 1. Get book with category populated
    const book = await Book.findById(bookId).populate('category');
    if (!book) {
      return res.status(404).json({ message: '❌ Book not found' });
    }

    // 2. Fetch reviews
    const reviews = await Review.find({ bookId });

    // 3. Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // 4. Get likes count
    const likesCount = await Like.countDocuments({ bookId });

    // 5. Attach additional fields to book
    const bookWithExtras = {
      ...book.toObject(),
      reviews,
      likesCount,
      averageRating: parseFloat(averageRating.toFixed(1))
    };

    res.status(200).json(bookWithExtras);
  } catch (error) {
    console.error('Error in getBookById:', error);
    res.status(500).json({ message: '❌ Failed to fetch book', error: error.message });
  }
};

// DELETE /api/books/delete-by-category/:categoryId
exports.deleteBooksByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const books = await Book.find({ category: categoryId });
    if (!books.length) {
      return res.status(404).json({ message: 'No books found in this category' });
    }

    // ❌ Delete Cloudinary assets (optional cleanup)
    for (const book of books) {
      for (const img of book.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }
      if (book.pdf?.public_id) {
        await cloudinary.uploader.destroy(book.pdf.public_id, { resource_type: 'raw' });
      }
    }

    // 🗑️ Delete books
    const result = await Book.deleteMany({ category: categoryId });

    res.status(200).json({
      message: '✅ Books deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting books by category:', error);
    res.status(500).json({ message: '❌ Failed to delete books', error: error.message });
  }
};


// PUT /api/books/update-by-category/:categoryId
exports.updateBooksByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const updateFields = req.body;

    // Check if category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update all books with the matching category
    const result = await Book.updateMany(
      { category: categoryId },
      { $set: updateFields }
    );

    res.status(200).json({
      message: '✅ Books updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error updating books by category:', error);
    res.status(500).json({ message: '❌ Failed to update books', error: error.message });
  }
};


exports.updateSubscriberId = async (req, res) => {
  const { bookId, pdfUrl, userId } = req.body;

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const pdfItem = book.pdf.find(p => p.url === pdfUrl);
    if (!pdfItem) return res.status(404).json({ message: 'PDF not found' });

    pdfItem.subscriberId = userId;
    await book.save();

    res.status(200).json({ message: 'Subscriber added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subscriberId', error: err.message });
  }
};

////////////////////////////////////07-07-2025//////////////////////////////////////////////////////////////////



