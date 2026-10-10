import type { Category } from '@/lib/types';

export const CATEGORIES: Category[] = [
  { id: 'programming', name: 'Programming', icon: 'Code2', blurb: 'Think like a coder. Build logic, not just syntax.' },
  { id: 'web-development', name: 'Web Development', icon: 'Globe', blurb: 'Ship websites and web apps people actually use.' },
  { id: 'data-science', name: 'Data Science', icon: 'Database', blurb: 'Turn messy data into decisions and charts.' },
  { id: 'ai-ml', name: 'AI / ML', icon: 'Brain', blurb: 'Models, neural nets, and how machines learn.' },
  { id: 'ui-ux-design', name: 'UI/UX Design', icon: 'Palette', blurb: 'Design products people enjoy using.' },
  { id: 'graphic-design', name: 'Graphic Design', icon: 'PenTool', blurb: 'Type, colour, layout, and logos that land.' },
  { id: 'digital-marketing', name: 'Digital Marketing', icon: 'Megaphone', blurb: 'SEO, social, and growth that compounds.' },
  { id: 'photography', name: 'Photography', icon: 'Camera', blurb: 'Light, composition, and seeing the shot first.' },
  { id: 'video-editing', name: 'Video Editing', icon: 'Film', blurb: 'Cut stories that hold attention.' },
  { id: 'music-production', name: 'Music Production', icon: 'Music', blurb: 'Write, record, mix, and master your sound.' },
  { id: 'foreign-languages', name: 'Foreign Languages', icon: 'Languages', blurb: 'Speak to people in their own language.' },
  { id: 'personal-finance', name: 'Personal Finance', icon: 'Wallet', blurb: 'Budget, save, invest, and stop guessing.' },
  { id: 'cooking', name: 'Cooking', icon: 'ChefHat', blurb: 'Knife skills, heat control, and confidence.' },
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell', blurb: 'Train smart, recover well, build habits.' },
  { id: 'public-speaking', name: 'Public Speaking', icon: 'Mic', blurb: 'Structure, delivery, and calm on stage.' },
  { id: 'creative-writing', name: 'Creative Writing', icon: 'PenLine', blurb: 'Find your voice and finish the draft.' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: 'ShieldCheck', blurb: 'Defend systems and think like an attacker.' },
  { id: 'cloud-computing', name: 'Cloud Computing', icon: 'Cloud', blurb: 'Infrastructure, containers, and deployment.' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  Category['id'],
  Category
>;
