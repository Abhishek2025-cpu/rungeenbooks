
const mongoose = require('mongoose');


const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  about: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  pdfUrl: { type: String, required: true },
  coverImage: { type: String },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthorInfo', required: true },
  subscribeId: { type: String, default: null },
  status: { type: Boolean, default: true }, 

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isFree: { type: Boolean, default: false }  // ✅ New field
}, { timestamps: true });
module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
