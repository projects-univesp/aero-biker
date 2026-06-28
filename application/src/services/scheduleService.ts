import { ScheduleDTO } from "@dtos/schedule";
import { Schedule } from "@models/schedules";
import { Group } from "@models/group";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";

export class ScheduleService {
  create = async (scheduleData: Partial<ScheduleDTO>) => {
    const group = await Group.findByPk(scheduleData.groupId);
    if (!group) throw new AppError("Group not found", 404);

    const createdSchedule = await Schedule.create(scheduleData);

    return createdSchedule;
  };

  getAll = async () => { 
    const schedules = await Schedule.findAll({
      include: [{ model: Group, as: "group", attributes: ["name", "maxCapacity"] }],
      order: [
        ["dayOfWeek", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    return schedules;
  };

  get = async (id: string) => {
    const schedule = await Schedule.findByPk(id, {
      include: [{ model: Group, as: "group" }],
    });

    if (schedule === null) throw new AppError("Schedule not found", 404);

    return schedule;
  };

  update = async (id: string, scheduleData: Partial<ScheduleDTO>) => {
    const schedule = await Schedule.findByPk(id);
    if (schedule === null) throw new AppError("Schedule not found", 404);

    if (scheduleData.groupId) {
      const group = await Group.findByPk(scheduleData.groupId);
      if (!group) throw new AppError("Group not found", 404);
    }

    const updatedSchedule = await schedule.update(scheduleData);

    return updatedSchedule;
  };

  delete = async (id: string) => {
    const schedule = await Schedule.findByPk(id);
    if (schedule === null) throw new AppError("Schedule not found", 404);

    await schedule.destroy();
  };
}