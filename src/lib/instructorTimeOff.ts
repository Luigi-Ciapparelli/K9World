export type InstructorAbsence = {
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
};

export function absenceTimeLabel(period: InstructorAbsence) {
  return period.start_time && period.end_time
    ? `Dalle ${period.start_time.slice(0, 5)} alle ${period.end_time.slice(0, 5)} · ora italiana`
    : 'Intera giornata';
}
