const mongoose = require('mongoose');
const crypto = require('crypto');

const blogSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true,
  },
  tags: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one tag is required'
    }
  },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  coverPhoto: {
    type: String,
    default: null
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  draft: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

function generateSlug(heading) {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')           // Remove special characters
    .replace(/\s+/g, '-')               // Replace spaces with dashes
    .replace(/--+/g, '-')               // Remove multiple consecutive dashes
    .substring(0, 100);                 // Optional: limit length
}


blogSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('heading')) {
    const baseSlug = generateSlug(this.heading);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await mongoose.model('Blog').findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = uniqueSlug;
  }
  next();
});


blogSchema.index({ slug: 1 });
blogSchema.index({ author: 1, createdAt: -1 });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;

