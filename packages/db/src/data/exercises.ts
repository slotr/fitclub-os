export type SeedExercise = {
  slug: string;
  name: string;
  primaryMuscle:
    | "chest"
    | "back"
    | "shoulders"
    | "biceps"
    | "triceps"
    | "legs"
    | "glutes"
    | "core"
    | "fullBody";
  equipment:
    | "barbell"
    | "dumbbell"
    | "machine"
    | "cable"
    | "bodyweight"
    | "kettlebell"
    | "band"
    | "other";
  metric: "weight_reps" | "reps_only" | "time";
  defaultRestSec: number;
  instructions: string;
};

export const SEED_EXERCISES: SeedExercise[] = [
  // ─── CHEST (11) ──────────────────────────────────────────────────────────────
  {
    slug: "barbell-bench-press",
    name: "Barbell Bench Press",
    primaryMuscle: "chest",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Lie on the bench, grip the bar slightly wider than shoulders. " +
      "Lower to mid-chest, then press straight up until arms lock out.",
  },
  {
    slug: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    primaryMuscle: "chest",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Set the bench to 30 degrees. Press both dumbbells from chest " +
      "level to lockout, keeping wrists stacked over elbows.",
  },
  {
    slug: "decline-barbell-press",
    name: "Decline Barbell Press",
    primaryMuscle: "chest",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Set the bench to a 15–30 degree decline and secure your feet. " +
      "Lower the bar to the lower chest and press back to lockout.",
  },
  {
    slug: "flat-dumbbell-press",
    name: "Flat Dumbbell Press",
    primaryMuscle: "chest",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Lie flat, hold dumbbells at chest level with palms forward. " +
      "Press to full lockout, then lower slowly with control.",
  },
  {
    slug: "cable-fly",
    name: "Cable Fly",
    primaryMuscle: "chest",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Set cables at chest height. Lean slightly forward, sweep arms " +
      "together in a wide arc, and squeeze the chest at the centre.",
  },
  {
    slug: "incline-cable-fly",
    name: "Incline Cable Fly",
    primaryMuscle: "chest",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Set cables low and sit on an incline bench. Pull the handles " +
      "up and together in an arc, focusing on the upper chest contraction.",
  },
  {
    slug: "chest-press-machine",
    name: "Chest Press Machine",
    primaryMuscle: "chest",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Adjust the seat so handles align with mid-chest. Press forward " +
      "to full extension, then return slowly without letting the stack touch.",
  },
  {
    slug: "pec-deck-fly",
    name: "Pec Deck Fly",
    primaryMuscle: "chest",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Sit upright with forearms against the pads. Squeeze the arms " +
      "together until the pads nearly touch, then open slowly.",
  },
  {
    slug: "push-up",
    name: "Push-up",
    primaryMuscle: "chest",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Start in a high plank with hands just outside shoulder width. " +
      "Lower the chest to the floor, then press back up to full arm extension.",
  },
  {
    slug: "dumbbell-pullover",
    name: "Dumbbell Pullover",
    primaryMuscle: "chest",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Lie across a bench with shoulders supported. Hold one dumbbell " +
      "overhead with both hands, lower behind the head, then pull back over the chest.",
  },
  {
    slug: "dips-chest",
    name: "Chest Dip",
    primaryMuscle: "chest",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 90,
    instructions:
      "Lean forward at about 30 degrees on parallel bars. Lower until " +
      "elbows reach 90 degrees, then press back up without fully locking out.",
  },

  // ─── BACK (12) ───────────────────────────────────────────────────────────────
  {
    slug: "pull-up",
    name: "Pull-up",
    primaryMuscle: "back",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 120,
    instructions:
      "Hang from the bar with an overhand grip. Pull until the chin " +
      "clears the bar, then lower under control to a full hang.",
  },
  {
    slug: "barbell-bent-over-row",
    name: "Barbell Bent-Over Row",
    primaryMuscle: "back",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Hinge to about 45 degrees with a neutral spine. Pull the bar " +
      "to your lower ribcage, driving elbows back, then lower under control.",
  },
  {
    slug: "dumbbell-single-arm-row",
    name: "Dumbbell Single-Arm Row",
    primaryMuscle: "back",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Place one knee and hand on a bench for support. Row the dumbbell " +
      "to hip level, leading with the elbow, then lower with a full stretch.",
  },
  {
    slug: "lat-pulldown",
    name: "Lat Pulldown",
    primaryMuscle: "back",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Grip the bar slightly wider than shoulders with an overhand grip. " +
      "Pull to the upper chest while keeping the torso upright, then return slowly.",
  },
  {
    slug: "seated-cable-row",
    name: "Seated Cable Row",
    primaryMuscle: "back",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Sit upright with knees slightly bent. Pull the handle to your " +
      "lower abdomen, squeezing the shoulder blades together, then extend fully.",
  },
  {
    slug: "t-bar-row",
    name: "T-Bar Row",
    primaryMuscle: "back",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Straddle the bar in a hinged position. Pull the bar to your " +
      "chest by driving elbows back, keeping the spine neutral throughout.",
  },
  {
    slug: "chest-supported-row",
    name: "Chest-Supported Dumbbell Row",
    primaryMuscle: "back",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Lie prone on a 45-degree incline bench. Row both dumbbells " +
      "simultaneously to hip level, squeezing the shoulder blades at the top.",
  },
  {
    slug: "machine-row",
    name: "Machine Row",
    primaryMuscle: "back",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Set the chest pad so you can reach the handles comfortably. " +
      "Pull the handles back until your elbows pass your torso, then return slowly.",
  },
  {
    slug: "chin-up",
    name: "Chin-up",
    primaryMuscle: "back",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 120,
    instructions:
      "Hang with a supinated (underhand) grip, hands shoulder-width apart. " +
      "Pull until your chin clears the bar, then lower to a full dead hang.",
  },
  {
    slug: "straight-arm-pulldown",
    name: "Straight-Arm Pulldown",
    primaryMuscle: "back",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Stand at a high pulley with arms extended overhead. Keep a slight " +
      "bend in the elbows and sweep the bar down to your hips, squeezing the lats.",
  },
  {
    slug: "deadlift",
    name: "Deadlift",
    primaryMuscle: "back",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Stand with mid-foot under the bar. Hinge, grip just outside " +
      "your legs, brace the core, then drive through the floor while " +
      "keeping the bar close to the body until you stand tall.",
  },
  {
    slug: "face-pull",
    name: "Face Pull",
    primaryMuscle: "back",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Set the cable at face height with a rope attachment. Pull the " +
      "rope to your face with elbows flared high, externally rotating at the end.",
  },

  // ─── SHOULDERS (11) ──────────────────────────────────────────────────────────
  {
    slug: "barbell-overhead-press",
    name: "Barbell Overhead Press",
    primaryMuscle: "shoulders",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Stand with bar on the front of the shoulders. Press overhead " +
      "to full lockout while tucking the chin, then lower back to the clavicle.",
  },
  {
    slug: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    primaryMuscle: "shoulders",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Sit upright on a bench with back support. Press both dumbbells " +
      "from ear height to full lockout overhead, then lower with control.",
  },
  {
    slug: "dumbbell-lateral-raise",
    name: "Dumbbell Lateral Raise",
    primaryMuscle: "shoulders",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Stand with dumbbells at your sides. Raise both arms out to " +
      "shoulder height with a slight forward lean and a pinky-high tilt, " +
      "then lower slowly.",
  },
  {
    slug: "cable-lateral-raise",
    name: "Cable Lateral Raise",
    primaryMuscle: "shoulders",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Stand beside a low pulley. Pull the cable across and up to " +
      "shoulder height in a wide arc, keeping the arm slightly in front of the body.",
  },
  {
    slug: "dumbbell-front-raise",
    name: "Dumbbell Front Raise",
    primaryMuscle: "shoulders",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Hold dumbbells in front of thighs. Raise one or both arms " +
      "straight to shoulder height with a controlled tempo, then lower.",
  },
  {
    slug: "arnold-press",
    name: "Arnold Press",
    primaryMuscle: "shoulders",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Start with dumbbells at chin height, palms facing you. Rotate " +
      "palms outward as you press to full lockout overhead, then reverse on the way down.",
  },
  {
    slug: "machine-shoulder-press",
    name: "Machine Shoulder Press",
    primaryMuscle: "shoulders",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Adjust the seat so handles are at ear height. Press overhead " +
      "to full extension without arching excessively, then return slowly.",
  },
  {
    slug: "upright-row",
    name: "Upright Row",
    primaryMuscle: "shoulders",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold the bar with a narrow overhand grip. Pull it straight up " +
      "the body to chin height, flaring elbows above the bar, then lower.",
  },
  {
    slug: "rear-delt-fly",
    name: "Rear Delt Fly",
    primaryMuscle: "shoulders",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Hinge forward at 90 degrees. Raise the dumbbells out to the " +
      "sides with a slight bend in the elbows until your arms are parallel to the floor.",
  },
  {
    slug: "cable-rear-delt-fly",
    name: "Cable Rear Delt Fly",
    primaryMuscle: "shoulders",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Set cables at face height and cross the handles. With arms " +
      "slightly bent, pull them apart in a wide arc, squeezing the rear delts.",
  },
  {
    slug: "band-pull-apart",
    name: "Band Pull-Apart",
    primaryMuscle: "shoulders",
    equipment: "band",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Hold the band in front of you at shoulder height with straight arms. " +
      "Pull it apart until it touches your chest, squeezing the rear delts.",
  },

  // ─── BICEPS (10) ─────────────────────────────────────────────────────────────
  {
    slug: "barbell-curl",
    name: "Barbell Curl",
    primaryMuscle: "biceps",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Stand with the bar in a supinated grip at hip level. Curl to " +
      "shoulder height while keeping elbows pinned at the sides, then lower slowly.",
  },
  {
    slug: "dumbbell-curl",
    name: "Dumbbell Curl",
    primaryMuscle: "biceps",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold dumbbells at your sides with palms forward. Curl both arms " +
      "together or alternating to shoulder height, supinating fully at the top.",
  },
  {
    slug: "hammer-curl",
    name: "Hammer Curl",
    primaryMuscle: "biceps",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold dumbbells with a neutral grip (thumbs up). Curl both arms " +
      "to shoulder height without rotating the wrists, then lower.",
  },
  {
    slug: "incline-dumbbell-curl",
    name: "Incline Dumbbell Curl",
    primaryMuscle: "biceps",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Lie back on a 45-degree incline bench. With arms hanging freely, " +
      "curl both dumbbells to shoulder height and feel the full stretch at the bottom.",
  },
  {
    slug: "cable-curl",
    name: "Cable Curl",
    primaryMuscle: "biceps",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Stand at a low pulley with a straight bar. Curl to shoulder " +
      "height while keeping elbows stationary at the sides, then lower with control.",
  },
  {
    slug: "preacher-curl",
    name: "Preacher Curl",
    primaryMuscle: "biceps",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Rest upper arms on the preacher pad. Curl the bar to shoulder " +
      "height without letting the pad push the elbows forward, then lower fully.",
  },
  {
    slug: "concentration-curl",
    name: "Concentration Curl",
    primaryMuscle: "biceps",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Sit, brace your elbow against the inside of your thigh. Curl " +
      "the dumbbell up squeezing hard at the top, then lower to a full stretch.",
  },
  {
    slug: "ez-bar-curl",
    name: "EZ-Bar Curl",
    primaryMuscle: "biceps",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Use the inner angled grip on the EZ-bar to reduce wrist strain. " +
      "Curl to shoulder height, hold for a moment at the top, then lower slowly.",
  },
  {
    slug: "cable-hammer-curl",
    name: "Cable Hammer Curl",
    primaryMuscle: "biceps",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Attach a rope to a low pulley. Curl with a neutral grip, splitting " +
      "the rope at the top of the movement, then lower under control.",
  },
  {
    slug: "reverse-curl",
    name: "Reverse Curl",
    primaryMuscle: "biceps",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold the bar with an overhand grip at hip level. Curl to shoulder " +
      "height while keeping the wrists neutral, emphasising the brachialis.",
  },

  // ─── TRICEPS (10) ────────────────────────────────────────────────────────────
  {
    slug: "tricep-pushdown",
    name: "Tricep Pushdown",
    primaryMuscle: "triceps",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Stand at a high pulley with a bar or rope. Keep elbows pinned " +
      "to your sides and push down to full extension, then return slowly.",
  },
  {
    slug: "skull-crusher",
    name: "Skull Crusher",
    primaryMuscle: "triceps",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Lie on a flat bench with the bar above your chest. Lower the " +
      "bar toward your forehead by bending only at the elbows, then press back up.",
  },
  {
    slug: "overhead-tricep-extension",
    name: "Overhead Tricep Extension",
    primaryMuscle: "triceps",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold one dumbbell with both hands overhead. Lower behind the " +
      "head until elbows are at 90 degrees, then press back to full lockout.",
  },
  {
    slug: "tricep-dips",
    name: "Tricep Dips",
    primaryMuscle: "triceps",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 90,
    instructions:
      "Keep your body upright on parallel bars. Lower until upper arms " +
      "are parallel to the floor, then press back up to lockout.",
  },
  {
    slug: "close-grip-bench-press",
    name: "Close-Grip Bench Press",
    primaryMuscle: "triceps",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Grip the bar at shoulder width. Lower to mid-chest with elbows " +
      "close to the body, then press back to lockout leading with the triceps.",
  },
  {
    slug: "cable-overhead-tricep-extension",
    name: "Cable Overhead Tricep Extension",
    primaryMuscle: "triceps",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Face away from the cable with a rope attachment at head height. " +
      "Lean forward slightly and extend the arms forward to full lockout.",
  },
  {
    slug: "diamond-push-up",
    name: "Diamond Push-up",
    primaryMuscle: "triceps",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Form a diamond shape with index fingers and thumbs directly under " +
      "your chest. Lower to the hands, then press back up, feeling the triceps fire.",
  },
  {
    slug: "dumbbell-kickback",
    name: "Dumbbell Kickback",
    primaryMuscle: "triceps",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Hinge forward with upper arm parallel to the floor. Extend the " +
      "forearm back to full lockout, hold briefly, then return to 90 degrees.",
  },
  {
    slug: "tricep-pushdown-rope",
    name: "Tricep Rope Pushdown",
    primaryMuscle: "triceps",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Attach a rope to a high pulley. Push the rope down and flare " +
      "the ends outward at the bottom for a full contraction, then return slowly.",
  },
  {
    slug: "bench-dip",
    name: "Bench Dip",
    primaryMuscle: "triceps",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Place hands on a bench behind you and feet on the floor. Lower " +
      "your hips toward the floor until elbows reach 90 degrees, then press up.",
  },

  // ─── LEGS (13) ───────────────────────────────────────────────────────────────
  {
    slug: "barbell-squat",
    name: "Barbell Back Squat",
    primaryMuscle: "legs",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Bar sits across the upper traps, feet shoulder-width apart. " +
      "Brace the core, squat until the hip crease passes the knee, then drive up.",
  },
  {
    slug: "front-squat",
    name: "Front Squat",
    primaryMuscle: "legs",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Rest the bar on the front deltoids with elbows high. Squat " +
      "deep while keeping the torso upright, then extend the hips and knees together.",
  },
  {
    slug: "leg-press",
    name: "Leg Press",
    primaryMuscle: "legs",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Place feet shoulder-width apart at mid-platform. Lower the sled " +
      "until knees reach 90 degrees, then press back to near lockout.",
  },
  {
    slug: "romanian-deadlift",
    name: "Romanian Deadlift",
    primaryMuscle: "legs",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Stand tall with a hip-width stance. Push hips back and lower " +
      "the bar along the thighs until you feel a hamstring stretch, then drive hips forward.",
  },
  {
    slug: "dumbbell-romanian-deadlift",
    name: "Dumbbell Romanian Deadlift",
    primaryMuscle: "legs",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold dumbbells in front of the thighs. Hinge from the hips " +
      "with a soft knee bend until you feel a hamstring stretch, then return to standing.",
  },
  {
    slug: "leg-curl",
    name: "Lying Leg Curl",
    primaryMuscle: "legs",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Lie face down on the machine with the pad just above the heels. " +
      "Curl the lower legs toward the glutes, pause, then lower under control.",
  },
  {
    slug: "leg-extension",
    name: "Leg Extension",
    primaryMuscle: "legs",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Sit with the pad across the shins. Extend the knees to full " +
      "lockout, hold for a count, then lower slowly to prevent momentum.",
  },
  {
    slug: "dumbbell-lunge",
    name: "Dumbbell Lunge",
    primaryMuscle: "legs",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold dumbbells at your sides and step forward. Lower the back " +
      "knee toward the floor, then drive through the front heel to return.",
  },
  {
    slug: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    primaryMuscle: "legs",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Rear foot elevated on a bench, front foot far enough forward. " +
      "Lower the back knee toward the floor, then press up through the front heel.",
  },
  {
    slug: "hack-squat",
    name: "Hack Squat",
    primaryMuscle: "legs",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Set feet low and shoulder-width on the platform. Lower the sled " +
      "until knees reach 90 degrees, then drive back up without locking out.",
  },
  {
    slug: "goblet-squat",
    name: "Goblet Squat",
    primaryMuscle: "legs",
    equipment: "kettlebell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold a kettlebell at chest height with both hands. Squat deep " +
      "with elbows tracking inside the knees, then drive up to standing.",
  },
  {
    slug: "seated-leg-curl",
    name: "Seated Leg Curl",
    primaryMuscle: "legs",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Adjust the machine so the pad sits just above the ankle. Pull " +
      "the heels under the seat as far as possible, hold, then release with control.",
  },
  {
    slug: "calf-raise",
    name: "Standing Calf Raise",
    primaryMuscle: "legs",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Stand with the balls of the feet on the platform and shoulders " +
      "under the pads. Rise onto the toes, pause at the top, then lower to a full stretch.",
  },

  // ─── GLUTES (10) ─────────────────────────────────────────────────────────────
  {
    slug: "barbell-hip-thrust",
    name: "Barbell Hip Thrust",
    primaryMuscle: "glutes",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Sit with upper back against a bench and bar over the hips. " +
      "Drive through the heels until hips are fully extended, squeezing the glutes at the top.",
  },
  {
    slug: "dumbbell-hip-thrust",
    name: "Dumbbell Hip Thrust",
    primaryMuscle: "glutes",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Place a dumbbell on the hips, upper back against a bench. " +
      "Drive the hips upward to full extension and squeeze the glutes hard at the top.",
  },
  {
    slug: "cable-kickback",
    name: "Cable Glute Kickback",
    primaryMuscle: "glutes",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Attach an ankle cuff to a low pulley. Hinge slightly forward, " +
      "then kick the leg back and up until the glute is fully contracted.",
  },
  {
    slug: "sumo-deadlift",
    name: "Sumo Deadlift",
    primaryMuscle: "glutes",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Take a wide stance with toes turned out and grip the bar inside " +
      "your legs. Pull the bar up by extending the hips and knees simultaneously.",
  },
  {
    slug: "glute-bridge",
    name: "Glute Bridge",
    primaryMuscle: "glutes",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Lie on your back with knees bent and feet flat on the floor. " +
      "Drive the hips up by squeezing the glutes, hold for two seconds, then lower.",
  },
  {
    slug: "dumbbell-step-up",
    name: "Dumbbell Step-Up",
    primaryMuscle: "glutes",
    equipment: "dumbbell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hold dumbbells at your sides and place one foot on a bench. " +
      "Drive through the raised heel to step up, then lower the trailing leg with control.",
  },
  {
    slug: "cable-pull-through",
    name: "Cable Pull-Through",
    primaryMuscle: "glutes",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Face away from a low pulley holding the rope between your legs. " +
      "Hinge back and then drive the hips forward to standing, squeezing the glutes.",
  },
  {
    slug: "donkey-kick",
    name: "Donkey Kick",
    primaryMuscle: "glutes",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Start on all fours with a neutral spine. Keeping the knee bent, " +
      "kick one heel toward the ceiling until the glute is contracted, then lower.",
  },
  {
    slug: "side-lying-clam",
    name: "Side-Lying Clam",
    primaryMuscle: "glutes",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Lie on your side with hips and knees bent to 45 degrees. " +
      "Rotate the top knee upward like a clamshell while keeping the feet together.",
  },
  {
    slug: "smith-machine-hip-thrust",
    name: "Smith Machine Hip Thrust",
    primaryMuscle: "glutes",
    equipment: "machine",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Use the Smith bar across the hips with upper back on a bench. " +
      "Lock the bar at the top of each rep, squeezing the glutes fully.",
  },

  // ─── CORE (11) ───────────────────────────────────────────────────────────────
  {
    slug: "plank",
    name: "Plank",
    primaryMuscle: "core",
    equipment: "bodyweight",
    metric: "time",
    defaultRestSec: 60,
    instructions:
      "Hold a straight line from head to heels on forearms and toes. " +
      "Brace the core; do not let the hips sag.",
  },
  {
    slug: "side-plank",
    name: "Side Plank",
    primaryMuscle: "core",
    equipment: "bodyweight",
    metric: "time",
    defaultRestSec: 60,
    instructions:
      "Support yourself on one forearm and the side of the foot. " +
      "Keep the hips stacked and in line with your shoulders and ankles.",
  },
  {
    slug: "hollow-hold",
    name: "Hollow Hold",
    primaryMuscle: "core",
    equipment: "bodyweight",
    metric: "time",
    defaultRestSec: 60,
    instructions:
      "Lie on your back and press your lower back into the floor. " +
      "Raise both legs and the shoulder blades, holding a banana-like curve.",
  },
  {
    slug: "dead-bug",
    name: "Dead Bug",
    primaryMuscle: "core",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Lie on your back with arms and legs at 90 degrees. Slowly lower " +
      "the opposite arm and leg toward the floor while pressing the spine into it, then switch.",
  },
  {
    slug: "cable-crunch",
    name: "Cable Crunch",
    primaryMuscle: "core",
    equipment: "cable",
    metric: "weight_reps",
    defaultRestSec: 60,
    instructions:
      "Kneel facing a high pulley with the rope behind your head. " +
      "Crunch down by rounding the thoracic spine, bringing elbows toward the knees.",
  },
  {
    slug: "ab-wheel-rollout",
    name: "Ab Wheel Rollout",
    primaryMuscle: "core",
    equipment: "other",
    metric: "reps_only",
    defaultRestSec: 90,
    instructions:
      "Kneel with the wheel on the floor in front of you. Roll forward " +
      "keeping the hips in line with the spine, then pull back using the abs.",
  },
  {
    slug: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    primaryMuscle: "core",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 90,
    instructions:
      "Hang from a pull-up bar with a shoulder-width grip. Raise both " +
      "legs to parallel (or higher) with control, then lower without swinging.",
  },
  {
    slug: "russian-twist",
    name: "Russian Twist",
    primaryMuscle: "core",
    equipment: "other",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Sit with knees bent and torso leaning back at 45 degrees. Rotate " +
      "the torso side to side, touching the floor or a plate with each rotation.",
  },
  {
    slug: "dragon-flag",
    name: "Dragon Flag",
    primaryMuscle: "core",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 90,
    instructions:
      "Grip a bench behind your head and brace the entire body rigid. " +
      "Lower your body as a unit until nearly parallel to the floor, then raise back up.",
  },
  {
    slug: "wall-sit",
    name: "Wall Sit",
    primaryMuscle: "core",
    equipment: "bodyweight",
    metric: "time",
    defaultRestSec: 60,
    instructions:
      "Stand with your back flat against a wall and slide down until " +
      "thighs are parallel to the floor. Hold this position with feet flat.",
  },
  {
    slug: "crunch",
    name: "Crunch",
    primaryMuscle: "core",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 60,
    instructions:
      "Lie on your back with knees bent. Curl the shoulder blades off " +
      "the floor by contracting the abs, keeping the lower back in contact with the floor.",
  },

  // ─── FULL BODY (12) ──────────────────────────────────────────────────────────
  {
    slug: "barbell-clean",
    name: "Barbell Clean",
    primaryMuscle: "fullBody",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Begin with the bar over mid-foot. Explode through the hips " +
      "and shrug to pull the bar high, then drop under it to catch in a front rack position.",
  },
  {
    slug: "burpee",
    name: "Burpee",
    primaryMuscle: "fullBody",
    equipment: "bodyweight",
    metric: "reps_only",
    defaultRestSec: 90,
    instructions:
      "From standing, drop hands to the floor and jump feet back to plank. " +
      "Perform a push-up, jump feet forward, then jump up with arms overhead.",
  },
  {
    slug: "kettlebell-swing",
    name: "Kettlebell Swing",
    primaryMuscle: "fullBody",
    equipment: "kettlebell",
    metric: "weight_reps",
    defaultRestSec: 90,
    instructions:
      "Hinge at the hips to swing the kettlebell back between the legs. " +
      "Drive the hips forward explosively to swing the bell to shoulder height.",
  },
  {
    slug: "thruster",
    name: "Thruster",
    primaryMuscle: "fullBody",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Hold the bar in a front rack and squat to depth. As you rise, " +
      "use the momentum from the legs to press the bar overhead to full lockout.",
  },
  {
    slug: "power-clean",
    name: "Power Clean",
    primaryMuscle: "fullBody",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Pull the bar explosively from the floor and receive it in a " +
      "quarter-squat position in the front rack. Focus on a fast hip extension and high elbows.",
  },
  {
    slug: "turkish-get-up",
    name: "Turkish Get-Up",
    primaryMuscle: "fullBody",
    equipment: "kettlebell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Hold the kettlebell overhead with a locked arm. Follow the six-step " +
      "sequence from lying to standing while keeping the bell packed and eyes on it.",
  },
  {
    slug: "deadlift-full-body",
    name: "Trap Bar Deadlift",
    primaryMuscle: "fullBody",
    equipment: "barbell",
    metric: "weight_reps",
    defaultRestSec: 150,
    instructions:
      "Stand inside the hex bar and grip the handles. With a neutral " +
      "spine, push the floor away and extend the hips and knees simultaneously.",
  },
  {
    slug: "box-jump",
    name: "Box Jump",
    primaryMuscle: "fullBody",
    equipment: "other",
    metric: "reps_only",
    defaultRestSec: 90,
    instructions:
      "Stand in front of a sturdy box. Dip the hips, swing the arms, " +
      "and jump to land softly with both feet on the box, then step down.",
  },
  {
    slug: "farmers-carry",
    name: "Farmer's Carry",
    primaryMuscle: "fullBody",
    equipment: "dumbbell",
    metric: "time",
    defaultRestSec: 90,
    instructions:
      "Hold heavy dumbbells at your sides and walk for a set distance " +
      "or time with a tall posture, shoulders packed and core braced.",
  },
  {
    slug: "sandbag-clean-and-press",
    name: "Sandbag Clean and Press",
    primaryMuscle: "fullBody",
    equipment: "other",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Grip the sandbag from the floor and clean it to the shoulders " +
      "in one explosive movement, then press overhead to full lockout.",
  },
  {
    slug: "kettlebell-clean-and-press",
    name: "Kettlebell Clean and Press",
    primaryMuscle: "fullBody",
    equipment: "kettlebell",
    metric: "weight_reps",
    defaultRestSec: 120,
    instructions:
      "Clean the kettlebell to the rack position with a neutral wrist. " +
      "Without a re-dip, press it overhead to lockout, then return to rack and lower.",
  },
  {
    slug: "dead-hang",
    name: "Dead Hang",
    primaryMuscle: "fullBody",
    equipment: "bodyweight",
    metric: "time",
    defaultRestSec: 90,
    instructions:
      "Hang from a pull-up bar with both hands, fully relaxing the " +
      "shoulder girdle. Hold for as long as possible to build grip and shoulder mobility.",
  },
];
