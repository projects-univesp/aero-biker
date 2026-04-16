import { describe, it, expect, vi, beforeEach } from "vitest";

import { SubscriptionService } from "@services/subscriptionService";
import { Subscription } from "@models/subscription";

vi.mock("@models/subscription");

describe("Subscription Services - Create", () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionService = new SubscriptionService();
  });

  it("Must create a subscription succesfully", async () => {
    const subscriptionData = {
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      planId: "550e8400-e29b-41d4-a716-446655440001",
      subscriptionValue: 150,
      startDate: new Date("2026-01-01"),
      renovationDate: new Date("2026-02-01"),
      status: "ACTIVE",
      paymentMethod: "credit_card",
    };

    vi.mocked(Subscription.count).mockResolvedValue(0);

    vi.mocked(Subscription.create).mockResolvedValue({
      id: "mock-uuid-123",
      ...subscriptionData,
    } as any);

    const response = await subscriptionService.create(subscriptionData);

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Subscription created succesfully");
    expect(response.data.id).toBe("mock-uuid-123");
  });

  it("Must give a conflict error due to active subscription for same student", async () => {
    const subscriptionData = {
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      planId: "550e8400-e29b-41d4-a716-446655440001",
      subscriptionValue: 150,
      startDate: new Date("2026-01-01"),
      renovationDate: new Date("2026-02-01"),
      status: "ACTIVE",
      paymentMethod: "credit_card",
    };

    vi.mocked(Subscription.count).mockResolvedValue(1);

    await expect(subscriptionService.create(subscriptionData)).rejects.toThrow();

    expect(Subscription.create).not.toHaveBeenCalled();
  });
});

describe("Subscription Services - Get", () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionService = new SubscriptionService();
  });

  it("Must get subscription information succesfully", async () => {
    const fakeId = "mock-uuid-123";
    const fakeSubscription = {
      id: fakeId,
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      planId: "550e8400-e29b-41d4-a716-446655440001",
      subscriptionValue: 150,
      status: "ACTIVE",
      paymentMethod: "credit_card",
    };

    vi.mocked(Subscription.findByPk).mockResolvedValue(fakeSubscription as any);

    const response = await subscriptionService.get(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Subscription found successfully");
    expect(response.data.id).toBe(fakeId);
  });

  it("Must throw a 404 error if subscription is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Subscription.findByPk).mockResolvedValue(null);

    await expect(subscriptionService.get(fakeId)).rejects.toThrow();

    expect(Subscription.findByPk).toHaveBeenCalledWith(fakeId);
  });
});

describe("Subscription Services - GetAll", () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionService = new SubscriptionService();
  });

  const mockSubscriptions = [
    {
      id: "mock-uuid-123",
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      planId: "550e8400-e29b-41d4-a716-446655440001",
      subscriptionValue: 150,
      status: "ACTIVE",
      paymentMethod: "credit_card",
    },
  ];

  it("Must get subscriptions information succesfully", async () => {
    vi.mocked(Subscription.findAll).mockResolvedValue(mockSubscriptions as any);

    const response = await subscriptionService.getAll();

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Subscriptions found successfully");
  });

  it("Must throw a 404 error if subscriptions are not found", async () => {
    vi.mocked(Subscription.findAll).mockResolvedValue([]);

    await expect(subscriptionService.getAll()).rejects.toThrow();
  });
});

describe("Subscription Services - Update", () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionService = new SubscriptionService();
  });

  it("Must update a subscription succesfully", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = {
      subscriptionValue: 200,
      paymentMethod: "debit_card",
    };

    const fakeSubscriptionInstance = {
      id: fakeId,
      subscriptionValue: 150,
      paymentMethod: "credit_card",
      update: vi.fn().mockResolvedValue({
        id: fakeId,
        ...updateData,
      }),
    };

    vi.mocked(Subscription.findByPk).mockResolvedValue(
      fakeSubscriptionInstance as any
    );

    const response = await subscriptionService.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Subscription updated succesfully");
    expect(fakeSubscriptionInstance.update).toHaveBeenCalledWith(updateData);
  });

  it("Must throw a 404 error if subscription is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Subscription.findByPk).mockResolvedValue(null);

    await expect(
      subscriptionService.update(fakeId, { subscriptionValue: 200 })
    ).rejects.toThrow();
  });
});

describe("Subscription Services - Delete", () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionService = new SubscriptionService();
  });

  it("Must soft delete subscription succesfully (status CANCELLED)", async () => {
    const fakeId = "mock-uuid-123";

    const fakeSubscriptionInstance = {
      id: fakeId,
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Subscription.findByPk).mockResolvedValue(
      fakeSubscriptionInstance as any
    );

    const response = await subscriptionService.delete(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Subscription cancelled succesfully");
    expect(fakeSubscriptionInstance.update).toHaveBeenCalledWith({
      status: "CANCELLED",
    });
  });

  it("Must throw a 404 error if subscription is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Subscription.findByPk).mockResolvedValue(null);

    await expect(subscriptionService.delete(fakeId)).rejects.toThrow();
  });
});
