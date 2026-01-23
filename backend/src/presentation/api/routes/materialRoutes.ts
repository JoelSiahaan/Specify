/**
 * Material Routes
 * 
 * Defines routes for material management endpoints.
 * Includes Multer middleware for file uploads.
 * 
 * Requirements:
 * - 7.1: Upload files to courses
 * - 7.2: Add text content to courses
 * - 7.3: Add video links to courses
 * - 7.6: Delete materials
 * - 7.7: Edit existing materials
 * - 8.1: Students view all materials
 * - 8.2: Students download files
 */

import { Router } from 'express';
import multer from 'multer';
import { MaterialController } from '../controllers/MaterialController';
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { validateBody } from '../middleware/ValidationMiddleware';
import {
  CreateFileMaterialRequestSchema,
  CreateTextMaterialRequestSchema,
  CreateVideoLinkMaterialRequestSchema,
  UpdateTextMaterialRequestSchema,
  UpdateVideoLinkMaterialRequestSchema,
  UpdateFileMaterialRequestSchema
} from '../validators/materialSchemas';

const router = Router();
const materialController = new MaterialController();

/**
 * Multer Configuration
 * 
 * Storage: Memory storage (files stored in buffer)
 * File size limit: 10MB (as per requirements)
 * 
 * Security:
 * - File type validation happens in use case
 * - File size limit enforced by Multer
 * 
 * Requirements: 7.5, 20.5
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB in bytes
  }
});

/**
 * All material routes require authentication
 */
router.use(authenticationMiddleware);

/**
 * GET /api/courses/:courseId/materials
 * 
 * List materials for a course
 * 
 * Protected endpoint (authentication required)
 * 
 * Requirements: 8.1
 */
router.get(
  '/courses/:courseId/materials',
  materialController.list.bind(materialController)
);

/**
 * GET /api/materials/:id
 * 
 * Get material by ID
 * 
 * Protected endpoint (authentication required)
 * 
 * Requirements: 8.1
 */
router.get(
  '/materials/:id',
  materialController.getById.bind(materialController)
);

/**
 * POST /api/courses/:courseId/materials/file
 * 
 * Create FILE material
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Requires Multer middleware for file upload
 * Validates form fields (title, type)
 * 
 * Requirements: 7.1, 7.4, 7.5
 */
router.post(
  '/courses/:courseId/materials/file',
  upload.single('file'),
  validateBody(CreateFileMaterialRequestSchema),
  materialController.createFile.bind(materialController)
);

/**
 * POST /api/courses/:courseId/materials/text
 * 
 * Create TEXT material
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Validates request body (title, type, content)
 * 
 * Requirements: 7.2
 */
router.post(
  '/courses/:courseId/materials/text',
  validateBody(CreateTextMaterialRequestSchema),
  materialController.createText.bind(materialController)
);

/**
 * POST /api/courses/:courseId/materials/video
 * 
 * Create VIDEO_LINK material
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Validates request body (title, type, videoUrl)
 * 
 * Requirements: 7.3, 7.4
 */
router.post(
  '/courses/:courseId/materials/video',
  validateBody(CreateVideoLinkMaterialRequestSchema),
  materialController.createVideoLink.bind(materialController)
);

/**
 * PUT /api/materials/:id/text
 * 
 * Update TEXT material
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Validates request body (title, content)
 * 
 * Requirements: 7.7
 */
router.put(
  '/materials/:id/text',
  validateBody(UpdateTextMaterialRequestSchema),
  materialController.update.bind(materialController)
);

/**
 * PUT /api/materials/:id/video
 * 
 * Update VIDEO_LINK material
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Validates request body (title, videoUrl)
 * 
 * Requirements: 7.7
 */
router.put(
  '/materials/:id/video',
  validateBody(UpdateVideoLinkMaterialRequestSchema),
  materialController.update.bind(materialController)
);

/**
 * PUT /api/materials/:id/file
 * 
 * Update FILE material
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Requires Multer middleware for file upload (optional)
 * Validates form fields (title)
 * 
 * Requirements: 7.7
 */
router.put(
  '/materials/:id/file',
  upload.single('file'),
  validateBody(UpdateFileMaterialRequestSchema),
  materialController.update.bind(materialController)
);

/**
 * DELETE /api/materials/:id
 * 
 * Delete material
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * 
 * Requirements: 7.6
 */
router.delete(
  '/materials/:id',
  materialController.delete.bind(materialController)
);

/**
 * GET /api/materials/:id/download
 * 
 * Download material file
 * 
 * Protected endpoint (authentication required)
 * 
 * Requirements: 8.2
 */
router.get(
  '/materials/:id/download',
  materialController.download.bind(materialController)
);

export default router;
