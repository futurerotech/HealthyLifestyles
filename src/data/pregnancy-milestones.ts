/**
 * Short, plain-English development notes by gestational week (counted from LMP).
 * General educational summaries — not a substitute for OB-GYN guidance.
 */
const MILESTONES: Record<number, string> = {
  4: 'The embryo implants and the placenta begins to form. A pregnancy test will usually be positive now.',
  5: 'The neural tube — the basis of the brain and spinal cord — starts to develop. The heart begins forming.',
  6: 'A tiny heartbeat can sometimes be seen on ultrasound. Facial features and limb buds are appearing.',
  7: 'The brain is growing rapidly and the arms and legs are taking shape as paddle-like buds.',
  8: 'All major organs have begun to form. The embryo is now about the size of a kidney bean.',
  9: 'The embryo becomes a fetus. Tiny fingers and toes are forming and the heart has four chambers.',
  10: 'Vital organs are in place and starting to function. Nails and hair follicles begin to develop.',
  11: 'The fetus can move, though you won’t feel it yet. Bones are beginning to harden.',
  12: 'End of the first trimester soon. Reflexes develop and the kidneys start producing urine.',
  13: 'First trimester complete. Vocal cords form and the fetus has unique fingerprints.',
  14: 'Second trimester begins. The fetus can make facial expressions and the neck is more defined.',
  15: 'The skeleton is hardening and the fetus can sense light through closed eyelids.',
  16: 'You may soon feel the first flutters of movement (“quickening”). The eyes can move.',
  17: 'Fat stores begin to develop and the umbilical cord grows stronger and thicker.',
  18: 'Hearing is developing — the fetus may respond to sounds. An anatomy scan is often done around now.',
  19: 'A protective coating called vernix covers the skin. Sensory areas of the brain are developing.',
  20: 'The halfway point. Many parents learn the sex around now if they wish, and movements grow stronger.',
  21: 'The fetus swallows amniotic fluid and the digestive system is practising for life outside.',
  22: 'Features look more like a newborn. The senses of touch and taste continue to refine.',
  23: 'The lungs are developing the ability to breathe air, though they are far from ready.',
  24: 'A key viability milestone. Lungs make surfactant and the inner ear is fully developed.',
  25: 'The fetus is gaining fat and the skin is becoming less wrinkled. Hair colour and texture form.',
  26: 'The eyes begin to open and the lungs continue to mature in preparation for breathing.',
  27: 'End of the second trimester. Brain activity increases and sleep-wake patterns appear.',
  28: 'Third trimester begins. The fetus can blink and the brain is growing quickly.',
  29: 'Bones are fully developed but still soft. Movements may feel stronger and more frequent.',
  30: 'The fetus can regulate its own temperature better as more fat is laid down.',
  31: 'Rapid brain and nervous-system development continues. The fetus may turn head-down.',
  32: 'Practising breathing movements. Toenails and fingernails have grown in.',
  33: 'The pupils can constrict and dilate in response to light. Bones harden further.',
  34: 'The central nervous system and lungs are maturing well. Most fetuses are head-down now.',
  35: 'Rapid weight gain. The kidneys are fully developed and the liver can process some waste.',
  36: 'The fetus is likely settling into a head-down position ready for birth.',
  37: 'Considered “early term.” The lungs and brain are still maturing in these final weeks.',
  38: 'Full term is near. The fetus continues to gain fat and the brain develops rapidly.',
  39: 'Full term. The baby is ready for birth; organs are mature enough to function on their own.',
  40: 'Your due date week. Only about 1 in 20 babies arrive exactly on the due date — anytime now is normal.',
};

export const milestoneFor = (week: number): string => {
  if (week < 4) return 'Very early pregnancy. Fertilisation and implantation are taking place; a test may not be positive yet.';
  if (week > 40) return 'You’re past your due date. Your OB-GYN will monitor you closely and discuss next steps.';
  return MILESTONES[week] ?? MILESTONES[Math.max(4, Math.min(40, week))];
};
