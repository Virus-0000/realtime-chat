const cloudinary = require("../config/cloudinary");

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "realtime-chat",
                    resource_type: "auto"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            stream.end(req.file.buffer);
        });

        return res.status(200).json({
            message: "File uploaded successfully",
            file: {
                url: result.secure_url,
                name: req.file.originalname,
                type: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error("File upload error:", error);

        return res.status(500).json({
            message: "File upload failed",
            error: error.message
        });
    }
};

module.exports = { uploadFile };
