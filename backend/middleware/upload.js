const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(new AppError('Only PDF and PPT/PPTX files are allowed.', 400), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

function mimeToFileType(mimetype) {
  return ALLOWED_MIME_TYPES[mimetype] || null;
}

module.exports = { upload, mimeToFileType };
