import express from 'express';
import {
    initiateGoogleAuth,
    handleGoogleCallback,
    listGoogleSheets,
    getSheetSchema,
    importSheetData
} from './googleSheets';

const router = express.Router();

// OAuth Flow
router.get('/google/auth', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Sheets Management
router.get('/google/sheets/list', listGoogleSheets);
router.get('/google/sheets/:sheetId/schema', getSheetSchema);
router.post('/google/sheets/:sheetId/import', importSheetData);

export default router;
