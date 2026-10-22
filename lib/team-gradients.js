// Preset avatar backgrounds, shared by the admin form and the About page.
// Full class names are spelled out so Tailwind keeps them in the build.
export const GRADIENTS = {
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
  blue: 'bg-gradient-to-br from-sky-400 to-blue-600',
  green: 'bg-gradient-to-br from-emerald-400 to-green-600',
  orange: 'bg-gradient-to-br from-orange-400 to-[#F97316]',
  pink: 'bg-gradient-to-br from-pink-400 to-rose-500',
  indigo: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
};

export const GRADIENT_KEYS = Object.keys(GRADIENTS);
export const DEFAULT_GRADIENT = 'purple';
export const DEFAULT_AVATAR = '🙂';
