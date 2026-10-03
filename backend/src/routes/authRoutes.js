const express = require('express');
const router = express.Router();
const {
  login, logout, refreshToken, getMe, changePassword, updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginValidators, changePasswordValidators } = require('../validators/authValidators');

// Public
router.post('/login', loginValidators, validate, login);
router.post('/refresh', refreshToken);

// Protected
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/change-password', changePasswordValidators, validate, changePassword);
router.put('/update-profile', updateProfile);

module.exports = router;
