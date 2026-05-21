export interface ScheduleDTO {
  title: string;
  category: string;
  level:
     | "Iniciante"
     | "Intermediário"
     | "Avançado";
  description?: string;

  dayOfWeek: number;
  startTime: string;
  endTime: string;

  currentStudents: number;
  isHoliday: boolean;
  isActive: boolean;

  groupId: string;
}