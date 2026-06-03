const User = require('../models/User');
const Task = require('../models/Task');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/v1/admin/users
 * @access  Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    return paginatedResponse(res, users, total, page, limit, 'Users fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID (Admin only)
 * @route   GET /api/v1/admin/users/:id
 * @access  Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, 'User fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role (Admin only)
 * @route   PATCH /api/v1/admin/users/:id/role
 * @access  Admin
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return errorResponse(res, 400, 'Role must be user or admin.');
    }
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, 400, 'You cannot change your own role.');
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return errorResponse(res, 404, 'User not found.');

    return successResponse(res, 200, `User role updated to ${role}`, user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user active status (Admin only)
 * @route   PATCH /api/v1/admin/users/:id/status
 * @access  Admin
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, 400, 'You cannot deactivate your own account.');
    }
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, 'User not found.');

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform stats (Admin only)
 * @route   GET /api/v1/admin/stats
 * @access  Admin
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, adminCount, totalTasks, tasksByStatus] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const taskStats = { pending: 0, 'in-progress': 0, completed: 0 };
    tasksByStatus.forEach(s => { taskStats[s._id] = s.count; });

    return successResponse(res, 200, 'Platform stats fetched successfully', {
      users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers, admins: adminCount },
      tasks: { total: totalTasks, ...taskStats }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUserRole, toggleUserStatus, getPlatformStats };
