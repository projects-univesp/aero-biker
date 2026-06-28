import { ScheduleService } from "@services/scheduleService";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class ScheduleController {
  private scheduleService = new ScheduleService();
  private verifyData = new VerifyData();

  createSchedule = async (request: Request, response: Response) => {
    const validSchedule = this.verifyData.verifySchedule(request.body);
    const parsedSchedule = await this.scheduleService.create(validSchedule);

    return response
      .status(201)
      .json({ message: "Schedule created successfully", data: parsedSchedule });
  };

  getAllSchedules = async (request: Request, response: Response) => {
    const parsedSchedule = await this.scheduleService.getAll();

    return response
      .status(200)
      .json({ message: "Schedules found successfully", data: parsedSchedule });
  };

  getSchedule = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const parsedSchedule = await this.scheduleService.get(id);

    return response
      .status(200)
      .json({ message: "Schedule found successfully", data: parsedSchedule });
  };

  updateSchedule = async (request: Request, response: Response) => {
    const validSchedule = this.verifyData.verifySchedulePartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const parsedSchedule = await this.scheduleService.update(id, validSchedule);

    return response
      .status(200)
      .json({ message: "Schedule updated successfully", data: parsedSchedule });
  };

  deleteSchedule = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const parsedSchedule = await this.scheduleService.delete(id);

    return response
      .status(200)
      .json({ message: "Schedule deactivated successfully" });
  };
}
