// authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Blog = require("../models/Blog");

exports.protect = async (req, res, next) => {
  // console.log("Middleware");
  try {
    let token;
    // console.log(req.headers);
    // console.log(req.headers.authorization);
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (req.query.a) {
      console.log("Inside Else if");
      token = req.query.a;
    }
    console.log(token);

    if (!token) {
      return res.status(401).json({
        message: "You are not logged in! Please log in to get access.",
      });
    }
    // console.log("Hi");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    const currentUser =
      (await User.findOne({ userName: decoded.id })) ||
      (await User.findOne({ email: decoded.email }));

    if (!currentUser) {
      return res.status(401).json({
        message: "The user belonging to this token no longer exists.",
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid token. Please log in again!", error });
  }
};

exports.restrictToAuthor = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: "No blog found with that slug" });
    }
    const user = await User.findById(blog.author);

    if (user.userName !== req.user.userName) {
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};


exports.optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ userName: decoded.id }) || await User.findOne({ email: decoded.email });
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.warn("JWT verification failed but proceeding anonymously.");
    }
  }
  next();
};


