export interface FieldSchema {
  key: string;
  label: string;
  type: string; // 'text' | 'textarea' | 'color' | 'select'
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select type
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  body: string;
  fieldsSchema: FieldSchema[];
  category: string;
  tags: string[];
  sampleImage?: string;
  isPremium: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Stats {
  totalPrompts: number;
  totalUsages: number;
  mostPopular: string;
}
