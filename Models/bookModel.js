const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  about: {
    type: [String], // Store as chunks of paragraph
    required: true
  },
  language: {
    type: String,
    enum: ['hindi', 'english'],
    required: true
  },
  like: {
    type: Boolean,
    default: false
  },
  pdf: {
  public_id: { type: String },
  url: { type: String }
}
,
  images: [
    {
      public_id: String,
      url: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
