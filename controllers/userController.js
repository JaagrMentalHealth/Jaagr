const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      adminName: req.body.adminName,
      email: req.body.email,
      password: req.body.password,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      fullName: req.body.fullName,
      bio: req.body.bio
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      res.status(400).json({
        status: 'fail',
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please choose a different one.`
      });
    } else {
      res.status(400).json({
        status: 'fail',
        message: err.message
      });
    }
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password!' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    const token = signToken(user._id);
    res.status(200).json({
      status: 'success',
      token
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('blogs likedBlogs savedBlogs history');
    if (!user) {
      return res.status(404).json({ message: 'No user found with that ID' });
    }
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Check if adminName is being updated
    if (req.body.adminName) {
      const existingUser = await User.findOne({ adminName: req.body.adminName });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(400).json({
          status: 'fail',
          message: 'Admin name already exists. Please choose a different one.'
        });
      }
    }

    // Check if email is being updated
    if (req.body.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email already exists. Please choose a different one.'
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ message: 'No user found with that ID' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'No user found with that ID' });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

