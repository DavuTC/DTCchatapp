const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Kullanıcı bilgilerini getir
router.get('/me', auth, authController.getMe);

// Kullanıcı profilini güncelle
router.put('/profile', auth, authController.updateProfile);

module.exports = router;