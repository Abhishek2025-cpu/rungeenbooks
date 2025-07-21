// const mongoose = require('mongoose');

// const bookSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   about: { type: String, required: true }, // ✅ Ensure it's a string not array
//   category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
//   price: { type: Number, required: true },
//   pdfUrl: { type: String, required: true },
//   coverImage: { type: String },
//   images: {
//     otherImages: [String]
//   },
//   subscribeId: { type: String, default: null },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
// }, { timestamps: true });

// module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);


const mongoose = require('mongoose');

const bookReviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  userprofile: { type: String }, // URL or path to the profile image
  review: { type: String, required: true },
  rating: { type: Number, required: true }
}, { timestamps: true });

const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  about: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  pdfUrl: { type: String, required: true },
  coverImage: { type: String },
  images: {
    otherImages: [String]
  },
  authorDetails: {
    name: { type: String },
    photo: { type: String }, // Image URL or path
    info: { type: String }
  },
  isfav: { type: Boolean, default: false },
  overallRating: { type: Number, default: 0 },
  bookReview: [bookReviewSchema],
  overallLikes: { type: Number, default: 0 },

  subscribeId: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);

