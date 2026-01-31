import { Request, Response, NextFunction } from 'express';
import { uploadToGridFS, downloadFromGridFS, deleteFromGridFS, getFileInfo, fileExists } from '../utils/gridfsHelper';
import { optimizeImage, imageToBase64, getImageMetadata } from '../utils/imageOptimizer';
import { generateUniqueFilename, shouldUseGridFS } from '../utils/multerConfig';
import mongoose from 'mongoose';

// @desc    Upload profile picture
// @route   POST /api/v1/upload/profile-picture
// @access  Authenticated
export const uploadProfilePicture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_PROVIDED',
          message: 'No profile picture file provided'
        }
      });
      return;
    }

    const file = req.file;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Profile picture must be less than 5MB'
        }
      });
      return;
    }

    // Get image metadata to check dimensions
    const metadata = await getImageMetadata(file.buffer);
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Check minimum dimensions (at least 400x400px recommended)
    if (width < 400 || height < 400) {
      res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_TOO_SMALL',
          message: 'Profile picture should be at least 400x400 pixels. For best results, use a square image.'
        }
      });
      return;
    }

    // Warning for non-square images (not an error, just info)
    const isSquare = Math.abs(width - height) <= 10; // Allow 10px tolerance
    
    const filename = generateUniqueFilename(file.originalname, file.mimetype);

    // Optimize image - preserve original format for profile pictures
    const optimizedBuffer = await optimizeImage(file.buffer, {
      quality: 90, // Higher quality for profile pictures
      width: 800, // Resize to max 800px to save space while maintaining quality
      height: 800
    });

    // Store in GridFS
    const fileId = await uploadToGridFS(optimizedBuffer, filename, {
      contentType: file.mimetype,
      originalName: file.originalname,
      uploadedBy: req.user!._id,
      uploadedAt: new Date(),
      fileType: 'profile_picture',
      dimensions: {
        width: metadata.width,
        height: metadata.height,
        isSquare
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        fileId: fileId.toString(),
        filename,
        url: `/api/${process.env.API_VERSION || 'v1'}/upload/${fileId}`,
        size: optimizedBuffer.length,
        originalSize: file.size,
        dimensions: {
          width: metadata.width,
          height: metadata.height,
          isSquare
        },
        storageType: 'gridfs'
      },
      ...((!isSquare) && {
        warning: 'For best results, use a square image (same width and height)'
      })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload single image
// @route   POST /api/v1/upload/image
// @access  Authenticated
export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_PROVIDED',
          message: 'No image file provided'
        }
      });
      return;
    }

    const file = req.file;
    const filename = generateUniqueFilename(file.originalname, file.mimetype);

    // Detect format - preserve PNG for transparency, use original format
    const isPng = file.mimetype === 'image/png';
    
    // Optimize image (will auto-detect and preserve format if not specified)
    const optimizedBuffer = await optimizeImage(file.buffer, {
      quality: 85,
      // Don't specify format to preserve original (especially PNG transparency)
    });

    // Check file size and decide storage method
    if (shouldUseGridFS(optimizedBuffer.length)) {
      // Store in GridFS
      const fileId = await uploadToGridFS(optimizedBuffer, filename, {
        contentType: file.mimetype,
        originalName: file.originalname,
        uploadedBy: req.user!._id,
        uploadedAt: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          fileId: fileId.toString(),
          filename,
          url: `/api/${process.env.API_VERSION || 'v1'}/files/${fileId}`,
          size: optimizedBuffer.length,
          storageType: 'gridfs'
        }
      });
    } else {
      // Store as base64 (will auto-detect format and preserve transparency)
      const base64 = await imageToBase64(optimizedBuffer);

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          base64,
          filename,
          size: optimizedBuffer.length,
          storageType: 'base64'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple images
// @route   POST /api/v1/upload/images
// @access  Authenticated
export const uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES_PROVIDED',
          message: 'No image files provided'
        }
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const uploadedFiles = [];

    for (const file of files) {
      const filename = generateUniqueFilename(file.originalname, file.mimetype);

      // Optimize image (auto-detect and preserve format for transparency)
      const optimizedBuffer = await optimizeImage(file.buffer, {
        quality: 85,
        // Don't specify format to preserve original (especially PNG transparency)
      });

      if (shouldUseGridFS(optimizedBuffer.length)) {
        // Store in GridFS
        const fileId = await uploadToGridFS(optimizedBuffer, filename, {
          contentType: file.mimetype,
          originalName: file.originalname,
          uploadedBy: req.user!._id,
          uploadedAt: new Date()
        });

        uploadedFiles.push({
          fileId: fileId.toString(),
          filename,
          url: `/api/${process.env.API_VERSION || 'v1'}/files/${fileId}`,
          size: optimizedBuffer.length,
          storageType: 'gridfs'
        });
      } else {
        // Store as base64
        const base64 = await imageToBase64(optimizedBuffer);

        uploadedFiles.push({
          base64,
          filename,
          size: optimizedBuffer.length,
          storageType: 'base64'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} images uploaded successfully`,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload document
// @route   POST /api/v1/upload/document
// @access  Authenticated
export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_PROVIDED',
          message: 'No document file provided'
        }
      });
      return;
    }

    const file = req.file;
    const filename = generateUniqueFilename(file.originalname, file.mimetype);

    // Store document in GridFS (documents are typically larger)
    const fileId = await uploadToGridFS(file.buffer, filename, {
      contentType: file.mimetype,
      originalName: file.originalname,
      uploadedBy: req.user!._id,
      uploadedAt: new Date(),
      documentType: req.body.documentType || 'general'
    });

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        fileId: fileId.toString(),
        filename,
        url: `/api/${process.env.API_VERSION || 'v1'}/files/${fileId}`,
        size: file.size,
        storageType: 'gridfs'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get/Download file from GridFS
// @route   GET /api/v1/files/:fileId
// @access  Public (but can be restricted based on requirements)
export const getFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
      return;
    }

    // Check if file exists
    const exists = await fileExists(fileId);
    if (!exists) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      });
      return;
    }

    // Get file info for content type
    const fileInfo = await getFileInfo(fileId);

    // Set CORS headers for cross-origin image access
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set content headers
    res.set('Content-Type', fileInfo.metadata?.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${fileInfo.filename}"`);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream file from GridFS
    const downloadStream = downloadFromGridFS(fileId);
    downloadStream.pipe(res);

    downloadStream.on('error', (_error) => {
      res.status(500).json({
        success: false,
        error: {
          code: 'FILE_DOWNLOAD_ERROR',
          message: 'Failed to download file'
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file from GridFS
// @route   DELETE /api/v1/upload/:fileId
// @access  Authenticated
export const deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
      return;
    }

    // Check if file exists
    const exists = await fileExists(fileId);
    if (!exists) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      });
      return;
    }

    // Get file info to check ownership (optional)
    const fileInfo = await getFileInfo(fileId);
    
    // Check if user is authorized to delete (optional - implement based on requirements)
    // For now, allow authenticated users to delete any file they upload
    const uploadedBy = fileInfo.metadata?.uploadedBy;
    if (uploadedBy && uploadedBy.toString() !== req.user!._id.toString() && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to delete this file'
        }
      });
      return;
    }

    // Delete file
    await deleteFromGridFS(fileId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get file information
// @route   GET /api/v1/upload/:fileId/info
// @access  Authenticated
export const getFileMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
      return;
    }

    // Get file info
    const fileInfo = await getFileInfo(fileId);
    
    if (!fileInfo) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        fileId: fileInfo._id.toString(),
        filename: fileInfo.filename,
        contentType: fileInfo.metadata?.contentType,
        size: fileInfo.length,
        uploadDate: fileInfo.uploadDate,
        metadata: fileInfo.metadata
      }
    });
  } catch (error) {
    next(error);
  }
};
