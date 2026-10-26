export interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'select' | 'radio' | 'switch' | 'slider' | 'multiselect' | 'url';
  sourceText?: string; // Exact original span replaced by this field
  defaultValue?: string;
  defaultValueFa?: string;
  advanced?: boolean;
  allowCustom?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select, radio, multiselect
  min?: number;       // for slider
  max?: number;       // for slider
}

export interface PersonalizationReview {
  decision:'fields'|'fixed';
  reason:string;
  dimensions:{sourceText:string;label:string;disposition:'field'|'fixed'|'prerequisite';key:string|null;reason:string}[];
}
export interface PromptEditorial {
  personalizationReview?:PersonalizationReview;
  sourceText?: string; // Admin-only original, never a claimed model reconstruction
  fixedConstraints?: string[];
  improvementSuggestions?: { title: string; reason: string; proposedChange: string }[];
  referenceImageReason?: string;
  referenceImageEvidence?: string;
  fidelity?: { status: "verified" | "needs-review"; reason: string };
  catalogVersion: string;
  classificationReason: string;
  needsReview: boolean;
  reviewNotes: string[];
  execution: { requiredCapabilities: string[]; routes: Record<string, unknown>[] };
}

export interface Prompt {
  relatedUseCases?: string[];
  editorial?: PromptEditorial;
  useCase?: string;
  resourceType?: 'prompt' | 'skill' | 'agent-guide';
  isDemo?: boolean;
  id: string;
  title: string;
  description: string;
  body: string;
  fieldsSchema: FieldSchema[];
  category?: string;
  // Metadata Layers
  intent?: string;
  intents?: string[];
  domains?: string[];      // قبلاً domain?: string بود
  tools?: string[];        // قبلاً tool?: string بود
  task?: string;
  language?: string;
  difficulty?: string;
  outputFormats?: string[]; // قبلاً outputFormat?: string بود
  bodyFa?: string;
  requiresReferenceImage?: boolean;
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

  // Smart Media Engine
  coverImage?: string;
  mediaGallery?: string[];

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

