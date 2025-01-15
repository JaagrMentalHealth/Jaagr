const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/signup', userController.signup);
router.post('/login', userController.login);

// router.use(authMiddleware.protect);

router.get('/:id', userController.getUser);

router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;

