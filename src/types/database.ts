export type OpportunityStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityType = "call" | "email" | "meeting" | "note";

export type RelatedEntity =
  | "company"
  | "contact"
  | "opportunity"
  | "conference"
  | "none";

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Company {
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
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  owner_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  owner_id: string;
  name: string;
  company_id: string | null;
  contact_id: string | null;
  stage: OpportunityStage;
  value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
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
}

export interface Task {
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
}

export interface Conference {
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
}

export const OPPORTUNITY_STAGES: { value: OpportunityStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];
