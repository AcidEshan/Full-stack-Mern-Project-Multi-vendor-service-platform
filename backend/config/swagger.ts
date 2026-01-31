import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Practicum API Documentation',
      version: '1.0.0',
      description: 'Multi-Vendor Service Management System - Backend API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@practicum.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/${process.env.API_VERSION || 'v1'}`,
        description: 'Development server'
      },
      {
        url: `https://api.practicum.com/api/${process.env.API_VERSION || 'v1'}`,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            phone: {
              type: 'string',
              description: 'User phone number',
              example: '1234567890'
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin', 'vendor', 'user'],
              description: 'User role',
              example: 'user'
            },
            profileImage: {
              type: 'string',
              nullable: true,
              description: 'Profile image URL',
              example: 'https://example.com/profile.jpg'
            },
            isActive: {
              type: 'boolean',
              description: 'Account active status',
              example: true
            },
            isBlocked: {
              type: 'boolean',
              description: 'Account blocked status',
              example: false
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status',
              example: true
            },
            isApproved: {
              type: 'boolean',
              description: 'Account approval status (vendor only)',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Validation failed'
                },
                details: {
                  type: 'object',
                  additionalProperties: true
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'User Management',
        description: 'User profile and account management endpoints'
      }
    ]
  },
  apis: ['./routes/*.ts', './controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
