const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        res.status(200).json({
            message: "File uploaded successfully",

            file: {
                url: req.file.path,
                name: req.file.originalname,
                type: req.file.mimetype,
                size: req.file.size
            }
        });

    } catch (error) {
        console.error(
            "File upload error:",
            error
        );

        res.status(500).json({
            message: "File upload failed",
            error: error.message
        });
    }
};


module.exports = {
    uploadFile
};