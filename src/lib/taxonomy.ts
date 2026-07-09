// src/lib/taxonomy.ts
// Single source of truth for all taxonomy/metadata option lists used across
// the frontend (AdminPromptAddEdit selects), the backend (Gemini fallback
// responseSchema enums), and the n8n analyzer agent system prompt.
// If you change any list here, remember to manually sync the n8n system
// prompt too (the n8n workflow lives outside this repository).

export const INTENT_OPTIONS = [
  "Create", "Write", "Code", "Design", "Market",
  "Analyze", "Learn", "Automate", "Research", "Productivity"
] as const;

export const DOMAIN_OPTIONS = [
  "Business", "Marketing", "Education", "Medical", "Health", "Legal",
  "Finance", "Programming", "Gaming", "Food", "Travel", "Architecture",
  "Photography", "Real Estate", "Sports", "AI", "Robotics", "Science",
  "Religion", "History"
] as const;

export const TOOL_OPTIONS = [
  "ChatGPT", "Claude", "Gemini", "Grok", "Midjourney", "Flux",
  "Stable Diffusion", "Ideogram", "Veo", "Kling", "Runway",
  "ElevenLabs", "Suno", "n8n AI Agent"
] as const;

export const LANGUAGE_OPTIONS = ["Persian", "English"] as const;

export const DIFFICULTY_OPTIONS = [
  "Beginner", "Intermediate", "Advanced", "Expert"
] as const;

export const OUTPUT_FORMAT_OPTIONS = [
  "Text", "Markdown", "JSON", "CSV", "HTML", "CSS", "JavaScript",
  "Python", "React", "TypeScript", "SQL", "XML", "PDF", "Image",
  "Video", "Table", "Checklist", "Roadmap", "Presentation"
] as const;

export const INDUSTRY_OPTIONS = [
  "Ecommerce", "Startup", "Healthcare", "Education", "Restaurant",
  "Construction", "Law", "Bank", "Crypto", "Fashion", "Fitness",
  "Agriculture", "Tourism", "Insurance", "NGO"
] as const;

export const FIELD_TYPE_OPTIONS = [
  "text", "textarea", "color", "select", "radio",
  "switch", "slider", "multiselect", "url"
] as const;
