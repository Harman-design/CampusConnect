const express = require('express');
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const { createEventValidation, updateEventValidation, idParamValidation } = require('../validations/eventValidation');

const router = express.Router();

router.use(protect);

// --- Student-specific literal route (must come before "/:id") ---
router.get('/my-registrations', restrictTo('student'), eventController.getMyRegistrations);

// --- Collection routes ---
router.get('/', eventController.getEvents);
router.post('/', restrictTo('admin'), createEventValidation, eventController.createEvent);

// --- Single-resource routes ---
router.get('/:id', idParamValidation, eventController.getEventById);
router.patch('/:id', restrictTo('admin'), updateEventValidation, eventController.updateEvent);
router.delete('/:id', restrictTo('admin'), idParamValidation, eventController.deleteEvent);
router.get('/:id/registrations', restrictTo('admin'), idParamValidation, eventController.getEventRegistrations);
router.post('/:id/register', restrictTo('student'), idParamValidation, eventController.registerForEvent);
router.delete('/:id/register', restrictTo('student'), idParamValidation, eventController.cancelRegistration);

module.exports = router;
