import { describe, it, expect, vi, beforeEach } from "vitest";

import { PlanService } from "@services/planService";
import { Plan } from "@models/plan";

vi.mock("@models/plan");

describe("Plan Services - Create", () => {
  let planService: PlanService;

  beforeEach(() => {
    vi.clearAllMocks();
    planService = new PlanService();
  });

  it("Must create a plan sucessfully", async () => {
    const planData = {
      name: "Plano Básico",
      description: "Teste",
      price: 100,
      durationMonths: 1,
    };

    vi.mocked(Plan.count).mockResolvedValue(0);

    vi.mocked(Plan.create).mockResolvedValue({
      id: "mock-uuid-123",
      ...planData,
    } as any);

    const response = await planService.create(planData);

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Plan created succesfully");
    expect(response.data.id).toBe("mock-uuid-123");
  });

  it("Must give a conflict error due same plan registered", async () => {
    const planData = {
      name: "Plano Pro",
      description: "Teste",
      price: 200,
      durationMonths: 2,
    };

    vi.mocked(Plan.count).mockResolvedValue(1);

    await expect(planService.create(planData)).rejects.toThrow();

    expect(Plan.create).not.toHaveBeenCalled();
  });
});

describe("Plan Services - Get", () => {
  let planService: PlanService;

  beforeEach(() => {
    vi.clearAllMocks();
    planService = new PlanService();
  });

  it("Must get plan information sucessfully", async () => {
    const fakeId = "mock-uuid-123";
    const fakePlan = {
      id: fakeId,
      name: "Plano A",
      description: "Teste",
      price: 100,
      durationMonths: 1,
    };

    vi.mocked(Plan.findByPk).mockResolvedValue(fakePlan as any);

    const response = await planService.get(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Plan found successfully");
    expect(response.data.name).toBe("Plano A");
  });

  it("Must throw a 404 error if plan is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Plan.findByPk).mockResolvedValue(null);

    await expect(planService.get(fakeId)).rejects.toThrow();

    expect(Plan.findByPk).toHaveBeenCalledWith(fakeId);
  });
});

describe("Plan Services - GetAll", () => {
  let planService: PlanService;

  beforeEach(() => {
    vi.clearAllMocks();
    planService = new PlanService();
  });

  const mockPlans = [
    {
      id: "123",
      name: "Plano A",
      description: "Teste",
      price: 100,
      durationMonths: 1,
    },
  ];

  it("Must get plans information sucessfully", async () => {
    vi.mocked(Plan.findAll).mockResolvedValue(mockPlans as any);

    const response = await planService.getAll();

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Plans found successfully");
  });

  it("Must throw a 404 error if plans are not found", async () => {
    vi.mocked(Plan.findAll).mockResolvedValue([]);

    await expect(planService.getAll()).rejects.toThrow();
  });
});

describe("Plan Services - Update", () => {
  let planService: PlanService;

  beforeEach(() => {
    vi.clearAllMocks();
    planService = new PlanService();
  });

  it("Must update a plan sucessfully", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = {
      name: "Plano Atualizado",
    };

    const fakePlanInstance = {
      id: fakeId,
      name: "Plano Antigo",
      update: vi.fn().mockResolvedValue({
        id: fakeId,
        name: updateData.name,
      }),
    };

    vi.mocked(Plan.findByPk).mockResolvedValue(fakePlanInstance as any);
    vi.mocked(Plan.count).mockResolvedValue(0);

    const response = await planService.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Plan updated succesfully");
    expect(fakePlanInstance.update).toHaveBeenCalledWith(updateData);
  });

  it("Must throw a 409 error if plan already exists", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = {
      name: "Plano Novo",
    };

    const fakePlanInstance = {
      id: fakeId,
      name: "Plano Antigo",
    };

    vi.mocked(Plan.findByPk).mockResolvedValue(fakePlanInstance as any);
    vi.mocked(Plan.count).mockResolvedValue(1);

    await expect(planService.update(fakeId, updateData)).rejects.toThrow();
  });

  it("Must throw a 404 error if plan is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Plan.findByPk).mockResolvedValue(null);

    await expect(
      planService.update(fakeId, { name: "Teste" })
    ).rejects.toThrow();
  });
});

describe("Plan Services - Delete", () => {
  let planService: PlanService;

  beforeEach(() => {
    vi.clearAllMocks();
    planService = new PlanService();
  });

  it("Must fake delete plan information sucessfully", async () => {
    const fakeId = "mock-uuid-123";

    const fakePlanInstance = {
      id: fakeId,
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Plan.findByPk).mockResolvedValue(fakePlanInstance as any);

    const response = await planService.delete(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Plan deactivated succesfully");
    expect(fakePlanInstance.update).toHaveBeenCalledWith({
      isActive: false,
    });
  });

  it("Must throw a 404 error if plan is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Plan.findByPk).mockResolvedValue(null);

    await expect(planService.delete(fakeId)).rejects.toThrow();
  });
});