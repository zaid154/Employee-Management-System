import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { env } from '../config/env.js';

// Configure Cloudinary instance
if (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  console.log('[Cloudinary Service] Initialized for cloud:', env.cloudinary.cloudName);
} else {
  console.warn('[Cloudinary Service] Missing credentials. File uploads will run in local fallback mode.');
}

// Multer memory storage configuration (keeps file in RAM buffer for direct streaming to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowedMime = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type (${file.mimetype}). Only JPG, PNG, WEBP, PDF, DOCX allowed.`), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

/**
 * Upload an image buffer (e.g. employee avatar) to Cloudinary
 */
export async function uploadAvatarToCloudinary(buffer, fileName = 'avatar') {
  return new Promise((resolve, reject) => {
    if (!env.cloudinary.cloudName) {
      // Local fallback placeholder if Cloudinary not configured
      return resolve({
        url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300`,
        publicId: 'local_placeholder',
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'peoplepay/avatars',
        transformation: [
          { width: 300, height: 300, crop: 'thumb', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
        public_id: `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Avatar upload error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload a document (Aadhaar, PAN, Resume, Certificate) to Cloudinary
 */
export async function uploadDocumentToCloudinary(buffer, originalName = 'document') {
  return new Promise((resolve, reject) => {
    if (!env.cloudinary.cloudName) {
      return resolve({
        url: `https://via.placeholder.com/600x800?text=${encodeURIComponent(originalName)}`,
        publicId: 'local_placeholder_doc',
        bytes: buffer.length,
        format: 'pdf',
      });
    }

    const cleanBaseName = originalName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'peoplepay/documents',
        resource_type: 'auto',
        public_id: `doc_${Date.now()}_${cleanBaseName}`,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Document upload error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete a media asset from Cloudinary
 */
export async function deleteMediaFromCloudinary(publicId) {
  if (!publicId || publicId.startsWith('local_')) return true;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (err) {
    console.warn(`[Cloudinary] Failed to delete asset ${publicId}:`, err.message);
    return false;
  }
}
