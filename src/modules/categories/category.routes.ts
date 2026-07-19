import { Router } from "express";
import * as controller from "./category.controller.js";

const router = Router();

router.get("/", controller.list);

router.get("/with-counts", controller.listWithCounts);

export default router;
