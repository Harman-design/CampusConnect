const express = require('express');
const placementController = require('../controllers/placementController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const {
  createPlacementValidation,
  updatePlacementValidation,
  updateApplicationStatusValidation,
  idParamValidation,
} = require('../validations/placementValidation');

const router = express.Router();

router.use(protect);

// --- Student-specific literal routes (must come before "/:id") ---
router.get('/my-applications', restrictTo('student'), placementController.getMyApplications);
router.delete('/applications/:id', restrictTo('student'), placementController.withdrawApplication);

// --- Admin application-management literal routes ---
router.patch(
  '/applications/:id/status',
  restrictTo('admin'),
  updateApplicationStatusValidation,
  placementController.updateApplicationStatus
);

// --- Collection routes ---
router.get('/', placementController.getPlacements);
router.post('/', restrictTo('admin'), createPlacementValidation, placementController.createPlacement);

// --- Single-resource routes ---
router.get('/:id', idParamValidation, placementController.getPlacementById);
router.patch('/:id', restrictTo('admin'), updatePlacementValidation, placementController.updatePlacement);
router.delete('/:id', restrictTo('admin'), idParamValidation, placementController.deletePlacement);
router.get('/:id/applicants', restrictTo('admin'), idParamValidation, placementController.getApplicants);
router.post('/:id/apply', restrictTo('student'), idParamValidation, placementController.applyToPlacement);

module.exports = router;
