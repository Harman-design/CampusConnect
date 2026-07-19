const express = require('express');
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');
const {
  createNoteMetaValidation,
  createDriveLinkValidation,
  updateNoteValidation,
  idParamValidation,
} = require('../validations/noteValidation');

const router = express.Router();

router.use(protect); // every notes route requires authentication

router.get('/', noteController.getNotes);
router.get('/:id', idParamValidation, noteController.getNoteById);
router.post('/:id/download', idParamValidation, noteController.registerDownload);
router.post('/:id/bookmark', idParamValidation, noteController.toggleBookmark);

// Admin-only write operations
router.post('/', restrictTo('admin'), upload.single('file'), createNoteMetaValidation, noteController.createNoteFile);
router.post('/drive-link', restrictTo('admin'), createDriveLinkValidation, noteController.createNoteDriveLink);
router.patch('/:id', restrictTo('admin'), updateNoteValidation, noteController.updateNote);
router.delete('/:id', restrictTo('admin'), idParamValidation, noteController.deleteNote);

module.exports = router;
