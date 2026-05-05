/**
 * Datos del schedule semanal.
 * Edita libremente las sesiones. Cada sesion tiene:
 *   - id: identificador unico (usado para guardar status y notas)
 *   - start, end: horas en formato "HH:MM"
 *   - title: nombre de la actividad
 *   - type: uno de los TYPES (define color)
 *   - location: opcional, donde sucede
 *   - note: opcional, contexto/recordatorio
 *
 * Tipos disponibles: nogi, gi, wrestling, judo, strength, conditioning,
 *                    work, commute, meal, rest, recovery
 */

const TYPES = {
  nogi: { label: 'NoGi', color: '#3b82f6' },
  gi: { label: 'Gi', color: '#a855f7' },
  wrestling: { label: 'Wrestling', color: '#ef4444' },
  judo: { label: 'Judo', color: '#ec4899' },
  strength: { label: 'Fuerza', color: '#f97316' },
  conditioning: { label: 'Acondicionamiento', color: '#eab308' },
  work: { label: 'Trabajo', color: '#475569' },
  commute: { label: 'Comute', color: '#64748b' },
  meal: { label: 'Comida/Tareas', color: '#0ea5e9' },
  rest: { label: 'Descanso', color: '#334155' },
  recovery: { label: 'Recovery', color: '#14b8a6' },
};

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

/* ============================================================
 * PLAN A - Semana saludable
 *
 * Clases disponibles en Arte Suave (28 Wellington Rd, Woolloongabba):
 *   Lunes:     06:00-07:30 NoGi Intermediate
 *              17:30-19:00 Judo for BJJ
 *              17:40-19:00 BJJ Fundamentals  <- solapa con Judo
 *              19:00-20:45 NoGi Advanced
 *   Martes:    17:40-19:00 BJJ Fundamentals
 *              19:00-20:45 NoGi Advanced
 *   Miercoles: 06:00-07:30 NoGi Intermediate
 *              17:40-19:00 NoGi Fundamentals
 *              17:40-19:00 BJJ Advanced      <- solapa con NoGi Fund
 *              19:00-20:45 NoGi Advanced
 *   Jueves:    17:40-19:00 NoGi Intermediate
 *              17:40-19:00 BJJ Fundamentals  <- solapa con NoGi Int
 *              19:00-20:45 Wrestling (alt NoGi/Gi)
 *              19:00-20:30 BJJ Advanced      <- solapa con Wrestling
 *   Viernes:   17:40-19:00 BJJ Fundamentals
 *              19:00-20:45 NoGi Advanced
 *   Sabado:    10:45-11:45 BJJ Fundamentals
 *              12:00-13:00 Open Mat
 *   Domingo:   09:00-10:00 Positional (alt NoGi/Gi)
 *              10:00-11:00 Open Mat
 *
 * Comute casa->gym directo desde trabajo: ~17:30 llegada
 * Comute casa->gym desde casa: patin 12min (salir 18:48 para clase 19:00)
 *
 * Plan elegido:
 *   Dobles: Martes (BJJ Fund + NoGi Adv) + Jueves (NoGi Int + Wrestling)
 *   Gi garantizado: Lun Judo + Mar BJJ Fund + Sab BJJ Fund = minimo 3
 *   NoGi: Mar + Mie + Jue(x2) + Vie + Dom = 5-6
 *   Fuerza: Mie 6am + Sab 9am
 *   Acondicionamiento: Vie 6am + Sab 10:15
 * ============================================================ */
const PLAN_A = {
  Lunes: [
    { id: 'A-mon-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute', location: 'West End -> Cooper Plains' },
    { id: 'A-mon-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work', location: '76 Postle St, Cooper Plains' },
    { id: 'A-mon-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute', location: 'Cooper Plains -> Woolloongabba', note: 'Lleva el Gi al trabajo.' },
    { id: 'A-mon-judo', start: '17:30', end: '19:00', title: 'Judo for BJJ (Gi)', type: 'judo', location: 'Arte Suave, Woolloongabba', note: 'Gi #1 de la semana. Alternativa solapada: BJJ Fundamentals 17:40-19.' },
    { id: 'A-mon-nogi', start: '19:00', end: '20:45', title: 'NoGi Advanced (opcional)', type: 'nogi', location: 'Arte Suave', note: 'OPCIONAL. Solo si tienes energia tras el Judo. Manana es dia doble, valora el descanso.' },
    { id: 'A-mon-meal', start: '21:00', end: '22:30', title: 'Cena + tareas del hogar', type: 'meal' },
    { id: 'A-mon-rest', start: '22:30', end: '23:30', title: 'Descanso', type: 'rest', note: 'Manana es dia doble (BJJ Fund + NoGi Advanced). Acuestate temprano.' },
  ],
  Martes: [
    { id: 'A-tue-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'A-tue-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'A-tue-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute', location: 'Cooper Plains -> Woolloongabba', note: 'DOBLE day. Lleva todo preparado (comida, ropa extra).' },
    { id: 'A-tue-fund', start: '17:40', end: '19:00', title: 'BJJ Fundamentals (Gi)', type: 'gi', location: 'Arte Suave', note: 'DOBLE sesion 1 - Gi #2 de la semana.' },
    { id: 'A-tue-nogi', start: '19:00', end: '20:45', title: 'NoGi Advanced', type: 'nogi', location: 'Arte Suave', note: 'DOBLE sesion 2.' },
    { id: 'A-tue-meal', start: '21:15', end: '22:15', title: 'Cena (meal prep listo)', type: 'meal', note: 'Cena preparada del domingo. No cocinar hoy.' },
  ],
  Miercoles: [
    { id: 'A-wed-strength', start: '06:00', end: '07:00', title: 'Fuerza 1h en casa', type: 'strength', note: 'Squat/Hinge/Push/Pull. Acuestate temprano el martes. Alternativa: NoGi Intermediate 6-7:30 en gym.' },
    { id: 'A-wed-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'A-wed-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'A-wed-commute2', start: '16:40', end: '17:40', title: 'Bus a casa', type: 'commute', note: 'Hoy vas a casa a descansar antes del entreno.' },
    { id: 'A-wed-meal', start: '17:45', end: '18:45', title: 'Comer + descansar', type: 'meal', note: 'Disponibles 17:40-19: NoGi Fundamentals o BJJ Advanced. Si te sientes bien, considera ir directo.' },
    { id: 'A-wed-nogi', start: '19:00', end: '20:45', title: 'NoGi Advanced', type: 'nogi', location: 'Arte Suave', note: 'Salir de casa en patin a las 18:48.' },
    { id: 'A-wed-meal2', start: '21:00', end: '22:00', title: 'Cena ligera', type: 'meal' },
  ],
  Jueves: [
    { id: 'A-thu-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'A-thu-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'A-thu-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute', location: 'Cooper Plains -> Woolloongabba', note: 'DOBLE day clave. Lleva snack para entre sesiones.' },
    { id: 'A-thu-nogi-int', start: '17:40', end: '19:00', title: 'NoGi Intermediate', type: 'nogi', location: 'Arte Suave', note: 'DOBLE sesion 1. Alternativa solapada: BJJ Fundamentals 17:40-19.' },
    { id: 'A-thu-wrestling', start: '19:00', end: '20:45', title: 'Wrestling (alt NoGi/Gi)', type: 'wrestling', location: 'Arte Suave', note: 'DOBLE sesion 2. Alternativa solapada: BJJ Advanced 19-20:30.' },
    { id: 'A-thu-meal', start: '21:30', end: '22:30', title: 'Cena (meal prep listo)', type: 'meal', note: 'Cena preparada del domingo. No cocinar hoy.' },
  ],
  Viernes: [
    { id: 'A-fri-cond', start: '06:00', end: '06:20', title: 'Acondicionamiento 20min', type: 'conditioning', note: 'HIIT corto, intervalos, kettlebell. Manana hay fuerza + mat.' },
    { id: 'A-fri-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'A-fri-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'A-fri-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute', location: 'Cooper Plains -> Woolloongabba', note: 'Hoy solo 1 sesion. Llegas relajado.' },
    { id: 'A-fri-fund', start: '17:40', end: '19:00', title: 'BJJ Fundamentals (Gi, opcional)', type: 'gi', location: 'Arte Suave', note: 'OPCIONAL. Gi extra si vienes bien del doble de jueves. Si estas cansado, ve directo a casa y descansa hasta el NoGi Advanced.' },
    { id: 'A-fri-nogi', start: '19:00', end: '20:45', title: 'NoGi Advanced comp', type: 'nogi', location: 'Arte Suave', note: 'FIJO. Sesion de competicion. Salir de casa en patin a las 18:48 si no haces BJJ Fund antes.' },
    { id: 'A-fri-meal', start: '21:00', end: '22:30', title: 'Cena + prep fin de semana', type: 'meal' },
  ],
  Sabado: [
    { id: 'A-sat-strength', start: '09:00', end: '10:00', title: 'Fuerza 1h', type: 'strength' },
    { id: 'A-sat-cond', start: '10:15', end: '10:35', title: 'Acondicionamiento 20min', type: 'conditioning', note: 'Como finisher de la fuerza.' },
    { id: 'A-sat-open', start: '12:00', end: '13:00', title: 'Open Mat', type: 'gi', location: 'Arte Suave' },
    { id: 'A-sat-recovery', start: '15:00', end: '17:00', title: 'Recovery (estiramiento, sauna, paseo)', type: 'recovery' },
  ],
  Domingo: [
    { id: 'A-sun-pos', start: '09:00', end: '10:00', title: 'Positional (opcional, alt NoGi/Gi)', type: 'nogi', location: 'Arte Suave', note: 'OPCIONAL. Tipo varia segun semana.' },
    { id: 'A-sun-open', start: '10:00', end: '11:00', title: 'Open Mat (opcional)', type: 'nogi', location: 'Arte Suave', note: 'OPCIONAL.' },
    { id: 'A-sun-meal', start: '14:00', end: '17:00', title: 'Meal prep semana', type: 'meal', note: 'Cocinar comidas Lun-Jue. Esencial para los dias de doble.' },
    { id: 'A-sun-recovery', start: '17:30', end: '19:00', title: 'Recovery + estiramiento', type: 'recovery' },
  ],
};

/* ============================================================
 * PLAN B - Lesion menisco
 * Solo Fundamentals + tren superior + cardio bajo impacto.
 * Sin Judo (caidas y barridos), sin Wrestling, sin Advanced/sparring.
 * Horarios de clases identicos al Plan A - solo cambia cuales se usan.
 * ============================================================ */
const PLAN_B = {
  Lunes: [
    { id: 'B-mon-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'B-mon-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'B-mon-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute', location: 'Cooper Plains -> Woolloongabba', note: 'Sin Judo hoy (caidas). BJJ Fundamentals en su lugar.' },
    { id: 'B-mon-fund', start: '17:40', end: '19:00', title: 'BJJ Fundamentals (Gi, sin sparring)', type: 'gi', location: 'Arte Suave', note: 'Avisa al instructor de la lesion de menisco. Solo drilling tecnico, SIN rolls ni caidas.' },
    { id: 'B-mon-rest', start: '19:30', end: '22:00', title: 'Cena + tareas del hogar', type: 'meal' },
  ],
  Martes: [
    { id: 'B-tue-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'B-tue-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'B-tue-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute', location: 'Cooper Plains -> Woolloongabba' },
    { id: 'B-tue-fund', start: '17:40', end: '19:00', title: 'BJJ Fundamentals (Gi, sin sparring)', type: 'gi', location: 'Arte Suave', note: 'Avisa al instructor. SIN NoGi Advanced despues (sin dobles en lesion).' },
    { id: 'B-tue-meal', start: '19:30', end: '21:00', title: 'Cena + descanso', type: 'meal' },
  ],
  Miercoles: [
    { id: 'B-wed-upper', start: '06:00', end: '07:00', title: 'Tren superior 1h', type: 'strength', note: 'Pull-ups, press, remo, curls. CERO sentadilla. Peso muerto solo si no carga la rodilla.' },
    { id: 'B-wed-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'B-wed-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'B-wed-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute' },
    { id: 'B-wed-fund', start: '17:40', end: '19:00', title: 'NoGi Fundamentals (sin sparring)', type: 'nogi', location: 'Arte Suave', note: 'Clase disponible 17:40-19:00. Trabajo de guard/upper sin bridges ni shrimps fuertes.' },
    { id: 'B-wed-meal', start: '19:30', end: '21:00', title: 'Cena', type: 'meal' },
  ],
  Jueves: [
    { id: 'B-thu-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'B-thu-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'B-thu-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute' },
    { id: 'B-thu-fund', start: '17:40', end: '19:00', title: 'BJJ Fundamentals (Gi, sin sparring)', type: 'gi', location: 'Arte Suave', note: 'Saltar Wrestling 19:00-20:45. Solo una sesion hoy.' },
    { id: 'B-thu-meal', start: '19:30', end: '21:00', title: 'Cena + descanso', type: 'meal' },
  ],
  Viernes: [
    { id: 'B-fri-cardio', start: '06:00', end: '06:30', title: 'Cardio bajo impacto 30min', type: 'conditioning', note: 'Bici estatica o eliptica. Mantener fitness cardiovascular sin cargar rodilla.' },
    { id: 'B-fri-commute1', start: '07:10', end: '08:13', title: 'Bus al trabajo', type: 'commute' },
    { id: 'B-fri-work', start: '08:13', end: '16:30', title: 'Trabajo POSWorks', type: 'work' },
    { id: 'B-fri-commute2', start: '16:40', end: '17:30', title: 'Bus directo al gym', type: 'commute', location: 'Cooper Plains -> Woolloongabba' },
    { id: 'B-fri-fund', start: '17:40', end: '19:00', title: 'BJJ Fundamentals (Gi, sin sparring)', type: 'gi', location: 'Arte Suave', note: 'Avisa al instructor de la lesion. Solo drilling tecnico, SIN rolls.' },
    { id: 'B-fri-meal', start: '19:30', end: '21:00', title: 'Cena + descanso', type: 'meal', note: 'Hielo/elevacion si hay inflamacion tras el entreno.' },
  ],
  Sabado: [
    { id: 'B-sat-upper', start: '09:00', end: '10:00', title: 'Tren superior 1h', type: 'strength', note: 'Pull-ups, press, remo, curls. Sin sentadilla ni ejercicios que carguen rodilla.' },
    { id: 'B-sat-fund', start: '10:45', end: '11:45', title: 'BJJ Fundamentals (Gi, sin sparring)', type: 'gi', location: 'Arte Suave', note: 'SIN Open Mat despues para evitar rolls.' },
    { id: 'B-sat-recovery', start: '13:00', end: '15:00', title: 'Recovery: estiramiento, hielo, paseo suave', type: 'recovery' },
  ],
  Domingo: [
    { id: 'B-sun-cardio', start: '08:30', end: '09:00', title: 'Cardio bajo impacto opcional', type: 'conditioning', note: 'Solo si la rodilla esta bien.' },
    { id: 'B-sun-open', start: '10:00', end: '11:00', title: 'Open Mat ligero (tecnico)', type: 'nogi', location: 'Arte Suave', note: 'Solo con companeros de confianza. Sin posiciones que carguen la rodilla.' },
    { id: 'B-sun-meal', start: '14:00', end: '17:00', title: 'Meal prep semana', type: 'meal' },
    { id: 'B-sun-recovery', start: '17:30', end: '19:00', title: 'Recovery + movilidad rodilla', type: 'recovery', note: 'Ejercicios de rehabilitacion: cuadriceps, isquios suaves, movilidad de rodilla.' },
  ],
};

const PLANS = {
  A: { name: 'Plan A - Saludable', schedule: PLAN_A },
  B: { name: 'Plan B - Lesion (menisco)', schedule: PLAN_B },
};
