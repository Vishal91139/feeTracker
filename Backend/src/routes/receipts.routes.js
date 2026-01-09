import { Router } from 'express';
import { createReceipt, getReceipt, getAllReceipts, updateReceipt, deleteReceipt, searchReceipt } from '../controllers/receipts.controller';

const router = Router();

// Create a new receipt
router.route('/receipts').post(createReceipt);

// Retrieve all receipts
router.route('/receipts').get(getAllReceipts);

// Retrieve a single receipt with id
router.route('/receipts/:id').get(getReceipt);

// Update a receipt with id
router.route('/receipts/:id').put(updateReceipt);

// Delete a receipt with id
router.route('/receipts/:id').delete(deleteReceipt);

// search a reciept with ReceiptNo
router.route('/receipts/search/').get(searchReceipt);

export default router;