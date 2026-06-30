import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
}

export default function DynamicIcon({ name, className = 'w-5 h-5' }: DynamicIconProps) {
  // Safe lookup for the icon name in Lucide-react
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Return standard Globe icon as fallback
    return <Icons.Globe className={className} />;
  }

  return <IconComponent className={className} />;
}
