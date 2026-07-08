export interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'select' | 'radio' | 'switch' | 'slider' | 'multiselect' | 'url';
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select, radio, multiselect
  min?: number;       // for slider
  max?: number;       // for slider
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  body: string;
  fieldsSchema: FieldSchema[];
  category?: string;
  // Metadata Layers
  intent?: string;
  domain?: string;
  tool?: string;
  task?: string;
  language?: string;
  difficulty?: string;
  outputFormat?: string;
  industry?: string;
  tags: string[];
  // Stats & Status
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

