// const mongoose = require('mongoose');

// const bookSchema = new mongoose.Schema({
//   categoryId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category',
//     required: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   author: {
//     type: String,
//     required: true
//   },
//   about: {
//     type: [String], // Store as chunks of paragraph
//     required: true
//   },
//   language: {
//     type: String,
//     enum: ['Hindi', 'English'],//
//     required: true
//   },
//   like: {
//     type: Boolean,
//     default: false
//   },
// pdf: {
//   file: Buffer,
//   filename: String,
//   mimetype: String
// }

// ,
//   images: [
//     {
//       public_id: String,
//       url: String
//     }
//   ]
// }, { timestamps: true });

// module.exports = mongoose.model('Book', bookSchema);




const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category',
  required: true
},
  name: String,
  authorDetails: {
    name: String,
    photo: String,
    info: String,
  },
  about: [String],
  language: String,
  images: {
    coverImage: String,
    otherImages: [String],
  },
pdf: [
  {
    url: String,
    price: Number,
    previewPages: {
      type: Number,
      default: 2
    },
    subscriberId: {
      type: String,
      default: ''
    }
  }
],


}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
