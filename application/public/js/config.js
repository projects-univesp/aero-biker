export const APP_CONFIG = Object.freeze({
    STUDENTS: {
        id: 'student-id',
        path: 'students',
        modalId: 'modal-student',
        entityName: 'Aluno',
        fields: {
            name: 'student-name',
            phone: 'student-phone'
        },
        checkboxes: {
            isActive: 'student-active'
        }
    },

    GROUPS: {
        id: 'group-id',
        path: 'groups',
        modalId: 'modal-group',
        entityName: 'Turma',
        fields: {
            name: 'group-name',
            daysOfWeek: 'group-days',
            time: 'group-time'
        },
        numericFields: {
            maxCapacity: 'group-capacity'
        },
        checkboxes: {
            isActive: 'group-active'
        }
    },

    PLANS: {
        id: 'plan-id',
        path: 'plans',
        modalId: 'modal-plan',
        entityName: 'Plano',
        fields: {
            name: 'plan-name',
            description: 'plan-description'
        },
        numericFields: {
            price: 'plan-price',
            durationMonths: 'plan-duration'
        },
        checkboxes: {
            isActive: 'plan-active'
        }
    },

    SUBSCRIPTIONS: {
        id: 'subscription-id',
        path: 'subscriptions',
        modalId: 'modal-subscription',
        entityName: 'Assinatura',
        fields: {
            studentId: 'subscription-student',
            planId: 'subscription-plan',
            startDate: 'subscription-start-date',
            renovationDate: 'subscription-renovation-date',
            status: 'subscription-status',
            paymentMethod: 'subscription-payment-method'
        },
        numericFields: {
            subscriptionValue: 'subscription-value'
        }
    },

    SCHEDULES: {
      id: 'schedule-id',
      path: 'schedules',
      modalId: 'modal-schedule',
      entityName: 'Agenda',
      
      fields: {
        title: 'schedule-title',
        category: 'schedule-category',  
        level: 'schedule-level',   
        description: 'schedule-description',   
        startTime: 'schedule-start',    
        endTime: 'schedule-end',   
        groupId: 'schedule-group',
      },
    
      numericFields: {
        dayOfWeek: 'schedule-day',  
        currentStudents: 'schedule-current-students',
      },
    
      booleanFields: {
        isHoliday: 'schedule-holiday',   
        isActive: 'schedule-active',
      }
    },
});

window.APP_CONFIG = APP_CONFIG;