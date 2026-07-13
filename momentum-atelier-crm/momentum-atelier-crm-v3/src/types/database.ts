export type OpportunityStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "text"
  | "linkedin"
  | "introduction"
  | "networking"
  | "note";

export type RelatedEntity =
  | "company"
  | "contact"
  | "opportunity"
  | "conference"
  | "none";

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
  revenue: number | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  owner_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  assistant_name: string | null;
  birthday: string | null;
  personal_notes: string | null;
  family_notes: string | null;
  interests: string | null;
  communication_preference: string | null;
  created_at: string;
  updated_at: string;
};

export type Opportunity = {
  id: string;
  owner_id: string;
  name: string;
  company_id: string | null;
  contact_id: string | null;
  stage: OpportunityStage;
  value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  next_step: string | null;
  competitors: string | null;
  products: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  owner_id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  related_to_type: RelatedEntity;
  related_to_id: string | null;
  activity_date: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  related_to_type: RelatedEntity;
  related_to_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Conference = {
  id: string;
  owner_id: string;
  name: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const OPPORTUNITY_STAGES: { value: OpportunityStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const COMMUNICATION_PREFERENCES: { value: string; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "in_person", label: "In person" },
];

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "text", label: "Text" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "introduction", label: "Introduction" },
  { value: "networking", label: "Networking" },
  { value: "note", label: "Note" },
];
