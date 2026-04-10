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
            schedule: 'group-schedule'
        },
        checkboxes: {
            isActive: 'group-active'
        }
    }
});

window.APP_CONFIG = APP_CONFIG;