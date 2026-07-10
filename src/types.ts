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
  domains?: string[];      // قبلاً domain?: string بود
  tools?: string[];        // قبلاً tool?: string بود
  task?: string;
  language?: string;
  difficulty?: string;
  outputFormats?: string[]; // قبلاً outputFormat?: string بود
  industry?: string;
  tags: string[];
  // Stats & Status
  sampleImage?: string;
  isPremium: boolean;
  isActive: boolean;
  usageCount: number;
  
  // Forking/Anshab fields
  parentId?: string;
  sourceText?: string;
  parent?: {
    id: string;
    title: string;
  };

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

export interface DBSettings {
  n8nAnalyzeWebhook: string; // وبهوک مخصوص تحلیل چشمه
  n8nRefineWebhook: string;  // وبهوک مخصوص ارتقا پرامپت
  geminiApiKey: string;      // کلید مستقیم جمینای (Fallback)
  openaiApiKey: string;      // کلید مستقیم اوپنای‌آی (برای آینده)
}

