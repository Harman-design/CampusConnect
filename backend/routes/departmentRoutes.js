const express = require('express');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const departmentController = require('../controllers/departmentController');

const router = express.Router();

router.use(protect);

router.get('/', departmentController.getDepartments);
router.post('/', restrictTo('admin'), departmentController.createDepartment);
router.put('/:id', restrictTo('admin'), departmentController.updateDepartment);
router.delete('/:id', restrictTo('admin'), departmentController.deleteDepartment);

module.exports = router;
