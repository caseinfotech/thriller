export type ChoreographyBlock = {
  id: string;
  title: string;
  setup: string;
  sections: { title: string; steps: [string, string][] }[];
  note?: string;
};

// Transcribed from Jess Lotak's "Thriller Flash Mob - Move Instructions" PDF.
export const choreography: ChoreographyBlock[] = [
  {
    id: "block-one", title: "Block One", setup: "Starting position and cue: face the left wall.",
    sections: [{ title: "Starting cue", steps: [
      ["Intro", "Begin after four 8-counts."],
      ["Cue", "Michael’s “UUUH” sound is the cue to start."],
      ["Position", "Start facing the left wall."],
    ] }],
  },
  {
    id: "block-two", title: "Block Two", setup: "Step out into a V twerk, leading with the right foot.",
    sections: [
      { title: "Twerk", steps: [
        ["1–2", "V twerk, head facing forward."],
        ["3–4", "Sneeze, head facing the left wall."],
        ["5–6", "V twerk."],
        ["7 / 8", "Step together on 7; clap on 8."],
      ] },
      { title: "Strut", steps: [
        ["Setup", "Still facing the left wall; make your arms big and dramatic."],
        ["1 / 2 / 3 / 4", "Right, left, right; tap and turn left on 4."],
        ["5 / 6 / 7 / 8", "Left, right, left; step out with the right foot on 8."],
      ] },
      { title: "Headbang and Teaser", steps: [
        ["&1 / 2 / &3 / 4", "Left–right; head back on 2. Left–right; fold on 4."],
        ["5–6–7", "Teaser walk left."],
        ["8", "Knock ’em out: right-leg kick."],
        ["Next 1", "Right lunge into Creep."],
      ] },
    ],
  },
  {
    id: "block-three", title: "Block Three", setup: "Creep section: step over into a lunge; shoulders carry most of the movement.",
    sections: [
      { title: "Creep", steps: [
        ["1 / 2 / 3 / 4", "Shoulders slide on 1, 2, 3; clap on 4."],
        ["5 / 6 / 7 / 8", "Left lunge on 5, 6, 7; stomp on 8."],
      ] },
      { title: "Shrug to Thrust", steps: [
        ["1 / 2 / 3 / 4", "Shrug on 1; left head on 2; shrug on 3; right sit to thrust."],
        ["5 / 6 / 7 / 8", "Thrust up on 5, sit on 6, up on 7, sit on 8."],
        ["1 / 2 / 3 / 4", "Up on 1, sit on 2, up on 3, sit on 4."],
      ] },
      { title: "Scuff to Wave", steps: [
        ["5", "Scuff on the right; kick left."],
        ["6–&7–&8", "Wave: left hip and left hand in sync on each beat."],
      ] },
    ],
  },
  {
    id: "block-four", title: "Block Four", setup: "Party Twist section.",
    sections: [
      { title: "Party Twist", steps: [
        ["Setup", "Start right, hands in Teaser. The right hip follows the right hand in sync."],
        ["1–6", "On time: right 1, left 2, right 3, left 4, 5, 6."],
        ["7 / 8", "Stomp right on 7; left on 8."],
      ] },
      { title: "Shimmy Stomp", steps: [
        ["R, L, RLR", "Shimmy right, left, right–left–right."],
        ["L, R, LRL", "Shimmy left, right, left–right–left."],
      ] },
      { title: "Classic Zombie", steps: [
        ["1–8 / 1–8", "Right foot to the right for two 8-counts."],
      ] },
    ],
  },
  {
    id: "block-five", title: "Block Five", setup: "Zombie Stomp section, then the final pose and fade.",
    sections: [{ title: "Zombie Stomp", steps: [
      ["1–6", "Stomp: right foot turns on 1, 2, 3, 4, 5, 6."],
      ["7 / 8", "Look on 7; back on 8."],
      ["1–4", "Zombie walk."],
      ["5–6", "Turn around."],
      ["7–8", "Pose."],
      ["1–8", "Fade on 1, 2, 3, 4, 5, 6, 7, 8."],
    ] }],
    note: "Zombie walk out — return for the group photo!",
  },
];
