import express from "express";
import { lookupPincode, bulkPincodeLookup } from "../controllers/pincode.controller.js";

const router = express.Router();

/**
 * Pincode Routes
 */

// Lookup pincode details and delivery estimate
router.get("/lookup/:pincode", lookupPincode);

// Bulk pincode lookup
router.post("/bulk", bulkPincodeLookup);

export default router;
