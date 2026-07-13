// Runtime constants come first and are the single source of truth; the
// TypeScript union types are derived from them with `typeof ... [number]`.
// This makes it structurally impossible for the type and the runtime
// options list to drift out of sync with each other.

export const OPPORTUNITY_STAGES = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number]["value"];

export const ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "text", label: "Text" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "introduction", label: "Introduction" },
  { value: "networking", label: "Networking" },
  { value: "note", label: "Note" },
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number]["value"];

export type RelatedEntity =
  | "company"
  | "contact"
  | "opportunity"
  | "conference"
  | "none";

export const TASK_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number]["value"];

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];

export const COMMUNICATION_PREFERENCES = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "in_person", label: "In person" },
] as const;

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
