export interface SampleDocument {
  id: string;
  name: string;
  description: string;
  text: string;
}

/**
 * The Webb documents' dates are computed relative to "now" (anchored to the
 * same ~4-months-ago incident date used for Webb's seeded intake in db.ts)
 * rather than hardcoded to a calendar date, so the gap-detection flags and
 * the statute-of-limitations estimate both stay meaningful no matter when
 * this demo is actually opened. The day offsets preserve the original
 * design: a 49-day gap between the ER visit and the imaging follow-up
 * (the flag this case is built to demonstrate), and 16 days from imaging
 * to the orthopedic consult (under the 30-day gap threshold).
 */
function webbDate(daysFromIncident: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 4);
  d.setDate(d.getDate() + daysFromIncident);
  return d.toISOString().slice(0, 10);
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: "reyes-rear-end",
    name: "Reyes — rear-end collision (ER + PT + ortho)",
    description:
      "5 entries. Plants a treatment gap, an unaddressed pre-existing condition, and an unresolved imaging referral.",
    text: `Date: 2024-01-05
Provider: Riverside Community ER — Dr. K. Nguyen
Type: visit
Notes: Patient presents after motor vehicle collision, rear-ended while stopped at a light. Reports neck and lower back pain, 7/10. Diagnosis: cervical strain, lumbar contusion. Patient mentions history of prior lumbar spine surgery in 2019 with an unrelated provider, states it had fully resolved before this incident. Prescribed rest, ibuprofen 600mg, follow up with primary care in two weeks.
---
Date: 2024-01-20
Provider: Dr. A. Patel — Family Medicine
Type: visit
Notes: Follow-up for cervical strain and lumbar contusion. Patient reports persistent stiffness, pain now 6/10. Referred to physical therapy, twice weekly for six weeks.
---
Date: 2024-04-02
Provider: Riverside Physical Therapy — M. Chen, DPT
Type: treatment
Notes: Initial physical therapy evaluation. Patient reports pain was unmanaged for several weeks due to an insurance authorization delay. Beginning a six week PT program for cervical and lumbar strain.
---
Date: 2024-04-10
Provider: Riverside Physical Therapy — M. Chen, DPT
Type: treatment
Notes: Second PT session. Mild improvement in range of motion. Continuing program, pain now 4/10.
---
Date: 2024-04-24
Provider: Dr. S. Osei — Orthopedic Surgery
Type: referral
Notes: Orthopedic consult for continued lumbar pain. MRI of the lumbar spine recommended to rule out disc involvement. Patient instructed to schedule imaging.`,
  },
  {
    id: "shah-slip-fall",
    name: "Shah — slip and fall (clean record)",
    description:
      "3 entries, no gaps, no dangling referrals. Useful to show the records review doesn't just flag everything.",
    text: `Date: 2024-02-01
Provider: Lakeside Urgent Care — Dr. R. Kim
Type: visit
Notes: Patient slipped on a wet floor at a grocery store entrance with no warning sign posted. Diagnosis: right wrist sprain, contusion to right hip. X-ray taken on site, no fracture identified. Prescribed wrist brace, ice, ibuprofen.
---
Date: 2024-02-10
Provider: Lakeside Urgent Care — Dr. R. Kim
Type: visit
Notes: Follow-up visit, wrist improving steadily. Continue brace for two more weeks. Pain now 3/10.
---
Date: 2024-02-24
Provider: Lakeside Physical Therapy — J. Rivera, DPT
Type: treatment
Notes: Wrist and hip mobility improving with home exercise program. Discharged from active treatment, cleared for normal activity.`,
  },
  {
    id: "webb-er-visit",
    name: "Webb — Metro General ER (multi-vehicle collision)",
    description:
      "First of three separate provider records for this case — a deliberately messy, multi-system file. Plants a pre-existing-injury mention and an unresolved neurology referral.",
    text: `Date: ${webbDate(0)}
Provider: Metro General Hospital ER — Dr. L. Whitfield
Type: visit
Notes: Patient involved in a multi-vehicle collision, transported by ambulance. Diagnosis: whiplash, right shoulder strain, mild concussion. Patient reports a prior injury to the left shoulder in 2021, unrelated and fully healed. Referred to neurology for concussion follow-up.
---
Date: ${webbDate(0)}
Provider: Metro General Hospital ER — Discharge Planning
Type: referral
Notes: Right shoulder pain persists on discharge exam. MRI of the right shoulder recommended. Referred to orthopedics. Discharged same day with instructions to follow up within one week.`,
  },
  {
    id: "webb-imaging",
    name: "Webb — Crestline Imaging Center (MRI report)",
    description:
      "Second record for the Webb case — a separate facility entirely, received weeks later. Resolves the shoulder imaging referral but plants a long gap.",
    text: `Date: ${webbDate(49)}
Provider: Crestline Imaging Center — Dr. T. Nakamura, Radiology
Type: imaging
Notes: MRI of right shoulder performed at referring physician's request. Findings: partial rotator cuff tear, moderate. Report faxed to referring provider; no follow-up appointment was on file at the time of imaging.`,
  },
  {
    id: "webb-orthopedic",
    name: "Webb — Orthopedic Surgery Associates (specialist consult)",
    description:
      "Third record for the Webb case — yet another provider system. The neurology referral from the ER visit is never mentioned again anywhere in the file.",
    text: `Date: ${webbDate(65)}
Provider: Dr. R. Alvarez — Orthopedic Surgery Associates
Type: referral
Notes: Consult for right shoulder rotator cuff tear per Crestline Imaging MRI. Recommends surgical repair; patient scheduling a second opinion before proceeding.`,
  },
];

export function findSampleDocument(id: string): SampleDocument | undefined {
  return SAMPLE_DOCUMENTS.find((d) => d.id === id);
}
