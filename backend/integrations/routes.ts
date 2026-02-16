
import express from 'express';
import {
    initiateGoogleAuth,
    handleGoogleCallback,
    listGoogleSheets,
    getSheetSchema,
    importSheetData
} from './googleSheets';
import { listDriveFiles, getDriveFileSchema } from './googleDrive';
import { listAdsCustomers, getCampaignsSchema, getAdGroupsSchema } from './googleAds';

const router = express.Router();

// OAuth Flow
router.get('/google/auth', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Sheets Management
router.get('/google/sheets/list', listGoogleSheets);
router.get('/google/sheets/:sheetId/schema', getSheetSchema);
router.post('/google/sheets/:sheetId/import', importSheetData);

// Drive Management
router.get('/google/drive/list', listDriveFiles);
router.get('/google/drive/:fileId/schema', getDriveFileSchema);

// Ads Management
router.get('/google/ads/customers', listAdsCustomers);
router.get('/google/ads/:customerId/campaigns/schema', getCampaignsSchema);
router.get('/google/ads/:customerId/adgroups/schema', getAdGroupsSchema);

export default router;
