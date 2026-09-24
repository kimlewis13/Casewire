export interface SampleDocument {
  id: string;
  name: string;
  description: string;
  text: string;
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
];

export function findSampleDocument(id: string): SampleDocument | undefined {
  return SAMPLE_DOCUMENTS.find((d) => d.id === id);
}
