import { Op } from "sequelize";
import { Student } from "@models/student";
import { Group } from "@models/group";
import { Plan } from "@models/plan";
import { Schedule } from "@models/schedules";
import { Subscription } from "@models/subscription";
import { formatBRL } from "@utils/currency";

export class DashboardService {
  getDashboard = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const in30Days = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Executamos TODAS as consultas independentes ao MESMO TEMPO (Performance drástica!)
    const [
      totalStudents,
      totalLessons,
      totalPlans,
      pendingCount,
      estimatedRaw,
      receivedRaw,
      groupsWithStudents,
      activePlansData,
      renewalSubs
    ] = await Promise.all([
      Student.count({ where: { isActive: true } }),
      Schedule.count(),
      Plan.count({ where: { isActive: true } }),
      Subscription.count({ where: { status: "PENDING" } }),
      
      // O Banco de dados faz a soma pra você! Não precisa de .findAll() + .reduce()
      Subscription.sum('subscriptionValue', { where: { status: "ACTIVE" } }),
      
      Subscription.sum('subscriptionValue', { 
        where: { status: "ACTIVE", startDate: { [Op.between]: [startOfMonth, endOfMonth] } } 
      }),

      Group.findAll({
        where: { isActive: true },
        include: [{ model: Student, as: "students", attributes: ["id"] }],
        attributes: ["id", "name", "daysOfWeek", "time"],
      }),

      Plan.findAll({
        where: { isActive: true },
        include: [{ model: Subscription, as: "subscriptions", where: { status: "ACTIVE" }, required: false, attributes: ["id"] }],
        attributes: ["id", "name"],
      }),

      Subscription.findAll({
        where: { renovationDate: { [Op.between]: [startOfToday, in30Days] }, status: "ACTIVE" },
        include: [
          { model: Student, as: "student", attributes: ["name"] },
          { model: Plan, as: "plan", attributes: ["name"] },
        ],
        limit: 5,
        order: [["renovationDate", "ASC"]],
      })
    ]);

    // 2. Formatação dos dados que voltaram do banco
    const totalClasses = groupsWithStudents.length;
    const studentsPerGroup = groupsWithStudents.map((g: any) => ({
      label: `${g.daysOfWeek} ${g.time}`,
      count: g.students?.length ?? 0,
    }));

    const planDistribution = activePlansData
      .filter((p: any) => (p.subscriptions?.length ?? 0) > 0)
      .map((p: any) => ({ label: p.name, count: p.subscriptions.length }));

    const upcomingRenewals = renewalSubs.map((s: any) => ({
      student: s.student?.name ?? "—",
      plan: s.plan?.name ?? "—",
      expiresAt: new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(s.renovationDate)),
    }));

    const monthRaw = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now);

    return {
      totalStudents,
      totalClasses,
      totalLessons,
      totalPlans,
      totalGroups: totalClasses,
      activeGroups: totalClasses,
      activePlans: totalPlans,
      totalSubscriptions: estimatedRaw ? 1 : 0,
      activeSubscriptions: estimatedRaw ? 1 : 0,
      studentsPerGroup,
      planDistribution,
      receivedAmount: formatBRL(receivedRaw || 0),
      paidCount: receivedRaw ? 1 : 0,
      pendingCount,
      estimatedRevenue: formatBRL(estimatedRaw || 0),
      currentMonth: monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1),
      upcomingRenewals,
      recentClasses: [],
    };
  };
}