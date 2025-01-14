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
  author: {
    type: String,
    required: true,
  },
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

function generateSlug(author, heading) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(author + heading + salt)
    .digest('hex');
  return hash.substring(0, 12);
}

blogSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('heading')) {
    let slug = generateSlug(this.author, this.heading);
    let uniqueSlug = slug;
    let counter = 1;

    while (await mongoose.model('Blog').findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
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

