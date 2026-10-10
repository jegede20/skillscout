import {
  BookOpen,
  Brain,
  Camera,
  ChefHat,
  Cloud,
  Code2,
  Database,
  Dumbbell,
  Film,
  Globe,
  Languages,
  Megaphone,
  Mic,
  Music,
  PenLine,
  PenTool,
  Palette,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  BookOpen, Brain, Camera, ChefHat, Cloud, Code2, Database, Dumbbell, Film, Globe, Languages,
  Megaphone, Mic, Music, PenLine, PenTool, Palette, ShieldCheck, Wallet,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? BookOpen;
  return <Icon aria-hidden="true" className={className} />;
}
