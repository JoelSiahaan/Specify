/**
 * Material Controller
 * 
 * Handles HTTP requests for material management endpoints.
 * Delegates business logic to use cases and manages HTTP responses.
 * Uses Multer middleware for file uploads.
 * 
 * Requirements:
 * - 7.1: Upload files to courses
 * - 7.2: Add text content to courses
 * - 7.3: Add video links to courses
 * - 7.6: Delete materials
 * - 7.7: Edit existing materials
 * - 8.1: Students view all materials in enrolled courses
 * - 8.2: Students download files
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { CreateMaterialUseCase } from '../../../application/use-cases/material/CreateMaterialUseCase.js';
import { UpdateMaterialUseCase } from '../../../application/use-cases/material/UpdateMaterialUseCase.js';
import { DeleteMaterialUseCase } from '../../../application/use-cases/material/DeleteMaterialUseCase.js';
import { ListMaterialsUseCase } from '../../../application/use-cases/material/ListMaterialsUseCase.js';
import { DownloadMaterialUseCase } from '../../../application/use-cases/material/DownloadMaterialUseCase.js';
import { GetMaterialByIdUseCase } from '../../../application/use-cases/material/GetMaterialByIdUseCase.js';
import { UploadMaterialFileUseCase } from '../../../application/use-cases/material/UploadMaterialFileUseCase.js';
import type { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware.js';
import type { CreateMaterialDTO } from '../../../application/dtos/MaterialDTO.js';
import { MaterialType } from '../../../domain/entities/Material.js';

/**
 * Material Controller
 * 
 * Thin controller that delegates to use cases and manages HTTP concerns.
 */
export class MaterialController {
  /**
   * List materials for a course
   * 
   * GET /api/courses/:courseId/materials
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - courseId: Course ID (UUID)
   * 
   * Response (200 OK):
   * - data: Array of MaterialDTO
   * 
   * Business Rules:
   * - Students: Can view materials in enrolled courses
   * - Teachers: Can view materials in their own courses
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 8.1
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const courseId = req.params.courseId as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }
      
      // Execute use case
      const listMaterialsUseCase = container.resolve(ListMaterialsUseCase);
      const materials = await listMaterialsUseCase.execute(
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return materials wrapped in data object (200 OK)
      res.status(200).json({ data: materials });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get material by ID
   * 
   * GET /api/materials/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - id: Material ID (UUID)
   * 
   * Response (200 OK):
   * - MaterialDTO
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not owner
   * - 404: Material not found
   * - 500: Internal server error
   * 
   * Requirements: 8.1
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const materialId = req.params.id as string;
      
      if (!materialId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Material ID is required'
        });
        return;
      }
      
      // Execute use case
      const getMaterialByIdUseCase = container.resolve(GetMaterialByIdUseCase);
      const material = await getMaterialByIdUseCase.execute(
        materialId,
        authenticatedReq.user.userId
      );
      
      // Return material (200 OK)
      res.status(200).json(material);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Create new material (FILE type)
   * 
   * POST /api/courses/:courseId/materials
   * Content-Type: multipart/form-data
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * Requires Multer middleware for file upload
   * 
   * Path parameters:
   * - courseId: Course ID (UUID)
   * 
   * Request body (multipart/form-data):
   * - title: string (1-200 characters)
   * - type: 'FILE'
   * - file: File (max 10MB, PDF/DOCX/images only)
   * 
   * Response (201 Created):
   * - MaterialDTO with file metadata
   * 
   * Errors:
   * - 400: Validation failed or invalid file type/size
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 7.1, 7.4, 7.5
   */
  async createFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const courseId = req.params.courseId as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'File is required for FILE type material'
        });
        return;
      }

      // Upload file to storage using use case
      const uploadFileUseCase = container.resolve(UploadMaterialFileUseCase);
      const fileMetadata = await uploadFileUseCase.execute({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        directory: `courses/${courseId}/materials`
      });

      // Build DTO from request with uploaded file metadata
      const dto: CreateMaterialDTO = {
        title: req.body.title,
        type: MaterialType.FILE,
        filePath: fileMetadata.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
      
      // Execute use case
      const createMaterialUseCase = container.resolve(CreateMaterialUseCase);
      const material = await createMaterialUseCase.execute(
        dto,
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return created material (201 Created)
      res.status(201).json(material);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Create new material (TEXT type)
   * 
   * POST /api/courses/:courseId/materials
   * Content-Type: application/json
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - courseId: Course ID (UUID)
   * 
   * Request body (validated by CreateTextMaterialRequestSchema):
   * - title: string (1-200 characters)
   * - type: 'TEXT'
   * - content: string (1-50000 characters, HTML allowed)
   * 
   * Response (201 Created):
   * - MaterialDTO with text content
   * 
   * Errors:
   * - 400: Validation failed
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 7.2
   */
  async createText(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const courseId = req.params.courseId as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }

      // Build DTO from request
      const dto: CreateMaterialDTO = {
        title: req.body.title,
        type: MaterialType.TEXT,
        content: req.body.content
      };
      
      // Execute use case
      const createMaterialUseCase = container.resolve(CreateMaterialUseCase);
      const material = await createMaterialUseCase.execute(
        dto,
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return created material (201 Created)
      res.status(201).json(material);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Create new material (VIDEO_LINK type)
   * 
   * POST /api/courses/:courseId/materials
   * Content-Type: application/json
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - courseId: Course ID (UUID)
   * 
   * Request body (validated by CreateVideoLinkMaterialRequestSchema):
   * - title: string (1-200 characters)
   * - type: 'VIDEO_LINK'
   * - videoUrl: string (valid URL, YouTube or Vimeo)
   * 
   * Response (201 Created):
   * - MaterialDTO with video URL
   * 
   * Errors:
   * - 400: Validation failed or invalid URL
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 7.3, 7.4
   */
  async createVideoLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const courseId = req.params.courseId as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }

      // Build DTO from request
      const dto: CreateMaterialDTO = {
        title: req.body.title,
        type: MaterialType.VIDEO_LINK,
        content: req.body.content
      };
      
      // Execute use case
      const createMaterialUseCase = container.resolve(CreateMaterialUseCase);
      const material = await createMaterialUseCase.execute(
        dto,
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return created material (201 Created)
      res.status(201).json(material);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Update material
   * 
   * PUT /api/materials/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Material ID (UUID)
   * 
   * Request body (validated by UpdateMaterialRequestSchema):
   * - title: string (optional, 1-200 characters)
   * - content: string (optional, for TEXT type, 1-50000 characters)
   * - videoUrl: string (optional, for VIDEO_LINK type)
   * - file: File (optional, for FILE type, via Multer)
   * 
   * Response (200 OK):
   * - MaterialDTO with updated data
   * 
   * Errors:
   * - 400: Validation failed
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Material not found
   * - 500: Internal server error
   * 
   * Requirements: 7.7
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const materialId = req.params.id as string;
      
      if (!materialId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Material ID is required'
        });
        return;
      }

      // Build DTO from request
      const dto: any = {
        title: req.body.title,
        content: req.body.content,
        videoUrl: req.body.videoUrl
      };

      // If file was uploaded (for FILE type update)
      if (req.file) {
        dto.file = req.file.buffer;
        dto.originalName = req.file.originalname;
        dto.mimeType = req.file.mimetype;
      }
      
      // Execute use case
      const updateMaterialUseCase = container.resolve(UpdateMaterialUseCase);
      const material = await updateMaterialUseCase.execute(
        materialId,
        dto,
        authenticatedReq.user.userId
      );
      
      // Return updated material (200 OK)
      res.status(200).json(material);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Delete material
   * 
   * DELETE /api/materials/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Material ID (UUID)
   * 
   * Response (200 OK):
   * - message: Success message
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Material not found
   * - 500: Internal server error
   * 
   * Requirements: 7.6
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const materialId = req.params.id as string;
      
      if (!materialId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Material ID is required'
        });
        return;
      }
      
      // Execute use case
      const deleteMaterialUseCase = container.resolve(DeleteMaterialUseCase);
      await deleteMaterialUseCase.execute(
        materialId,
        authenticatedReq.user.userId
      );
      
      // Return success message (200 OK)
      res.status(200).json({
        message: 'Material deleted successfully'
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Download material file
   * 
   * GET /api/materials/:id/download
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - id: Material ID (UUID)
   * 
   * Response (200 OK):
   * - File download with appropriate Content-Type and Content-Disposition headers
   * 
   * Errors:
   * - 400: Material is not a file type
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not owner
   * - 404: Material or file not found
   * - 500: Internal server error
   * 
   * Requirements: 8.2
   */
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const materialId = req.params.id as string;
      
      if (!materialId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Material ID is required'
        });
        return;
      }
      
      // Execute use case
      const downloadMaterialUseCase = container.resolve(DownloadMaterialUseCase);
      const { buffer, fileName, mimeType } = await downloadMaterialUseCase.execute(
        materialId,
        authenticatedReq.user.userId
      );
      
      // Set headers for file download
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Send file buffer (200 OK)
      res.status(200).send(buffer);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }
}
