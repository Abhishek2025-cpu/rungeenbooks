const Book = require('../Models/bookModel');
const Category = require('../Models/categoryModel');
const cloudinary = require('../config/cloudinary');

// Upload utility
const uploadImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'books', resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};

// Add Book
const Book = require('../Models/bookModel');
const cloudinary = require('../config/cloudinary');

exports.addBook = async (req, res) => {
  try {
    const { name, author, about, language, categoryId } = req.body;
    const images = req.files?.images || [];
    const pdfFile = req.files?.pdf?.[0] || null;

    if (!name || !author || !about || !language || !categoryId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (images.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    // Upload images to Cloudinary
    const uploadImageToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'books', resource_type: 'image' },
          (err, result) => {
            if (err) return reject(err);
            resolve({ url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(fileBuffer);
      });
    };

    const uploadedImages = await Promise.all(
      images.map(file => uploadImageToCloudinary(file.buffer))
    );

    // Upload PDF to Cloudinary
    let uploadedPdf = null;
    if (pdfFile) {
      const uploadPdfToCloudinary = (fileBuffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'books/pdf', resource_type: 'raw' },
            (err, result) => {
              if (err) return reject(err);
              resolve({ url: result.secure_url, public_id: result.public_id });
            }
          );
          stream.end(fileBuffer);
        });
      };
      uploadedPdf = await uploadPdfToCloudinary(pdfFile.buffer);
    }

    // Create and save the book
    const newBook = new Book({
      name,
      author,
      about,
      language,
      images: uploadedImages,
      category: categoryId,
      like: false, // default
      pdf: uploadedPdf,
    });

    await newBook.save();

    res.status(201).json({
      message: "✅ Book added successfully",
      book: newBook
    });

  } catch (error) {
    console.error("❌ Error adding book:", error);
    res.status(500).json({ message: "❌ Failed to add book", error: error.message });
  }
};



// Get all books for a category
exports.getBooksByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const books = await Book.find({ categoryId }).sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch books', error: error.message });
  }
};

// Get single book by ID with nested info
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId).populate('categoryId');
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const subscribed = req.user?.subscribed; // Or get it from DB if needed

    const bookData = book.toObject();
    if (!subscribed) {
      delete bookData.pdf; // Hide PDF
    }

    res.status(200).json(bookData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch book', error: error.message });
  }
};


// Toggle Like
exports.toggleLike = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.like = !book.like;
    await book.save();
    res.status(200).json({ message: `Book like toggled`, like: book.like });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
};
