import sharp from 'sharp';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// Optimize image
export const optimizeImage = async (
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> => {
  const {
    width,
    height,
    quality = 80,
    format
  } = options;

  try {
    let image = sharp(buffer);
    
    // Get original format if not specified
    const metadata = await image.metadata();
    const outputFormat = format || (metadata.format as 'jpeg' | 'png' | 'webp') || 'png';

    // Resize if dimensions provided
    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert format and compress
    switch (outputFormat) {
      case 'jpeg':
        // Flatten with white background for transparent images
        image = image.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality });
        break;
      case 'png':
        // Preserve transparency
        image = image.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
        image = image.webp({ quality });
        break;
    }

    return await image.toBuffer();
  } catch (error) {
    throw new Error('Failed to optimize image');
  }
};

// Create thumbnail
export const createThumbnail = async (
  buffer: Buffer,
  size: number = 200
): Promise<Buffer> => {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    throw new Error('Failed to create thumbnail');
  }
};

// Get image metadata
export const getImageMetadata = async (buffer: Buffer): Promise<sharp.Metadata> => {
  try {
    return await sharp(buffer).metadata();
  } catch (error) {
    throw new Error('Failed to get image metadata');
  }
};

// Convert image to base64
export const imageToBase64 = async (
  buffer: Buffer,
  format?: 'jpeg' | 'png' | 'webp'
): Promise<string> => {
  try {
    // Get original format if not specified
    const metadata = await sharp(buffer).metadata();
    const outputFormat = format || (metadata.format as 'jpeg' | 'png' | 'webp') || 'png';
    
    let image = sharp(buffer);
    
    // Preserve transparency for PNG
    if (outputFormat === 'png') {
      image = image.png({ quality: 90, compressionLevel: 9 });
    } else if (outputFormat === 'jpeg') {
      // For JPEG, flatten with white background to avoid black background on transparent images
      image = image.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 85 });
    } else if (outputFormat === 'webp') {
      image = image.webp({ quality: 85 });
    }
    
    const optimized = await image.toBuffer();
    return `data:image/${outputFormat};base64,${optimized.toString('base64')}`;
  } catch (error) {
    throw new Error('Failed to convert image to base64');
  }
};

// Validate image
export const validateImage = async (buffer: Buffer): Promise<boolean> => {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch (error) {
    return false;
  }
};

// Resize image to multiple sizes
export const resizeToMultipleSizes = async (
  buffer: Buffer,
  sizes: number[]
): Promise<{ size: number; buffer: Buffer }[]> => {
  try {
    const results = await Promise.all(
      sizes.map(async (size) => ({
        size,
        buffer: await sharp(buffer)
          .resize(size, size, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()
      }))
    );
    return results;
  } catch (error) {
    throw new Error('Failed to resize images');
  }
};
