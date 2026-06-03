const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Primetrade.ai REST API',
      version: '1.0.0',
      description: `
## Scalable REST API with JWT Authentication & Role-Based Access Control

Built for **Primetrade.ai** Backend Developer Intern Assignment.

### Features
- 🔐 JWT Authentication with refresh tokens
- 👥 Role-Based Access Control (User & Admin)
- ✅ Task Management CRUD API
- 🛡️ Input validation & sanitization
- 📊 Rate limiting & security headers

### Authentication
Use the \`/api/v1/auth/login\` endpoint to get a JWT token, then click **Authorize** and enter: \`Bearer <your_token>\`
      `,
      contact: {
        name: 'Primetrade.ai',
        url: 'https://primetrade.ai'
      }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development Server' },
      { url: 'https://your-production-url.com', description: 'Production Server' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2' },
            title: { type: 'string', example: 'Complete API documentation' },
            description: { type: 'string', example: 'Write comprehensive Swagger docs' },
            status: { type: 'string', enum: ['pending', 'in-progress', 'completed'], example: 'pending' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
            dueDate: { type: 'string', format: 'date-time' },
            user: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message here' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Tasks', description: 'Task CRUD operations' },
      { name: 'Admin', description: 'Admin-only endpoints' }
    ]
  },
  apis: ['./src/routes/v1/*.js']
};

module.exports = swaggerJsdoc(options);
