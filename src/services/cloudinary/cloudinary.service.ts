import cloudinary from "../../config/cloudinary.ts";

interface UploadImageInput {
    buffer: Buffer,
    folderName: string

}

export function uploadImageToCloudinary(file: UploadImageInput): Promise<{
    secure_url: string;
    public_id: string;

}> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `kp-hospital/${file.folderName}`,
                resource_type: "image",
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error || new Error("Image upload failed."));
                }

                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );

        uploadStream.end(file.buffer);
    });
}

export async function deleteImageFromCloudinary(publicId: string) {
    return cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
    });
}