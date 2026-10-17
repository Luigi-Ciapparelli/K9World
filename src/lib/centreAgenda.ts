import { teamError } from './centreTeam';
export type AgendaLesson = {
 id:string;start_at:string;end_at:string;status:'accepted'|'completed';service_name:string;
 client_name:string;dog_names:string[];instructor_id:string|null;instructor_name:string|null;
 assignment_version:string|null;can_assign:boolean;managed_by_centre:boolean;
 outside_shift:boolean;instructor_unavailable:boolean;overlap_confirmed:boolean;assigned_by:string|null;
};
export type DelegatedAgenda = {
 centre_name:string;membership_version:string;day:string;page:number;total:number;
 items:AgendaLesson[];members:{id:string;name:string}[];
};
export function agendaError(error:unknown){
 const code=(error as {code?:string})?.code;
 if(code==='42501')return 'Accesso all’agenda non disponibile. Il centro potrebbe aver revocato il permesso o il collegamento.';
 if(code==='PCA01')return 'Le tue lezioni e le tue prenotazioni devono essere assegnate dal centro.';
 return teamError(error);
}
