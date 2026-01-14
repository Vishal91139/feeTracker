import { Router } from 'express';
import { createReceipt,
    getReceiptById,
    getAllReceipts,
    updateReceipt, 
    deleteReceipt,
    searchReceipt } from '../controllers/receipts.controller.js';

const router = Router();

router.route('/create').post(createReceipt);
router.route('/:receiptId').get(getReceiptById);
router.route('/').get(getAllReceipts);
router.route('/:id').patch(updateReceipt);
router.route('/:id').delete(deleteReceipt);
router.route('/search').get(searchReceipt);

export default router;