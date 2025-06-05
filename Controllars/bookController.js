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
exports.addBook = async (req, res) => {
  try {
    const { name, author, about, language, categoryId } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const images = req.files.filter(file => file.mimetype.startsWith('image/'));
    const pdfFile = req.files.find(file => file.mimetype === 'application/pdf');

    if (images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const uploadedImages = await Promise.all(
      images.map(file => uploadImageToCloudinary(file.buffer))
    );

    let uploadedPdf = null;
    if (pdfFile) {
      uploadedPdf = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'books/pdf', resource_type: 'raw' },
          (err, result) => {
            if (err) return reject(err);
            resolve({ url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(pdfFile.buffer);
      });
    }

    const book = new Book({
      categoryId,
      name,
      author,
      about: about.split('\n').filter(p => p.trim() !== ''),
      language,
      images: uploadedImages,
      pdf: uploadedPdf || undefined
    });

    await book.save();
    res.status(201).json({ message: '✅ Book added', book });

  } catch (error) {
    res.status(500).json({ message: '❌ Failed to add book', error: error.message });
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
