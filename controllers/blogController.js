const Blog = require("../models/Blog");
const User = require("../models/User");

exports.createBlog = async (req, res) => {
  try {
    const { heading, tags, coverPhoto, content, draft } = req.body;

    // Validate required fields
    if (!heading || !tags || !content) {
      return res.status(400).json({
        status: "fail",
        message: "Heading, tags, and content are required fields",
      });
    }

    // Check if a blog with the same heading exists
    const existingBlog = await Blog.findOne({ heading });
    console.log(existingBlog);
    if (existingBlog) {
      // If the author is the same, update the blog
      if (existingBlog.author.toString() === req.user._id.toString()) {
        existingBlog.tags = tags;
        existingBlog.coverPhoto = coverPhoto;
        existingBlog.content = content;
        existingBlog.draft = draft !== undefined ? draft : existingBlog.draft;

        await existingBlog.save();

        return res.status(200).json({
          status: "success",
          message: "Blog updated successfully",
          data: {
            blog: existingBlog,
          },
        });
      }
    }

    // If no blog exists or the author is different, create a new blog
    const newBlog = await Blog.create({
      heading,
      tags,
      coverPhoto,
      content,
      draft: draft !== undefined ? draft : true,
      author: req.user._id,
    });

    // Add the blog to the user's list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { blogs: newBlog._id },
    });

    res.status(201).json({
      status: "success",
      message: "Blog created successfully",
      data: {
        blog: newBlog,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ draft: false }).populate("author");
    res.status(200).json({
      status: "success",
      results: blogs.length,
      data: {
        blogs,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const blog = req.blog;
    if (!blog) {
      return res.status(404).json({ message: "No blog found with that slug" });
    }

    blog.views += 1;
    await blog.save();

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { history: blog._id },
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        blog,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
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
      return res.status(404).json({
        message: "No blog found with that slug or you are not the author",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        blog,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({
      slug: req.params.slug,
      author: req.user._id,
    });

    if (!blog) {
      return res.status(404).json({
        message: "No blog found with that slug or you are not the author",
      });
    }

    await User.findByIdAndUpdate(req.user._id, { $pull: { blogs: blog._id } });

    res.status(204).json({
      status: "success",
      data: "Blog Deleted Successfully  ",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({ message: "No blog found with that slug" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the blog is already liked by the user
    const isLiked = user.likedBlogs.includes(blog._id);

    if (isLiked) {
      // Unlike the blog by pulling it from the likedBlogs array
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { likedBlogs: blog._id },
      });
      blog.likes -= 1;
    } else {
      // Like the blog by adding it to the likedBlogs array
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { likedBlogs: blog._id },
      });
      blog.likes += 1;
    }

    await blog.save();

    res.status(200).json({
      status: "success",
      data: {
        blog,
        liked: !isLiked, // Returns true if the blog is liked, false if unliked
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};


exports.saveBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({ message: "No blog found with that slug" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the blog is already saved by the user
    const isSaved = user.savedBlogs.includes(blog._id);

    if (isSaved) {
      // Unsave the blog by pulling it from the savedBlogs array
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { savedBlogs: blog._id },
      });

      res.status(200).json({
        status: "success",
        message: "Blog unsaved successfully",
        saved: false, // Indicates blog is unsaved
      });
    } else {
      // Save the blog by adding it to the savedBlogs array
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { savedBlogs: blog._id }, // Prevents duplicate entries
      });

      res.status(200).json({
        status: "success",
        message: "Blog saved successfully",
        saved: true, // Indicates blog is saved
      });
    }
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};


exports.getAuthorBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.authorName }).sort(
      "-createdAt"
    );

    res.status(200).json({
      status: "success",
      results: blogs.length,
      data: {
        blogs,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getCurrentUserBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.userName }).sort(
      "-createdAt"
    );

    res.status(200).json({
      status: "success",
      results: blogs.length,
      data: {
        blogs,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
