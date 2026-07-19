const express = require('express');
const pyqController = require('../controllers/pyqController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');
const { createPyqValidation, updatePyqValidation, idParamValidation } = require('../validations/pyqValidation');

const router = express.Router();

router.use(protect);

router.get('/', pyqController.getPyqs);
router.get('/:id', idParamValidation, pyqController.getPyqById);
router.post('/:id/download', idParamValidation, pyqController.registerDownload);

// Admin-only write operations
router.post('/', restrictTo('admin'), upload.single('file'), createPyqValidation, pyqController.createPyq);
router.patch('/:id', restrictTo('admin'), updatePyqValidation, pyqController.updatePyq);
router.delete('/:id', restrictTo('admin'), idParamValidation, pyqController.deletePyq);

module.exports = router;
