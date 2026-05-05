import type { SessionTypeInfo, ScheduleSession, PlanId } from './types';

export const TYPES: Record<string, SessionTypeInfo> = {
  nogi:         { label: 'NoGi',            color: '#3b82f6' },
  gi:           { label: 'Gi',              color: '#a855f7' },
  wrestling:    { label: 'Wrestling',        color: '#ef4444' },
  judo:         { label: 'Judo',            color: '#ec4899' },
  strength:     { label: 'Fuerza',          color: '#f97316' },
  conditioning: { label: 'Acondicionamiento', color: '#eab308' },
  work:         { label: 'Trabajo',         color: '#475569' },
  commute:      { label: 'Commute',         color: '#64748b' },
  meal:         { label: 'Comida/Tareas',   color: '#0ea5e9' },
  rest:         { label: 'Descanso',        color: '#334155' },
  recovery:     { label: 'Recovery',        color: '#14b8a6' },
};

export const DAYS = [
  'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo',
] as const;

export type DayName = typeof DAYS[number];

// ─── Plan A ────────────────────────────────────────────────────────────────

const PLAN_A_SESSIONS: ScheduleSession[] = [
  // Lunes
  { id:'A-mon-commute1', plan:'A', day_name:'Lunes', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', location:'West End -> Cooper Plains', sort_order:1 },
  { id:'A-mon-work',     plan:'A', day_name:'Lunes', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', location:'76 Postle St, Cooper Plains', sort_order:2 },
  { id:'A-mon-commute2', plan:'A', day_name:'Lunes', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', location:'Cooper Plains -> Woolloongabba', note:'Lleva el Gi al trabajo.', sort_order:3 },
  { id:'A-mon-judo',     plan:'A', day_name:'Lunes', start:'17:30', end:'19:00', title:'Judo for BJJ (Gi)', type:'judo', location:'Arte Suave, Woolloongabba', note:'Gi #1 de la semana. Alternativa solapada: BJJ Fundamentals 17:40-19.', sort_order:4 },
  { id:'A-mon-nogi',     plan:'A', day_name:'Lunes', start:'19:00', end:'20:45', title:'NoGi Advanced (opcional)', type:'nogi', location:'Arte Suave', note:'OPCIONAL. Solo si tienes energia tras el Judo. Manana es dia doble, valora el descanso.', is_optional:true, sort_order:5 },
  { id:'A-mon-meal',     plan:'A', day_name:'Lunes', start:'21:00', end:'22:30', title:'Cena + tareas del hogar', type:'meal', sort_order:6 },
  { id:'A-mon-rest',     plan:'A', day_name:'Lunes', start:'22:30', end:'23:30', title:'Descanso', type:'rest', note:'Manana es dia doble (BJJ Fund + NoGi Advanced). Acuestate temprano.', sort_order:7 },

  // Martes
  { id:'A-tue-commute1', plan:'A', day_name:'Martes', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:1 },
  { id:'A-tue-work',     plan:'A', day_name:'Martes', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:2 },
  { id:'A-tue-commute2', plan:'A', day_name:'Martes', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', location:'Cooper Plains -> Woolloongabba', note:'DOBLE day. Lleva todo preparado (comida, ropa extra).', sort_order:3 },
  { id:'A-tue-fund',     plan:'A', day_name:'Martes', start:'17:40', end:'19:00', title:'BJJ Fundamentals (Gi)', type:'gi', location:'Arte Suave', note:'DOBLE sesion 1 - Gi #2 de la semana.', sort_order:4 },
  { id:'A-tue-nogi',     plan:'A', day_name:'Martes', start:'19:00', end:'20:45', title:'NoGi Advanced', type:'nogi', location:'Arte Suave', note:'DOBLE sesion 2.', sort_order:5 },
  { id:'A-tue-meal',     plan:'A', day_name:'Martes', start:'21:15', end:'22:15', title:'Cena (meal prep listo)', type:'meal', note:'Cena preparada del domingo. No cocinar hoy.', sort_order:6 },

  // Miercoles
  { id:'A-wed-strength', plan:'A', day_name:'Miercoles', start:'06:00', end:'07:00', title:'Fuerza 1h en casa', type:'strength', note:'Squat/Hinge/Push/Pull. Acuestate temprano el martes. Alternativa: NoGi Intermediate 6-7:30 en gym.', sort_order:1 },
  { id:'A-wed-commute1', plan:'A', day_name:'Miercoles', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:2 },
  { id:'A-wed-work',     plan:'A', day_name:'Miercoles', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:3 },
  { id:'A-wed-commute2', plan:'A', day_name:'Miercoles', start:'16:40', end:'17:40', title:'Bus a casa', type:'commute', note:'Hoy vas a casa a descansar antes del entreno.', sort_order:4 },
  { id:'A-wed-meal',     plan:'A', day_name:'Miercoles', start:'17:45', end:'18:45', title:'Comer + descansar', type:'meal', note:'Disponibles 17:40-19: NoGi Fundamentals o BJJ Advanced. Si te sientes bien, considera ir directo.', sort_order:5 },
  { id:'A-wed-nogi',     plan:'A', day_name:'Miercoles', start:'19:00', end:'20:45', title:'NoGi Advanced', type:'nogi', location:'Arte Suave', note:'Salir de casa en patin a las 18:48.', sort_order:6 },
  { id:'A-wed-meal2',    plan:'A', day_name:'Miercoles', start:'21:00', end:'22:00', title:'Cena ligera', type:'meal', sort_order:7 },

  // Jueves
  { id:'A-thu-commute1',   plan:'A', day_name:'Jueves', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:1 },
  { id:'A-thu-work',       plan:'A', day_name:'Jueves', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:2 },
  { id:'A-thu-commute2',   plan:'A', day_name:'Jueves', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', location:'Cooper Plains -> Woolloongabba', note:'DOBLE day clave. Lleva snack para entre sesiones.', sort_order:3 },
  { id:'A-thu-nogi-int',   plan:'A', day_name:'Jueves', start:'17:40', end:'19:00', title:'NoGi Intermediate', type:'nogi', location:'Arte Suave', note:'DOBLE sesion 1. Alternativa solapada: BJJ Fundamentals 17:40-19.', sort_order:4 },
  { id:'A-thu-wrestling',  plan:'A', day_name:'Jueves', start:'19:00', end:'20:45', title:'Wrestling (alt NoGi/Gi)', type:'wrestling', location:'Arte Suave', note:'DOBLE sesion 2. Alternativa solapada: BJJ Advanced 19-20:30.', sort_order:5 },
  { id:'A-thu-meal',       plan:'A', day_name:'Jueves', start:'21:30', end:'22:30', title:'Cena (meal prep listo)', type:'meal', note:'Cena preparada del domingo. No cocinar hoy.', sort_order:6 },

  // Viernes
  { id:'A-fri-cond',     plan:'A', day_name:'Viernes', start:'06:00', end:'06:20', title:'Acondicionamiento 20min', type:'conditioning', note:'HIIT corto, intervalos, kettlebell. Manana hay fuerza + mat.', sort_order:1 },
  { id:'A-fri-commute1', plan:'A', day_name:'Viernes', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:2 },
  { id:'A-fri-work',     plan:'A', day_name:'Viernes', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:3 },
  { id:'A-fri-commute2', plan:'A', day_name:'Viernes', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', location:'Cooper Plains -> Woolloongabba', note:'Hoy solo 1 sesion. Llegas relajado.', sort_order:4 },
  { id:'A-fri-fund',     plan:'A', day_name:'Viernes', start:'17:40', end:'19:00', title:'BJJ Fundamentals (Gi, opcional)', type:'gi', location:'Arte Suave', note:'OPCIONAL. Gi extra si vienes bien del doble de jueves. Si estas cansado, ve directo a casa y descansa hasta el NoGi Advanced.', is_optional:true, sort_order:5 },
  { id:'A-fri-nogi',     plan:'A', day_name:'Viernes', start:'19:00', end:'20:45', title:'NoGi Advanced comp', type:'nogi', location:'Arte Suave', note:'FIJO. Sesion de competicion. Salir de casa en patin a las 18:48 si no haces BJJ Fund antes.', sort_order:6 },
  { id:'A-fri-meal',     plan:'A', day_name:'Viernes', start:'21:00', end:'22:30', title:'Cena + prep fin de semana', type:'meal', sort_order:7 },

  // Sabado
  { id:'A-sat-strength', plan:'A', day_name:'Sabado', start:'09:00', end:'10:00', title:'Fuerza 1h', type:'strength', sort_order:1 },
  { id:'A-sat-cond',     plan:'A', day_name:'Sabado', start:'10:15', end:'10:35', title:'Acondicionamiento 20min', type:'conditioning', note:'Como finisher de la fuerza.', sort_order:2 },
  { id:'A-sat-open',     plan:'A', day_name:'Sabado', start:'12:00', end:'13:00', title:'Open Mat', type:'gi', location:'Arte Suave', sort_order:3 },
  { id:'A-sat-recovery', plan:'A', day_name:'Sabado', start:'15:00', end:'17:00', title:'Recovery (estiramiento, sauna, paseo)', type:'recovery', sort_order:4 },

  // Domingo
  { id:'A-sun-pos',      plan:'A', day_name:'Domingo', start:'09:00', end:'10:00', title:'Positional (opcional, alt NoGi/Gi)', type:'nogi', location:'Arte Suave', note:'OPCIONAL. Tipo varia segun semana.', is_optional:true, sort_order:1 },
  { id:'A-sun-open',     plan:'A', day_name:'Domingo', start:'10:00', end:'11:00', title:'Open Mat (opcional)', type:'nogi', location:'Arte Suave', note:'OPCIONAL.', is_optional:true, sort_order:2 },
  { id:'A-sun-meal',     plan:'A', day_name:'Domingo', start:'14:00', end:'17:00', title:'Meal prep semana', type:'meal', note:'Cocinar comidas Lun-Jue. Esencial para los dias de doble.', sort_order:3 },
  { id:'A-sun-recovery', plan:'A', day_name:'Domingo', start:'17:30', end:'19:00', title:'Recovery + estiramiento', type:'recovery', sort_order:4 },
];

// ─── Plan B ────────────────────────────────────────────────────────────────

const PLAN_B_SESSIONS: ScheduleSession[] = [
  // Lunes
  { id:'B-mon-commute1', plan:'B', day_name:'Lunes', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:1 },
  { id:'B-mon-work',     plan:'B', day_name:'Lunes', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:2 },
  { id:'B-mon-commute2', plan:'B', day_name:'Lunes', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', location:'Cooper Plains -> Woolloongabba', note:'Sin Judo hoy (caidas). BJJ Fundamentals en su lugar.', sort_order:3 },
  { id:'B-mon-fund',     plan:'B', day_name:'Lunes', start:'17:40', end:'19:00', title:'BJJ Fundamentals (Gi, sin sparring)', type:'gi', location:'Arte Suave', note:'Avisa al instructor de la lesion de menisco. Solo drilling tecnico, SIN rolls ni caidas.', sort_order:4 },
  { id:'B-mon-rest',     plan:'B', day_name:'Lunes', start:'19:30', end:'22:00', title:'Cena + tareas del hogar', type:'meal', sort_order:5 },

  // Martes
  { id:'B-tue-commute1', plan:'B', day_name:'Martes', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:1 },
  { id:'B-tue-work',     plan:'B', day_name:'Martes', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:2 },
  { id:'B-tue-commute2', plan:'B', day_name:'Martes', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', location:'Cooper Plains -> Woolloongabba', sort_order:3 },
  { id:'B-tue-fund',     plan:'B', day_name:'Martes', start:'17:40', end:'19:00', title:'BJJ Fundamentals (Gi, sin sparring)', type:'gi', location:'Arte Suave', note:'Avisa al instructor. SIN NoGi Advanced despues (sin dobles en lesion).', sort_order:4 },
  { id:'B-tue-meal',     plan:'B', day_name:'Martes', start:'19:30', end:'21:00', title:'Cena + descanso', type:'meal', sort_order:5 },

  // Miercoles
  { id:'B-wed-upper',    plan:'B', day_name:'Miercoles', start:'06:00', end:'07:00', title:'Tren superior 1h', type:'strength', note:'Pull-ups, press, remo, curls. CERO sentadilla. Peso muerto solo si no carga la rodilla.', sort_order:1 },
  { id:'B-wed-commute1', plan:'B', day_name:'Miercoles', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:2 },
  { id:'B-wed-work',     plan:'B', day_name:'Miercoles', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:3 },
  { id:'B-wed-commute2', plan:'B', day_name:'Miercoles', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', sort_order:4 },
  { id:'B-wed-fund',     plan:'B', day_name:'Miercoles', start:'17:40', end:'19:00', title:'NoGi Fundamentals (sin sparring)', type:'nogi', location:'Arte Suave', note:'Clase disponible 17:40-19:00. Trabajo de guard/upper sin bridges ni shrimps fuertes.', sort_order:5 },
  { id:'B-wed-meal',     plan:'B', day_name:'Miercoles', start:'19:30', end:'21:00', title:'Cena', type:'meal', sort_order:6 },

  // Jueves
  { id:'B-thu-commute1', plan:'B', day_name:'Jueves', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:1 },
  { id:'B-thu-work',     plan:'B', day_name:'Jueves', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:2 },
  { id:'B-thu-commute2', plan:'B', day_name:'Jueves', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', sort_order:3 },
  { id:'B-thu-fund',     plan:'B', day_name:'Jueves', start:'17:40', end:'19:00', title:'BJJ Fundamentals (Gi, sin sparring)', type:'gi', location:'Arte Suave', note:'Saltar Wrestling 19:00-20:45. Solo una sesion hoy.', sort_order:4 },
  { id:'B-thu-meal',     plan:'B', day_name:'Jueves', start:'19:30', end:'21:00', title:'Cena + descanso', type:'meal', sort_order:5 },

  // Viernes
  { id:'B-fri-cardio',   plan:'B', day_name:'Viernes', start:'06:00', end:'06:30', title:'Cardio bajo impacto 30min', type:'conditioning', note:'Bici estatica o eliptica. Mantener fitness cardiovascular sin cargar rodilla.', sort_order:1 },
  { id:'B-fri-commute1', plan:'B', day_name:'Viernes', start:'07:10', end:'08:13', title:'Bus al trabajo', type:'commute', sort_order:2 },
  { id:'B-fri-work',     plan:'B', day_name:'Viernes', start:'08:13', end:'16:30', title:'Trabajo POSWorks', type:'work', sort_order:3 },
  { id:'B-fri-commute2', plan:'B', day_name:'Viernes', start:'16:40', end:'17:30', title:'Bus directo al gym', type:'commute', location:'Cooper Plains -> Woolloongabba', sort_order:4 },
  { id:'B-fri-fund',     plan:'B', day_name:'Viernes', start:'17:40', end:'19:00', title:'BJJ Fundamentals (Gi, sin sparring)', type:'gi', location:'Arte Suave', note:'Avisa al instructor de la lesion. Solo drilling tecnico, SIN rolls.', sort_order:5 },
  { id:'B-fri-meal',     plan:'B', day_name:'Viernes', start:'19:30', end:'21:00', title:'Cena + descanso', type:'meal', note:'Hielo/elevacion si hay inflamacion tras el entreno.', sort_order:6 },

  // Sabado
  { id:'B-sat-upper',    plan:'B', day_name:'Sabado', start:'09:00', end:'10:00', title:'Tren superior 1h', type:'strength', note:'Pull-ups, press, remo, curls. Sin sentadilla ni ejercicios que carguen rodilla.', sort_order:1 },
  { id:'B-sat-fund',     plan:'B', day_name:'Sabado', start:'10:45', end:'11:45', title:'BJJ Fundamentals (Gi, sin sparring)', type:'gi', location:'Arte Suave', note:'SIN Open Mat despues para evitar rolls.', sort_order:2 },
  { id:'B-sat-recovery', plan:'B', day_name:'Sabado', start:'13:00', end:'15:00', title:'Recovery: estiramiento, hielo, paseo suave', type:'recovery', sort_order:3 },

  // Domingo
  { id:'B-sun-cardio',   plan:'B', day_name:'Domingo', start:'08:30', end:'09:00', title:'Cardio bajo impacto opcional', type:'conditioning', note:'Solo si la rodilla esta bien.', is_optional:true, sort_order:1 },
  { id:'B-sun-open',     plan:'B', day_name:'Domingo', start:'10:00', end:'11:00', title:'Open Mat ligero (tecnico)', type:'nogi', location:'Arte Suave', note:'Solo con companeros de confianza. Sin posiciones que carguen la rodilla.', sort_order:2 },
  { id:'B-sun-meal',     plan:'B', day_name:'Domingo', start:'14:00', end:'17:00', title:'Meal prep semana', type:'meal', sort_order:3 },
  { id:'B-sun-recovery', plan:'B', day_name:'Domingo', start:'17:30', end:'19:00', title:'Recovery + movilidad rodilla', type:'recovery', note:'Ejercicios de rehabilitacion: cuadriceps, isquios suaves, movilidad de rodilla.', sort_order:4 },
];

export const ALL_SESSIONS: ScheduleSession[] = [
  ...PLAN_A_SESSIONS,
  ...PLAN_B_SESSIONS,
];

export function getSessionsByPlan(plan: PlanId): Record<string, ScheduleSession[]> {
  const sessions = ALL_SESSIONS.filter((s) => s.plan === plan);
  return DAYS.reduce<Record<string, ScheduleSession[]>>((acc, day) => {
    acc[day] = sessions
      .filter((s) => s.day_name === day)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return acc;
  }, {});
}
