import express, { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import authenticate from '../middleware/authenticate';
import { 
  uploadSingleImage, 
  uploadMultipleImages, 
  uploadSingleDocument,
  uploadProfilePicture
} from '../utils/multerConfig';

const router: Router = express.Router();

// Upload routes (protected)
router.post(
  '/profile-picture',
  authenticate,
  uploadProfilePicture,
  uploadController.uploadProfilePicture
);

router.post(
  '/image',
  authenticate,
  uploadSingleImage,
  uploadController.uploadImage
);

router.post(
  '/images',
  authenticate,
  uploadMultipleImages,
  uploadController.uploadImages
);

router.post(
  '/document',
  authenticate,
  uploadSingleDocument,
  uploadController.uploadDocument
);

// Get file (public - for serving images/documents)
router.get(
  '/:fileId',
  uploadController.getFile
);

// Get file info
router.get(
  '/:fileId/info',
  authenticate,
  uploadController.getFileMetadata
);

// Delete file
router.delete(
  '/:fileId',
  authenticate,
  uploadController.deleteFile
);

export default router;
