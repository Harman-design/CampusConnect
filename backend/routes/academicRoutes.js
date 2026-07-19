const express = require('express');
const academicController = require('../controllers/academicController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');

const router = express.Router();

// All academic resource routes require authentication
router.use(protect);

// Student & general browse/search endpoints
router.get('/', academicController.getResources);
router.get('/subjects', academicController.getSubjects);
router.get('/subjects/:subjectName', academicController.getSubjectDetails);
router.get('/recent-views', academicController.getRecentViews);
router.get('/recent-downloads', academicController.getRecentDownloads);
router.post('/:id/download', academicController.registerDownload);
router.post('/:id/view', academicController.registerView);
router.post('/:id/bookmark', academicController.toggleBookmark);
router.post('/:id/ai', academicController.generateAI);
router.get('/:id/similar', academicController.getSimilarResources);

// Admin-only management and import endpoints
router.post('/admin/import', restrictTo('admin'), academicController.importFolder);
router.post('/admin/sync', restrictTo('admin'), academicController.syncFolder);
router.post('/admin/bulk', restrictTo('admin'), academicController.bulkAction);
router.get('/admin/analytics', restrictTo('admin'), academicController.getAnalytics);
router.patch('/admin/:id', restrictTo('admin'), academicController.updateResource);
router.delete('/admin/:id', restrictTo('admin'), academicController.deleteResource);

// Admin Provider configurations integration
router.get('/admin/providers', restrictTo('admin'), academicController.getProvidersConfig);
router.put('/admin/providers', restrictTo('admin'), academicController.updateProvidersConfig);
router.post('/admin/providers/:providerId/refresh', restrictTo('admin'), academicController.refreshProviderCache);

// Admin Drive Folder configurations mapping
router.get('/admin/folders', restrictTo('admin'), academicController.getDriveFolders);
router.post('/admin/folders', restrictTo('admin'), academicController.createDriveFolder);
router.put('/admin/folders/:id', restrictTo('admin'), academicController.updateDriveFolder);
router.delete('/admin/folders/:id', restrictTo('admin'), academicController.deleteDriveFolder);
router.post('/admin/folders/:id/sync', restrictTo('admin'), academicController.syncDriveFolder);
router.post('/admin/folders/sync-all', restrictTo('admin'), academicController.syncAllDriveFolders);

module.exports = router;
