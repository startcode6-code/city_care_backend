import { Router } from "express"; import { createAppointment, updateAppointment, deleteAppointment, getAppointments } from "../../controllers/appointment/appointment.controller";

const router: Router = Router();

router.post("/create", createAppointment);
router.patch("/update/:id", updateAppointment)
router.delete("/delete/:id", deleteAppointment)
router.get("/get", getAppointments)

export default router;
