import mongoose from 'mongoose';
import { GridFSBucket, GridFSBucketReadStream } from 'mongodb';
import { Readable } from 'stream';

let bucket: GridFSBucket;

// Initialize GridFS bucket
export const initGridFS = (): void => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }
  bucket = new GridFSBucket(db, {
    bucketName: 'uploads'
  });
  console.log('✓ GridFS initialized');
};

// Get GridFS bucket
export const getGridFSBucket = (): GridFSBucket => {
  if (!bucket) {
    initGridFS();
  }
  return bucket;
};

// Upload file to GridFS
export const uploadToGridFS = (
  buffer: Buffer,
  filename: string,
  metadata?: any
): Promise<mongoose.Types.ObjectId> => {
  return new Promise((resolve, reject) => {
    const readableStream = Readable.from(buffer);
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: metadata || {}
    });

    readableStream.pipe(uploadStream)
      .on('error', (error) => {
        reject(error);
      })
      .on('finish', () => {
        resolve(uploadStream.id as mongoose.Types.ObjectId);
      });
  });
};

// Download file from GridFS
export const downloadFromGridFS = (fileId: string): GridFSBucketReadStream => {
  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    return bucket.openDownloadStream(objectId);
  } catch (error) {
    throw new Error('Invalid file ID');
  }
};

// Delete file from GridFS
export const deleteFromGridFS = async (fileId: string): Promise<void> => {
  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    await bucket.delete(objectId);
  } catch (error) {
    throw new Error('Failed to delete file');
  }
};

// Get file info from GridFS
export const getFileInfo = async (fileId: string): Promise<any> => {
  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    const files = await bucket.find({ _id: objectId }).toArray();
    return files.length > 0 ? files[0] : null;
  } catch (error) {
    throw new Error('Failed to get file info');
  }
};

// Check if file exists
export const fileExists = async (fileId: string): Promise<boolean> => {
  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    const files = await bucket.find({ _id: objectId }).toArray();
    return files.length > 0;
  } catch (error) {
    return false;
  }
};

// Get all files with optional filter
export const listFiles = async (filter: any = {}): Promise<any[]> => {
  try {
    return await bucket.find(filter).toArray();
  } catch (error) {
    throw new Error('Failed to list files');
  }
};
