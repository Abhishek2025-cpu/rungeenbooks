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
      overallRating,
      overallLikes
    } = req.body;

    const bookReview = req.body.bookReview ? JSON.parse(req.body.bookReview) : [];

    // Map files by fieldname for easy lookup
    const fileMap = {};
    req.files?.forEach(file => {
      fileMap[file.fieldname] = file;
    });

    const pdfFile = fileMap['pdf'];
    const coverImage = fileMap['coverImage'];
    const authorPhoto = fileMap['authorPhoto'];

    // Filter out otherImages (can be multiple)
    const otherImages = req.files?.filter(f => f.fieldname === 'otherImages') || [];

    // Replace userprofile keys like 'reviewProfile_0' with actual uploaded path
    bookReview.forEach((review, index) => {
      const profileKey = review.userprofile; // example: 'reviewProfile_0'
      const profileFile = fileMap[profileKey];
      if (profileFile) {
        review.userprofile = `/uploads/${profileFile.filename}`;
      } else {
        review.userprofile = ''; // fallback or leave unchanged
      }
    });

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const newBook = new Book({
      name,
      about,
      category,
      price,
      pdfUrl: `/uploads/${pdfFile.filename}`,
      bookReview,
      coverImage: coverImage ? `/uploads/${coverImage.filename}` : undefined,
      images: {
        otherImages: otherImages.map(img => `/uploads/${img.filename}`)
      },
      authorDetails: {
        name: authorName,
        info: authorInfo,
        photo: authorPhoto ? `/uploads/${authorPhoto.filename}` : undefined,
      },
      isfav: isfav === 'true' || isfav === true,
      overallRating: Number(overallRating) || 0,
      overallLikes: Number(overallLikes) || 0
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


