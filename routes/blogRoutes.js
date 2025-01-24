const express = require('express');
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/auth');
const blogMiddlware=require('../middleware/blogMiddleware')
const router = express.Router();

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:slug',blogMiddlware.trackHistory, blogController.getBlog);

// Protected routes
router.use(authMiddleware.protect);

router.post('/', blogController.createBlog);
router.patch('/:slug', authMiddleware.restrictToAuthor, blogController.updateBlog);
router.delete('/:slug', authMiddleware.restrictToAuthor, blogController.deleteBlog);
router.post('/:slug/like', blogController.likeBlog);
// router.post('/:slug/save', blogController.saveBlog);
// router.get('/user/saved', blogController.getSavedBlogs);
router.get('/author/:authorName', blogController.getAuthorBlogs);
// router.get('/user/my-blogs', blogController.getCurrentUserBlogs);

module.exports = router;

