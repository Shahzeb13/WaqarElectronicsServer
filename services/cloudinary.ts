import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary and delete the local file upon success
 * @param localFilePath - Path to the local file
 * @param folder - Cloudinary folder name
 * @returns Cloudinary upload response
 */
export const uploadLocalFileToCloudinary = async (localFilePath: string, folder: string = 'waqar-electronics') => {
  try {
    if (!localFilePath) return null;

    // Upload the file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folder
    });

    // File has been uploaded successfully
    console.log("File uploaded to Cloudinary:", response.url);

    // Unlink (delete) the local file only AFTER successful upload
    fs.unlinkSync(localFilePath);
    
    return response;
  } catch (error) {
    // If upload fails, check if file exists and delete it to prevent storage buildup
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

/**
 * Upload a file buffer to Cloudinary (Legacy support or for small blobs)
 * @param fileBuffer - The buffer of the file to upload
 * @param folder - Cloudinary folder name
 * @returns Cloudinary upload response
 */
export const uploadToCloudinary = async (fileBuffer: Buffer, folder: string = 'waqar-electronics') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 */
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

export default cloudinary;
