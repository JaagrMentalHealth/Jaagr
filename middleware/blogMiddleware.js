const User = require("../models/User");
const Blog = require("../models/Blog");
const jwt=require('jsonwebtoken')

exports.trackHistory = async (req, res, next) => {
    try {
      const { slug } = req.params;
      const authHeader = req.headers.authorization;
      const blog=await Blog.findOne({slug}).populate('author');  
      req.blog=blog;
      
      // Check if authorization token exists
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        console.log(token)
  
        try {
          // Verify the token using the userName
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log(decoded)
          // Find the user by userName and update history
          await User.findOneAndUpdate(
            { userName: decoded.id }, 
            { $addToSet: { history: blog._id } },  // Avoids duplicate entries
            { new: true }
          );
        } catch (error) {
          console.error("Invalid token:", error);
        }
      }
  
      // Proceed to next middleware or route handler to render blog
      next();
    } catch (error) {
      console.error("Error tracking history:", error);
      res.status(500).json({ message: "Server Error" });
    }
  };
