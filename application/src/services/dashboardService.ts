import { Student } from "@models/student";
import { Group } from "@models/group";
import { Plan } from "@models/plan";
import { Subscription } from "@models/subscription";
import { responseFormat } from "@utils/responseFormat";

export class DashboardService {
  getDashboard = async () => {
    const totalStudents = await Student.count();

    const totalGroups = await Group.count();

    const totalPlans = await Plan.count();

    const totalSubscriptions = await Subscription.count();

    const activeGroups = await Group.count({
      where: { isActive: true },
    });

    const activePlans = await Plan.count({
      where: { isActive: true },
    });

    const activeSubscriptions = await Subscription.count({
      where: { status: "ACTIVE" },
    });

    return responseFormat.send({
      message: "Dashboard found successfully",
      statusCode: 200,
      data: {
        totalStudents,
        totalGroups,
        totalPlans,
        totalSubscriptions,
        activeGroups,
        activePlans,
        activeSubscriptions,
        totalClasses: totalGroups,
        totalLessons: 0,
        recentClasses: [],
        upcomingRenewals: [],
      },
    });
  };
}