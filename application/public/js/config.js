export const APP_CONFIG = Object.freeze({
  STUDENTS: {
    id: "student-id",
    path: "students",
    modalId: "modal-student",
    entityName: "Aluno",
    fields: {
      name: "student-name",
      phone: "student-phone",
      groupId: "student-group",
      enrollment: "student-enrollment",
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
    },
    numericFields: {
      maxCapacity: "group-capacity",
    },
    checkboxes: {
      isActive: "group-active",
    },
    checkboxGroups: {
      daysOfWeek: "group-days-container",
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

  SCHEDULES: {
    id: "schedule-id",
    path: "schedules",
    modalId: "modal-schedule",
    entityName: "Aula",
    fields: {
      groupId: "schedule-group",
      startTime: "schedule-start",
      endTime: "schedule-end",
      dayOfWeek: "schedule-day",
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
});

window.APP_CONFIG = APP_CONFIG;
