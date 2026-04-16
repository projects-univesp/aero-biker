import { describe, it, expect, vi, beforeEach } from "vitest";

import { EnrollmentService } from "@services/enrollmentService";
import { Enrollment } from "@models/enrollment";

vi.mock("@models/enrollment");

describe("Enrollment Services - Create", () => {
  let enrollmentService: EnrollmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService = new EnrollmentService();
  });

  it("Must create an enrollment succesfully", async () => {
    const enrollmentData = {
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      groupId: "550e8400-e29b-41d4-a716-446655440001",
      status: "ACTIVE",
    };

    vi.mocked(Enrollment.count).mockResolvedValue(0);

    vi.mocked(Enrollment.create).mockResolvedValue({
      id: "mock-uuid-123",
      ...enrollmentData,
    } as any);

    const response = await enrollmentService.create(enrollmentData);

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Enrollment created succesfully");
    expect(response.data.id).toBe("mock-uuid-123");
  });

  it("Must give a conflict error due to active enrollment for same student and group", async () => {
    const enrollmentData = {
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      groupId: "550e8400-e29b-41d4-a716-446655440001",
      status: "ACTIVE",
    };

    vi.mocked(Enrollment.count).mockResolvedValue(1);

    await expect(enrollmentService.create(enrollmentData)).rejects.toThrow();

    expect(Enrollment.create).not.toHaveBeenCalled();
  });
});

describe("Enrollment Services - Get", () => {
  let enrollmentService: EnrollmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService = new EnrollmentService();
  });

  it("Must get enrollment information succesfully", async () => {
    const fakeId = "mock-uuid-123";
    const fakeEnrollment = {
      id: fakeId,
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      groupId: "550e8400-e29b-41d4-a716-446655440001",
      status: "ACTIVE",
    };

    vi.mocked(Enrollment.findByPk).mockResolvedValue(fakeEnrollment as any);

    const response = await enrollmentService.get(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Enrollment found successfully");
    expect(response.data.id).toBe(fakeId);
  });

  it("Must throw a 404 error if enrollment is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Enrollment.findByPk).mockResolvedValue(null);

    await expect(enrollmentService.get(fakeId)).rejects.toThrow();

    expect(Enrollment.findByPk).toHaveBeenCalledWith(fakeId);
  });
});

describe("Enrollment Services - GetAll", () => {
  let enrollmentService: EnrollmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService = new EnrollmentService();
  });

  const mockEnrollments = [
    {
      id: "mock-uuid-123",
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      groupId: "550e8400-e29b-41d4-a716-446655440001",
      status: "ACTIVE",
    },
  ];

  it("Must get enrollments information succesfully", async () => {
    vi.mocked(Enrollment.findAll).mockResolvedValue(mockEnrollments as any);

    const response = await enrollmentService.getAll();

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Enrollments found successfully");
  });

  it("Must throw a 404 error if enrollments are not found", async () => {
    vi.mocked(Enrollment.findAll).mockResolvedValue([]);

    await expect(enrollmentService.getAll()).rejects.toThrow();
  });
});

describe("Enrollment Services - Update", () => {
  let enrollmentService: EnrollmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService = new EnrollmentService();
  });

  it("Must update an enrollment succesfully", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = {
      status: "INACTIVE",
    };

    const fakeEnrollmentInstance = {
      id: fakeId,
      status: "ACTIVE",
      update: vi.fn().mockResolvedValue({
        id: fakeId,
        ...updateData,
      }),
    };

    vi.mocked(Enrollment.findByPk).mockResolvedValue(
      fakeEnrollmentInstance as any
    );

    const response = await enrollmentService.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Enrollment updated succesfully");
    expect(fakeEnrollmentInstance.update).toHaveBeenCalledWith(updateData);
  });

  it("Must throw a 404 error if enrollment is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Enrollment.findByPk).mockResolvedValue(null);

    await expect(
      enrollmentService.update(fakeId, { status: "INACTIVE" })
    ).rejects.toThrow();
  });
});

describe("Enrollment Services - Delete", () => {
  let enrollmentService: EnrollmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService = new EnrollmentService();
  });

  it("Must soft delete enrollment succesfully (status INACTIVE)", async () => {
    const fakeId = "mock-uuid-123";

    const fakeEnrollmentInstance = {
      id: fakeId,
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Enrollment.findByPk).mockResolvedValue(
      fakeEnrollmentInstance as any
    );

    const response = await enrollmentService.delete(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Enrollment deleted succesfully");
    expect(fakeEnrollmentInstance.update).toHaveBeenCalledWith({
      status: "INACTIVE",
    });
  });

  it("Must throw a 404 error if enrollment is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Enrollment.findByPk).mockResolvedValue(null);

    await expect(enrollmentService.delete(fakeId)).rejects.toThrow();
  });
});
