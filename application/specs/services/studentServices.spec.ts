import { describe, it, expect, vi, beforeEach } from "vitest";

import { StudentServices } from "@services/studentServices";
import { Student } from "@models/student";

vi.mock("@models/student");

describe("Students Services - Create", () => {
  let studentServices: StudentServices;

  beforeEach(() => {
    vi.clearAllMocks();
    studentServices = new StudentServices();
  });

  it("Must create a user sucessfully", async () => {
    const studentData = {
      name: "Saymon Macedo",
      phone: "551983267343",
      isActive: true,
    };

    vi.mocked(Student.count).mockResolvedValue(0);

    vi.mocked(Student.create).mockResolvedValue({
      id: "mock-uuid-123",
      ...studentData,
    } as any);

    const response = await studentServices.create(studentData);

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Student created succesfully");
    expect(response.data.id).toBe("mock-uuid-123");
  });

  it("Must give a conflict error due same student registered, phone already exists for example", async () => {
    const studentData = {
      name: "Machado de Assis",
      phone: "5517980367429",
      isActive: true,
    };

    vi.mocked(Student.count).mockResolvedValue(1);

    await expect(studentServices.create(studentData)).rejects.toThrow();

    expect(Student.create).not.toHaveBeenCalled();
  });
});

describe("Students Services - Get", () => {
  let studentServices: StudentServices;

  beforeEach(() => {
    vi.clearAllMocks();
    studentServices = new StudentServices();
  });

  it("Must get student information sucessfully", async () => {
    const fakeId = "mock-uuid-123";
    const fakeStudent = {
      id: fakeId,
      name: "Ana Beatriz",
      phone: "11999999999",
      isActive: true,
    };

    vi.mocked(Student.findByPk).mockResolvedValue(fakeStudent as any);

    const response = await studentServices.get(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Student found successfully");
    expect(response.data.name).toBe("Ana Beatriz");
  });

  it("Must throw a 404 error if student is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Student.findByPk).mockResolvedValue(null);

    await expect(studentServices.get(fakeId)).rejects.toThrow();

    expect(Student.findByPk).toHaveBeenCalledWith(fakeId);
  });
});

describe("Students Services - Update", () => {
  let studentServices: StudentServices;

  beforeEach(() => {
    vi.clearAllMocks();
    studentServices = new StudentServices();
  });

  it("Must update a user sucessfully", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = {
      name: "Ana Beatriz",
      phone: "11888888888",
      isActive: true,
    };

    const fakeStudentInstance = {
      id: fakeId,
      name: "Ana Beatriz",
      phone: "11999999999",
      isActive: true,
      update: vi
        .fn()
        .mockResolvedValue({
          id: fakeId,
          name: "Ana Beatriz",
          phone: updateData.phone,
          isActive: true,
        }),
    };

    vi.mocked(Student.findByPk).mockResolvedValue(fakeStudentInstance as any);

    const response = await studentServices.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Student updated succesfully");
    expect(fakeStudentInstance.update).toHaveBeenCalledWith(updateData);
  });

  it("Must throw a 409 error if student phone already exists", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = {
      name: "Ana Beatriz",
      phone: "11888888888",
      isActive: true,
    };

    const fakeStudentInstance = {
      id: fakeId,
      phone: "11999999999",
    };

    vi.mocked(Student.findByPk).mockResolvedValue(fakeStudentInstance as any);

    vi.mocked(Student.findOne).mockResolvedValue({
      id: "outro-cara-uuid",
    } as any);

    await expect(studentServices.update(fakeId, updateData)).rejects.toThrow();
  });

  it("Must throw a 404 error if student is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Student.findByPk).mockResolvedValue(null);

    await expect(
      studentServices.update(fakeId, {
        name: "Teste",
        phone: "11999999999",
        isActive: true,
      }),
    ).rejects.toThrow();
  });
});

describe("Students Services - Delete", () => {
  let studentServices: StudentServices;

  beforeEach(() => {
    vi.clearAllMocks();
    studentServices = new StudentServices();
  });

  it("Must fake delete student information sucessfully", async () => {
    const fakeId = "mock-uuid-123";

    const fakeStudentInstance = {
      id: fakeId,
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Student.findByPk).mockResolvedValue(fakeStudentInstance as any);

    const response = await studentServices.delete(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Student deactivated succesfully");
    expect(fakeStudentInstance.update).toHaveBeenCalledWith({
      isActive: false,
    });
  });

  it("Must throw a 404 error if student is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Student.findByPk).mockResolvedValue(null);

    await expect(studentServices.delete(fakeId)).rejects.toThrow();
  });
});
