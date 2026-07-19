const express = require('express');
const supportTicketController = require('../controllers/supportTicketController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const {
  createTicketValidation,
  addResponseValidation,
  updateStatusValidation,
  idParamValidation,
} = require('../validations/supportTicketValidation');

const router = express.Router();

router.use(protect);

router.get('/', supportTicketController.getTickets);
router.post('/', restrictTo('student'), createTicketValidation, supportTicketController.createTicket);
router.get('/:id', idParamValidation, supportTicketController.getTicketById);
router.post('/:id/responses', addResponseValidation, supportTicketController.addResponse);
router.patch('/:id/status', restrictTo('admin'), updateStatusValidation, supportTicketController.updateStatus);

module.exports = router;
