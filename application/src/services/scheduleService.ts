import { ScheduleDTO } from "@dtos/schedule";
import { Schedule } from "@models/schedules";
import { Group } from "@models/group";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

export class ScheduleService {
  create = async (scheduleData: Partial<ScheduleDTO>) => {
    const group = await Group.findByPk(scheduleData.groupId);
    if (!group) throw logger.error("Group not found", 404);

    const createdSchedule = await Schedule.create(scheduleData);

    return responseFormat({
      message: "Schedule created successfully",
      statusCode: 201,
      data: createdSchedule,
    });
  };

  getAll = async () => { 
    const schedules = await Schedule.findAll({
      include: [{ model: Group, as: "group", attributes: ["name", "maxCapacity"] }],
      order: [
        ["dayOfWeek", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    if (schedules.length === 0) throw logger.error("Schedules not found", 404);

    return responseFormat({
      message: "Schedules found successfully",
      statusCode: 200,
      data: schedules,
    });
  };

  get = async (id: string) => {
    const schedule = await Schedule.findByPk(id, {
      include: [{ model: Group, as: "group" }],
    });

    if (schedule === null) throw logger.error("Schedule not found", 404);

    return responseFormat({
      message: "Schedule found successfully",
      statusCode: 200,
      data: schedule,
    });
  };

  update = async (id: string, scheduleData: Partial<ScheduleDTO>) => {
    const schedule = await Schedule.findByPk(id);
    if (schedule === null) throw logger.error("Schedule not found", 404);

    if (scheduleData.groupId) {
      const group = await Group.findByPk(scheduleData.groupId);
      if (!group) throw logger.error("Group not found", 404);
    }

    const updatedSchedule = await schedule.update(scheduleData);

    return responseFormat({
      message: "Schedule updated successfully",
      statusCode: 200,
      data: updatedSchedule,
    });
  };

  delete = async (id: string) => {
    const schedule = await Schedule.findByPk(id);
    if (schedule === null) throw logger.error("Schedule not found", 404);

    await schedule.destroy(); 

    return responseFormat({
      message: "Schedule deleted successfully",
      statusCode: 200,
    });
  };
}