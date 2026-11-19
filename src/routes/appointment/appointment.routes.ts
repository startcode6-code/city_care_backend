import { Router } from "express"; import { createAppointment, updateAppointment, deleteAppointment } from "../../controllers/appointment/appointment.controller";

const router: Router = Router();

router.post("/create", createAppointment);
router.patch("/update/:id", updateAppointment)
router.delete("/delete/:id", deleteAppointment)

export default router;
