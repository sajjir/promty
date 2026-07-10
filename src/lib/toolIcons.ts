import { 
  Bot, 
  Camera, 
  PenTool, 
  Music, 
  Sparkles, 
  Palette, 
  Brush, 
  Code, 
  Video, 
  Wand2, 
  Image, 
  Cpu, 
  BookOpen, 
  Heart, 
  Briefcase, 
  LineChart, 
  FileText 
} from "lucide-react";

// Mapping tools to Lucide icons
export const toolIconsMap: Record<string, any> = {
  chatgpt: Bot,
  gpt: Bot,
  midjourney: Camera,
  mj: Camera,
  claude: PenTool,
  suno: Music,
  udio: Music,
  flux: Sparkles,
  "stable diffusion": Palette,
  "stable-diffusion": Palette,
  dalle: Brush,
  "dall-e": Brush,
  v0: Code,
  bolt: Code,
  runway: Video,
  pika: Video,
  sora: Video,
};

export function getToolIcon(toolName?: string) {
  if (!toolName) return Wand2;
  const nameLower = toolName.toLowerCase().trim();
  
  // Find a matching key
  const matchKey = Object.keys(toolIconsMap).find(
    (key) => nameLower.includes(key) || key.includes(nameLower)
  );
  
  return matchKey ? toolIconsMap[matchKey] : Wand2;
}

// Mapping domains to Tailwind gradient classes
export const domainGradients: Record<string, string> = {
  health: "from-teal-900 to-emerald-500",
  medical: "from-teal-900 to-emerald-500",
  programming: "from-slate-900 to-blue-700",
  coding: "from-slate-900 to-blue-700",
  development: "from-slate-900 to-blue-700",
  tech: "from-slate-900 to-blue-700",
  photography: "from-orange-900 to-amber-600",
  art: "from-orange-900 to-amber-600",
  design: "from-orange-900 to-amber-600",
  marketing: "from-indigo-900 to-purple-600",
  business: "from-indigo-900 to-purple-600",
  copywriting: "from-indigo-900 to-purple-600",
  education: "from-blue-950 to-indigo-600",
  writing: "from-blue-950 to-indigo-600",
  learning: "from-blue-950 to-indigo-600",
};

export function getDomainGradient(domainName?: string): string {
  if (!domainName) return "from-slate-800 to-slate-950";
  const nameLower = domainName.toLowerCase().trim();
  
  // Find matching domain key
  const matchKey = Object.keys(domainGradients).find(
    (key) => nameLower.includes(key) || key.includes(nameLower)
  );
  
  return matchKey ? domainGradients[matchKey] : "from-slate-800 to-slate-950";
}
