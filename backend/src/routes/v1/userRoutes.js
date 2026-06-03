const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, deleteAccount } = require('../../controllers/userController');
const { protect } = require('../../middlewares/authMiddleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate');

router.use(protect);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile (name only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces')
], validate, updateProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   delete:
 *     summary: Deactivate own account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.delete('/profile', deleteAccount);

module.exports = router;
