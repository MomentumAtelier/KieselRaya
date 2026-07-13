export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "number"
  | "email"
  | "tel"
  | "url";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  colSpan?: 1 | 2;
  step?: string;
}

export interface ColumnConfig<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}
