const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  dateOfBirth: Date,
  country: {type: String,required: false},
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  fullName: String,
  profilePhoto: {
    type: String,
    default: function() {
      return this.gender === 'female' ? 'default-female.png' : 'default-male.png';
    }
  },
  bio: String,
  blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  likedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  savedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

