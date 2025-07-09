// controllers/bookController.js
const Book = require('../Models/Book');

const addBook = async (req, res) => {
  

  try {
    const { name, about, category, price } = req.body;
      const pdfFile = req.files?.pdf?.[0];

    // Access PDF file correctly when using upload.fields

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }


const coverImage = req.files?.coverImage?.[0];
const otherImages = req.files?.otherImages || [];

const newBook = new Book({
  name: req.body.name,
  about: req.body.about,
  category: req.body.category,
  price: req.body.price,
  pdfUrl: pdfFile ? `/uploads/${pdfFile.filename}` : undefined,
  coverImage: coverImage ? `/uploads/${coverImage.filename}` : undefined,
  images: {
    otherImages: otherImages.map(f => `/uploads/${f.filename}`)
  }
});

    await newBook.save();

   return res.status(201).json({
  message: 'Book added successfully',
  book: {
    ...newBook.toObject(),
    pdf: newBook.pdfUrl, // ✅ override for response
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


module.exports = { addBook };
