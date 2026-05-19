import { describe, it, expect, vi, beforeEach } from "vitest";

import { DashboardService } from "../../src/services/dashboardService";
import { Student } from "../../src/models/student";
import { Group } from "../../src/models/group";
import { Plan } from "../../src/models/plan";


vi.mock("@models/student");
vi.mock("@models/group");
vi.mock("@models/plan");


describe("Dashboard Services - Get Dashboard", () => {
  let dashboardService: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    dashboardService = new DashboardService();
  });

  it("Must get dashboard information successfully", async () => {
    vi.mocked(Student.count).mockResolvedValue(10);
    vi.mocked(Group.count).mockResolvedValue(3);
    vi.mocked(Plan.count).mockResolvedValue(4);

    const response = await dashboardService.getDashboard();

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Dashboard found successfully");

    expect(response.data.totalStudents).toBe(10);
    expect(response.data.totalGroups).toBe(3);
    expect(response.data.totalPlans).toBe(4);
    expect(response.data.totalPayments).toBe(8);
  });

  it("Must call all required models", async () => {
    vi.mocked(Student.count).mockResolvedValue(10);
    vi.mocked(Group.count).mockResolvedValue(3);
    vi.mocked(Plan.count).mockResolvedValue(4);

    await dashboardService.getDashboard();

    expect(Student.count).toHaveBeenCalled();
    expect(Group.count).toHaveBeenCalled();
    expect(Plan.count).toHaveBeenCalled();
  });

  it("Must throw an error if dashboard data cannot be loaded", async () => {
    vi.mocked(Student.count).mockRejectedValue(new Error("Database error"));

    await expect(dashboardService.getDashboard()).rejects.toThrow();
  });
});