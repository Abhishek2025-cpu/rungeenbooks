// const Book = require('../Models/bookModel');
// const Category = require('../Models/categoryModel');
// const cloudinary = require('cloudinary').v2;



// // Upload utility
// const uploadImageToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'books', resource_type: 'image' },
//       (err, result) => {
//         if (err) return reject(err);
//         resolve({ url: result.secure_url, public_id: result.public_id });
//       }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // Add Book




// exports.addBook = async (req, res) => {
//   try {
//     const { name, author, about, language, category } = req.body;
//     const files = req.files;

//     // Upload images to Cloudinary
//     // Upload images
// const uploadedImages = await Promise.all(
//   (files.images || []).map(file =>
//     cloudinary.uploader.upload(file.path, { folder: 'books/images' })
//   )
// );

// // Upload PDF
// const uploadedPdf = files.pdf?.[0];
// if (!uploadedPdf) {
//   return res.status(400).json({ message: "PDF file is required" });
// }

// const newBook = new Book({
//   name,
//   author,
//   about,
//   language,
//   categoryId: category,
//   images: uploadedImages,
//   pdf: {
//     data: require('fs').readFileSync(uploadedPdf.path),
//     contentType: uploadedPdf.mimetype,
//     originalName: uploadedPdf.originalname,
//   },
//   like: false,
//   isSubscribed: false,
// });

//     await newBook.save();

//     res.status(201).json({
//       message: '✅ Book added successfully',
//       book: newBook,
//     });

//   } catch (error) {
//     console.error("❌ Error adding book:", error);
//     res.status(500).json({ message: "❌ Failed to add book", error: error.message });
//   }
// };



// exports.getPdfByBookId = async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.bookId);
//     if (!book || !book.pdf?.file) {
//       return res.status(404).json({ message: 'PDF not found' });
//     }

//     res.set({
//       'Content-Type': book.pdf.mimetype,
//       'Content-Disposition': `inline; filename="${book.pdf.filename}"`,
//     });

//     res.send(book.pdf.file);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch PDF', error: error.message });
//   }
// };


// // Get all books for a category
// exports.getBooksByCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     const subscribed = req.user?.subscribed;

//     const books = await Book.find({ categoryId }).sort({ createdAt: -1 }).populate('categoryId');

//     const updatedBooks = books.map(book => {
//       const bookObj = book.toObject();

//       // Add PDF URL only if subscribed
//       if (subscribed) {
//         bookObj.pdfUrl = `${req.protocol}://${req.get('host')}/books/pdf/${book._id}`;
//       } else {
//         delete bookObj.pdf;
//       }

//       return bookObj;
//     });

//     res.status(200).json(updatedBooks);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch books', error: error.message });
//   }
// };

// // Get single book by ID with nested info
// exports.getBookById = async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.bookId).populate('categoryId');
//     if (!book) return res.status(404).json({ message: 'Book not found' });

//     const subscribed = req.user?.subscribed;

//     const bookData = book.toObject();
//     if (subscribed) {
//       bookData.pdfUrl = `${req.protocol}://${req.get('host')}/books/pdf/${book._id}`;
//     } else {
//       delete bookData.pdf;
//     }

//     res.status(200).json(bookData);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch book', error: error.message });
//   }
// };



// // Toggle Like
// exports.toggleLike = async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.bookId);
//     if (!book) return res.status(404).json({ message: 'Book not found' });

//     book.like = !book.like;
//     await book.save();
//     res.status(200).json({ message: `Book like toggled`, like: book.like });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to toggle like', error: error.message });
//   }
// };



const Book = require('../Models/bookModel');
const Category = require('../Models/categoryModel');
const Review = require('../Models/Review');
const Like = require('../Models/Like');
const fs = require('fs');
const path = require('path');

// Add Book (local upload - images only)



const cloudinary = require('../config/cloudinary');


// exports.addBook = async (req, res) => {
//   try {
//     const {
//       name,
//       category,
//       about,
//       language,
//       authorName,
//       authorPhoto,
//       authorInfo,
//     } = req.body;

//     const files = req.files;

//     // ✅ Upload coverImage
//     let coverImageUrl = '';
//     if (files?.coverImage?.length > 0) {
//       const result = await cloudinary.uploader.upload(files.coverImage[0].path, {
//         folder: 'books/images',
//       });
//       coverImageUrl = result.secure_url;
//       fs.unlinkSync(files.coverImage[0].path);
//     }

//     // ✅ Upload otherImages
//     const otherImages = [];
//     if (files?.otherImages?.length > 0) {
//       for (const file of files.otherImages) {
//         const result = await cloudinary.uploader.upload(file.path, {
//           folder: 'books/images',
//         });
//         otherImages.push(result.secure_url);
//         fs.unlinkSync(file.path);
//       }
//     }

//     // ✅ Upload PDFs
//     const pdfUrls = [];
//     if (files?.pdf?.length > 0) {
//       for (const file of files.pdf) {
//         const result = await cloudinary.uploader.upload(file.path, {
//           resource_type: 'raw',
//           folder: 'books/pdfs',
//         });
//         pdfUrls.push(result.secure_url);
//         fs.unlinkSync(file.path);
//       }
//     }

//     // ✅ Save to DB
//     const newBook = new Book({
//       name: name?.trim(),
//       category: category?.trim(),
//       about: Array.isArray(about) ? about : [about],
//       language: language?.trim(),
//       images: {
//         coverImage: coverImageUrl,
//         otherImages,
//       },
//       pdf: pdfUrls,
//       authorDetails: {
//         name: authorName?.trim(),
//         photo: authorPhoto?.trim(),
//         info: authorInfo?.trim(),
//       },
//       like: false,
//     });

//     await newBook.save();

//     res.status(201).json({
//       message: '✅ Book added successfully',
//       book: newBook,
//     });

//   } catch (error) {
//     console.error('❌ Error adding book:', error);
//     res.status(500).json({
//       message: '❌ Failed to add book',
//       error: error.message,
//     });
//   }
// };


exports.addBook = async (req, res) => {
  try {
    const {
      name,
      category,
      about,
      language,
      authorName,
      authorPhoto,
      authorInfo,
      pdf // Can be array of objects or single object
    } = req.body;

    const files = req.files;

    // ✅ Upload coverImage
    let coverImageUrl = '';
    if (files?.coverImage?.length > 0) {
      const result = await cloudinary.uploader.upload(files.coverImage[0].path, {
        folder: 'books/images',
      });
      coverImageUrl = result.secure_url;
      fs.unlinkSync(files.coverImage[0].path);
    }

    // ✅ Upload otherImages
    const otherImages = [];
    if (files?.otherImages?.length > 0) {
      for (const file of files.otherImages) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'books/images',
        });
        otherImages.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    // ✅ Handle PDFs (metadata or upload)
    let pdfData = [];

    // If pdf comes in request body with metadata
    if (pdf) {
      let parsedPdf = [];

      try {
        parsedPdf = typeof pdf === 'string' ? JSON.parse(pdf) : pdf;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid PDF format in body. Must be JSON array or object.' });
      }

      if (!Array.isArray(parsedPdf)) parsedPdf = [parsedPdf];

      pdfData = parsedPdf.map(p => ({
        url: p.url,
        price: Number(p.price) || 0,
        previewPages: Number(p.previewPages) || 2,
        subscriberId: ''
      }));
    }

    // If PDFs are uploaded as files
    if (pdfData.length === 0 && files?.pdf?.length > 0) {
      for (const file of files.pdf) {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: 'raw',
          folder: 'books/pdfs',
        });

        pdfData.push({
          url: result.secure_url,
          price: 0,
          previewPages: 2,
          subscriberId: ''
        });

        fs.unlinkSync(file.path);
      }
    }

    // ✅ Save Book
    const newBook = new Book({
      name: name?.trim(),
      category: category?.trim(),
      about: Array.isArray(about) ? about : [about],
      language: language?.trim(),
      images: {
        coverImage: coverImageUrl,
        otherImages,
      },
      pdf: pdfData,
      authorDetails: {
        name: authorName?.trim(),
        photo: authorPhoto?.trim(),
        info: authorInfo?.trim(),
      },
      like: false
    });

    await newBook.save();

    res.status(201).json({
      message: '✅ Book added successfully',
      book: newBook,
    });

  } catch (error) {
    console.error('❌ Error adding book:', error);
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


