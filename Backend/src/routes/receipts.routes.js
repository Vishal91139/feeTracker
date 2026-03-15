import { Router } from 'express';
import { createReceipt,
    getReceiptById,
    getReceipts,
    updateReceipt, 
    deleteReceipt } from '../controllers/receipts.controller.js';

const router = Router();

router.route('/create').post(createReceipt);
router.route('/').get(getReceipts)
router.route('/:receiptId').get(getReceiptById);
router.route('/:receiptId').patch(updateReceipt).delete(deleteReceipt);

export default router;