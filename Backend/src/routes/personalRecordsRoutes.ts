import { Router } from "express";

import { getPersonalRecords } from "../controllers/personalRecordsController";

const router = Router();

router.get("/records", getPersonalRecords); // -TESTED WORKING

export default router;
