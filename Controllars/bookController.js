const Book = require('../Models/bookModel');
const Category = require('../Models/categoryModel');
const cloudinary = require('cloudinary').v2;



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
    const { name, author, about, language, category } = req.body;
    const files = req.files;

    if (!name || !author || !about || !language || !category || !files || !files.images || !files.pdf) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Upload images
    const uploadedImages = await Promise.all(
      files.images.map(file =>
        cloudinary.uploader.upload(file.path, { folder: 'books/images' })
      )
    );

    // Upload PDF
    const uploadedPdf = await cloudinary.uploader.upload(files.pdf[0].path, {
      folder: 'books/pdf',
      resource_type: 'raw',
    });

    const newBook = new Book({
      name,
      author,
      about,
      language,
      categoryId: category,
      images: uploadedImages,
      pdf: uploadedPdf,
      like: false,
      isSubscribed: false,
    });

    await newBook.save();

    res.status(201).json({
      message: '✅ Book added successfully',
      book: newBook,
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
