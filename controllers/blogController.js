const Blog = require('../models/Blog');
const User = require('../models/User');

exports.createBlog = async (req, res) => {
  try {
    const { heading, tags, coverPhoto, content, draft } = req.body;

    if (!heading || !tags || !content) {
      return res.status(400).json({
        status: 'fail',
        message: 'Heading, tags, and content are required fields'
      });
    }

    const newBlog = await Blog.create({
      heading,
      tags,
      coverPhoto,
      content,
      draft: draft !== undefined ? draft : true,
      author: req.user.userName,
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { blogs: newBlog._id } });

    res.status(201).json({
      status: 'success',
      data: {
        blog: newBlog
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ draft: false });
    res.status(200).json({
      status: 'success',
      results: blogs.length,
      data: {
        blogs
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: 'No blog found with that slug' });
    }

    blog.views += 1;
    await blog.save();

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { history: blog._id } });
    }

    res.status(200).json({
      status: 'success',
      data: {
        blog
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, author: req.user.userName },
      req.body,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({ message: 'No blog found with that slug or you are not the author' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        blog
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({ slug: req.params.slug, author: req.user.userName });

    if (!blog) {
      return res.status(404).json({ message: 'No blog found with that slug or you are not the author' });
    }

    await User.findByIdAndUpdate(req.user._id, { $pull: { blogs: blog._id } });

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

exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: 'No blog found with that slug' });
    }

    blog.likes += 1;
    await blog.save();

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { likedBlogs: blog._id } });

    res.status(200).json({
      status: 'success',
      data: {
        blog
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// exports.saveBlog = async (req, res) => {
//   try {
//     const blog = await Blog.findOne({ slug: req.params.slug });
//     if (!blog) {
//       return res.status(404).json({ message: 'No blog found with that slug' });
//     }

//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (user.savedBlogs.includes(blog._id)) {
//       return res.status(400).json({ message: 'Blog already saved' });
//     }

//     user.savedBlogs.push(blog._id);
//     await user.save();

//     res.status(200).json({
//       status: 'success',
//       message: 'Blog saved successfully'
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err.message
//     });
//   }
// };

// exports.getSavedBlogs = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).populate('savedBlogs');
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({
//       status: 'success',
//       results: user.savedBlogs.length,
//       data: {
//         savedBlogs: user.savedBlogs
//       }
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err.message
//     });
//   }
// };

exports.getAuthorBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.authorName }).sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: blogs.length,
      data: {
        blogs
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getCurrentUserBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.userName }).sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: blogs.length,
      data: {
        blogs
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

