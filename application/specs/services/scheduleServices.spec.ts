import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScheduleService } from "../../src/services/scheduleService";
import { Schedule } from "../../src/models/schedules";
import { Group } from "../../src/models/group";

vi.mock("@models/schedules");
vi.mock("@models/group");

describe("Schedule Services - Create", () => {
  let scheduleService: ScheduleService;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduleService = new ScheduleService();
  });

  it("Must create a schedule successfully", async () => {
    const scheduleData = {
      groupId: "mock-group-uuid",
      dayAndMonth: "2026-05-22",
      startTime: "08:00",
      endTime: "09:00",
    };

    vi.mocked(Group.findByPk).mockResolvedValue({
      id: "mock-group-uuid",
    } as any);

    vi.mocked(Schedule.create).mockResolvedValue({
      id: "mock-uuid-123",
      ...scheduleData,
    } as any);

    const response = await scheduleService.create(scheduleData);

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Schedule created successfully");
    expect(response.data.id).toBe("mock-uuid-123");
  });

  it("Must throw a 404 error if group is not found", async () => {
    const scheduleData = {
      groupId: "non-existent-group",
      dayAndMonth: "2026-05-23",
      startTime: "10:00",
      endTime: "11:00",
    };

    vi.mocked(Group.findByPk).mockResolvedValue(null);

    await expect(scheduleService.create(scheduleData)).rejects.toThrow();

    expect(Schedule.create).not.toHaveBeenCalled();
  });
});

describe("Schedule Services - Get", () => {
  let scheduleService: ScheduleService;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduleService = new ScheduleService();
  });

  it("Must get schedule information successfully", async () => {
    const fakeId = "mock-uuid-123";

    const fakeSchedule = {
      id: fakeId,
      groupId: "mock-group-uuid",
      dayAndMonth: "2026-05-22",
      startTime: "08:00",
      endTime: "09:00",
    };

    vi.mocked(Schedule.findByPk).mockResolvedValue(fakeSchedule as any);

    const response = await scheduleService.get(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Schedule found successfully");
    expect(response.data.id).toBe(fakeId);
  });

  it("Must throw a 404 error if schedule is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Schedule.findByPk).mockResolvedValue(null);

    await expect(scheduleService.get(fakeId)).rejects.toThrow();

    expect(Schedule.findByPk).toHaveBeenCalledWith(fakeId, expect.any(Object));
  });
});

describe("Schedule Services - GetAll", () => {
  let scheduleService: ScheduleService;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduleService = new ScheduleService();
  });

  const mockSchedules = [
    {
      id: "mock-uuid-123",
      groupId: "mock-group-uuid",
      dayAndMonth: "2026-05-22",
      startTime: "08:00",
      endTime: "09:00",
    },
  ];

  it("Must get schedules information successfully", async () => {
    vi.mocked(Schedule.findAll).mockResolvedValue(mockSchedules as any);

    const response = await scheduleService.getAll();

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Schedules found successfully");
  });

  it("Must return empty list when no schedules are found", async () => {
    vi.mocked(Schedule.findAll).mockResolvedValue([]);

    const response = await scheduleService.getAll();
    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual([]);
  });
});

describe("Schedule Services - Update", () => {
  let scheduleService: ScheduleService;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduleService = new ScheduleService();
  });

  it("Must update a schedule successfully", async () => {
    const fakeId = "mock-uuid-123";

    const updateData = {
      startTime: "09:00",
      endTime: "10:00",
      dayAndMonth: "2026-05-25",
    };

    const fakeScheduleInstance = {
      id: fakeId,
      dayAndMonth: "2026-05-22",
      startTime: "08:00",
      endTime: "09:00",

      update: vi.fn().mockResolvedValue({
        id: fakeId,
        ...updateData,
      }),
    };

    vi.mocked(Schedule.findByPk).mockResolvedValue(fakeScheduleInstance as any);

    const response = await scheduleService.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Schedule updated successfully");

    expect(fakeScheduleInstance.update).toHaveBeenCalledWith(updateData);
  });

  it("Must throw a 404 error if group is not found when updating groupId", async () => {
    const fakeId = "mock-uuid-123";

    const updateData = {
      groupId: "non-existent-group",
    };

    const fakeScheduleInstance = {
      id: fakeId,
      groupId: "mock-group-uuid",

      update: vi.fn(),
    };

    vi.mocked(Schedule.findByPk).mockResolvedValue(fakeScheduleInstance as any);

    vi.mocked(Group.findByPk).mockResolvedValue(null);

    await expect(scheduleService.update(fakeId, updateData)).rejects.toThrow();

    expect(fakeScheduleInstance.update).not.toHaveBeenCalled();
  });

  it("Must throw a 404 error if schedule is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Schedule.findByPk).mockResolvedValue(null);

    await expect(
      scheduleService.update(fakeId, {
        startTime: "10:00",
      }),
    ).rejects.toThrow();
  });
});

describe("Schedule Services - Delete", () => {
  let scheduleService: ScheduleService;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduleService = new ScheduleService();
  });

  it("Must delete schedule successfully", async () => {
    const fakeId = "mock-uuid-123";

    const fakeScheduleInstance = {
      id: fakeId,

      destroy: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(Schedule.findByPk).mockResolvedValue(fakeScheduleInstance as any);

    const response = await scheduleService.delete(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Schedule deleted successfully");

    expect(fakeScheduleInstance.destroy).toHaveBeenCalled();
  });

  it("Must throw a 404 error if schedule is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Schedule.findByPk).mockResolvedValue(null);

    await expect(scheduleService.delete(fakeId)).rejects.toThrow();
  });
});
