export interface TrainingCourse {
  name: string;
  date: string;
}

export interface PartyMember {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  position: string;
  politicalTheoryLevel: string;
  partyCardNumber: string;
  admissionDate: string;
  officialDate: string;
  trainingCourses: TrainingCourse[];
  profilePicture?: string; // Base64 encoded string
  ethnicity?: string;
  religion?: string;
  educationLevel?: string;
  idCode?: string;
}

export type AppView = 'form' | 'list' | 'dashboard';