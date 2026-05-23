export const LEVELS = ["Iniciante", "Intermediário", "Avançado"] as const;
export type LevelCategory = (typeof LEVELS)[number];

export interface ScheduleDTO {
  title: string;
  category: string;
  level: LevelCategory;
  description?: string;
  dayAndMonth: string;
  startTime: string;
  endTime: string;
  currentStudents: number;
  isHoliday: boolean;
  isActive: boolean;
  groupId: string;
}
