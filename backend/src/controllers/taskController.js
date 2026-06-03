const Task = require('../models/Task');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all tasks for current user
 * @route   GET /api/v1/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10,
      status, priority,
      sortBy = 'createdAt', order = 'desc',
      search
    } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(filter)
    ]);

    return paginatedResponse(res, tasks, total, page, limit, 'Tasks fetched successfully');

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return errorResponse(res, 404, 'Task not found.');
    }
    return successResponse(res, 200, 'Task fetched successfully', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/v1/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;
    const task = await Task.create({
      title, description, status, priority, dueDate, tags,
      user: req.user._id
    });
    return successResponse(res, 201, 'Task created successfully', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/v1/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return errorResponse(res, 404, 'Task not found.');
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    return successResponse(res, 200, 'Task updated successfully', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return errorResponse(res, 404, 'Task not found.');
    }
    return successResponse(res, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task stats for current user
 * @route   GET /api/v1/tasks/stats
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const formattedStats = {
      byStatus: { pending: 0, 'in-progress': 0, completed: 0 },
      byPriority: { low: 0, medium: 0, high: 0 },
      total: 0
    };

    stats.forEach(s => { formattedStats.byStatus[s._id] = s.count; });
    priorityStats.forEach(s => { formattedStats.byPriority[s._id] = s.count; });
    formattedStats.total = Object.values(formattedStats.byStatus).reduce((a, b) => a + b, 0);

    return successResponse(res, 200, 'Task stats fetched successfully', formattedStats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats };
