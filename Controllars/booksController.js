


const path = require('path');
const Book = require('../Models/Book');

const addBook = async (req, res) => {
  console.log("FILES:", req.files);
  console.log("BODY:", req.body);

  try {
    const {
      name,
      about,
      category,
      price,
      authorName,
      authorInfo,
      isfav,
    } = req.body;

    const pdfFile = req.files?.pdf?.[0];
    const coverImage = req.files?.coverImage?.[0];
    const otherImages = req.files?.otherImages || [];
    const authorPhoto = req.files?.authorPhoto?.[0];

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
      images: {
        otherImages: otherImages.map(img => `/uploads/${img.filename}`)
      },
      authorDetails: {
        name: authorName,
        info: authorInfo,
        photo: authorPhoto ? `/uploads/${authorPhoto.filename}` : undefined,
      },
      isfav: isfav === 'true' || isfav === true, // handle string input from form
      // overallRating, overallLikes, and bookReview are optional and defaulted in schema
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


const getBooksByCategory = async (req, res) => {
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

module.exports = { addBook,getBooksByCategory };


