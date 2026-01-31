import multer from 'multer';
import path from 'path';

// File size limits
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10 MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/jpg,image/png,image/gif,image/webp').split(',');
const ALLOWED_DOCUMENT_TYPES = (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,image/jpeg,image/png').split(',');

// Memory storage (we'll handle GridFS in controller)
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

// File filter for documents
const documentFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid document type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`));
  }
};

// File filter for all types
const allFilesFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Upload middleware for single image
export const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: imageFilter
}).single('image');

// Upload middleware for profile picture (JPG, PNG, GIF only - max 5MB)
const profilePictureFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and GIF images are allowed for profile pictures.'));
  }
};

export const uploadProfilePicture = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: profilePictureFilter
}).single('profilePicture');

// Upload middleware for multiple images
export const uploadMultipleImages = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: imageFilter
}).array('images', 10); // Max 10 images

// Upload middleware for single document
export const uploadSingleDocument = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: documentFilter
}).single('document');

// Upload middleware for multiple documents
export const uploadMultipleDocuments = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: documentFilter
}).array('documents', 5); // Max 5 documents

// Upload middleware for any file type
export const uploadAnyFile = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: allFilesFilter
}).single('file');

// Get file extension from mimetype
export const getFileExtension = (mimetype: string): string => {
  const extensions: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf'
  };
  return extensions[mimetype] || '';
};

// Generate unique filename
export const generateUniqueFilename = (originalname: string, mimetype: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = getFileExtension(mimetype) || path.extname(originalname);
  return `${timestamp}-${random}${ext}`;
};

// Check if file size exceeds threshold for direct storage
export const shouldUseGridFS = (fileSize: number): boolean => {
  const threshold = parseInt(process.env.SMALL_IMAGE_THRESHOLD || '1048576'); // 1 MB
  return fileSize > threshold;
};
