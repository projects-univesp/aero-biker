export const APP_CONFIG = Object.freeze({
  STUDENTS: {
    id: "student-id",
    path: "students",
    modalId: "modal-student",
    entityName: "Aluno",
    fields: {
      name: "student-name",
      phone: "student-phone",
      enrollment: "student-enrollment",
      groupId: "student-group",
    },
    checkboxes: {
      isActive: "student-active",
    },
  },

  GROUPS: {
    id: "group-id",
    path: "groups",
    modalId: "modal-group",
    entityName: "Turma",
    fields: {
      name: "group-name",
      daysOfWeek: "group-days",
      time: "group-time",
    },
    numericFields: {
      maxCapacity: "group-capacity",
    },
    checkboxes: {
      isActive: "group-active",
    },
  },

  PLANS: {
    id: "plan-id",
    path: "plans",
    modalId: "modal-plan",
    entityName: "Plano",
    fields: {
      name: "plan-name",
      description: "plan-description",
      durationMonths: "plan-duration",
    },
    numericFields: {
      price: "plan-price",
    },
    enumFields: {
      durationMonths: ["Mensal", "Trimestral", "Semestral", "Anual"],
    },
    checkboxes: {
      isActive: "plan-active",
    },
  },

  SUBSCRIPTIONS: {
    id: "subscription-id",
    path: "subscriptions",
    modalId: "modal-subscription",
    entityName: "Assinatura",
    fields: {
      studentId: "subscription-student",
      planId: "subscription-plan",
      startDate: "subscription-start-date",
      renovationDate: "subscription-renovation-date",
      status: "subscription-status",
      paymentMethod: "subscription-payment-method",
    },
    numericFields: {
      subscriptionValue: "subscription-value",
    },
  },

  SCHEDULES: {
    id: "schedule-id",
    path: "schedules",
    modalId: "modal-schedule",
    entityName: "Agenda",

    fields: {
      title: "schedule-title",
      category: "schedule-category",
      level: "schedule-level",
      description: "schedule-description",
      dayAndMonth: "schedule-date",
      startTime: "schedule-start",
      endTime: "schedule-end",
      groupId: "schedule-group",
    },

    numericFields: {
      currentStudents: "schedule-current-students",
    },

    checkboxes: {
      isHoliday: "schedule-holiday",
      isActive: "schedule-active",
    },

    monthControls: {
      prevBtn: "prevMonthBtn",
      nextBtn: "nextMonthBtn",
      currentMonthLabel: "currentMonthLabel",
      currentYearLabel: "currentYearLabel",
    },
  },
});

window.APP_CONFIG = APP_CONFIG;
