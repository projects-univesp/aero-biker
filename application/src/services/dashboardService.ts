import { Op } from "sequelize";
import { Student } from "@models/student";
import { Group } from "@models/group";
import { Plan } from "@models/plan";
import { Schedule } from "@models/schedules";
import { Subscription } from "@models/subscription";
import { responseFormat } from "@utils/responseFormat";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

export class DashboardService {
  getDashboard = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    // Use UTC day boundary so subscriptions stored as midnight don't fall outside the range
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const in30Days = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Basic counts
    const totalStudents = await Student.count({ where: { isActive: true } });
    const totalLessons = await Schedule.count();
    const totalPlans = await Plan.count({ where: { isActive: true } });

    // Groups with student counts — drives bar chart and totalClasses
    const groupsWithStudents = (await Group.findAll({
      where: { isActive: true },
      include: [{ model: Student, as: "students", attributes: ["id"] }],
      attributes: ["id", "name", "daysOfWeek", "time"],
    })) as any[];

    const totalClasses = groupsWithStudents.length;
    const studentsPerGroup = groupsWithStudents.map((g) => ({
      label: `${g.daysOfWeek} ${g.time}`,
      count: g.students?.length ?? 0,
    }));

    // Active subscriptions list — used for estimated revenue and count
    const activeSubsList = (await Subscription.findAll({
      where: { status: "ACTIVE" },
      attributes: ["subscriptionValue"],
    })) as any[];

    const estimatedRaw = activeSubsList.reduce(
      (sum: number, s: any) => sum + Number(s.subscriptionValue),
      0,
    );
    const estimatedRevenue = formatBRL(estimatedRaw);

    // Plan distribution for pie chart
    const activePlansData = (await Plan.findAll({
      where: { isActive: true },
      include: [
        {
          model: Subscription,
          as: "subscriptions",
          where: { status: "ACTIVE" },
          required: false,
          attributes: ["id"],
        },
      ],
      attributes: ["id", "name"],
    })) as any[];

    const planDistribution = activePlansData
      .filter((p) => (p.subscriptions?.length ?? 0) > 0)
      .map((p) => ({ label: p.name, count: p.subscriptions.length }));

    // Revenue received this month
    const paidSubsThisMonth = (await Subscription.findAll({
      where: {
        status: "ACTIVE",
        startDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      attributes: ["subscriptionValue"],
    })) as any[];

    const receivedRaw = paidSubsThisMonth.reduce(
      (sum: number, s: any) => sum + Number(s.subscriptionValue),
      0,
    );
    const paidCount = paidSubsThisMonth.length;
    const pendingCount = await Subscription.count({
      where: { status: "PENDING" },
    });
    const receivedAmount = formatBRL(receivedRaw);

    // Current month name (capitalised pt-BR)
    const monthRaw = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
    }).format(now);
    const currentMonth =
      monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);

    // Upcoming renewals (next 30 days)
    const renewalSubs = (await Subscription.findAll({
      where: {
        renovationDate: { [Op.between]: [startOfToday, in30Days] },
        status: "ACTIVE",
      },
      include: [
        { model: Student, as: "student", attributes: ["name"] },
        { model: Plan, as: "plan", attributes: ["name"] },
      ],
      limit: 5,
      order: [["renovationDate", "ASC"]],
    })) as any[];

    const upcomingRenewals = renewalSubs.map((s) => ({
      student: s.student?.name ?? "—",
      plan: s.plan?.name ?? "—",
      expiresAt: new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(s.renovationDate),
      ),
    }));

    return responseFormat.send({
      message: "Dashboard found successfully",
      statusCode: 200,
      data: {
        totalStudents,
        totalClasses,
        totalLessons,
        totalPlans,
        totalGroups: totalClasses,
        activeGroups: totalClasses,
        activePlans: totalPlans,
        totalSubscriptions: activeSubsList.length,
        activeSubscriptions: activeSubsList.length,
        studentsPerGroup,
        planDistribution,
        receivedAmount,
        paidCount,
        pendingCount,
        estimatedRevenue,
        currentMonth,
        upcomingRenewals,
        recentClasses: [],
      },
    });
  };
}