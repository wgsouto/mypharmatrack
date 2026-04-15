export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  schedule: string;
  startDate: string;
  endDate: string;
  discontinuationReason: string;
  purpose: string;
}

export interface LabExam {
  id: string;
  analyte: string;
  value: string;
  referenceRange: string;
  date: string;
}

export interface Allergy {
  id: string;
  substance: string;
  reaction: string;
}

export interface PatientInfo {
  name: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
}

export interface PrescriberInfo {
  name: string;
  crm: string;
  specialty: string;
  contact: string;
}

export interface Evolution {
  pharmacistObservations: string;
  patientReportedSideEffects: string;
  adverseReactions: string;
  observedInteractions: string;
}

export interface PharmacotherapeuticForm {
  patient: PatientInfo;
  prescriber: PrescriberInfo;
  allergies: Allergy[];
  medications: Medication[];
  labExams: LabExam[];
  evolution: Evolution;
}
