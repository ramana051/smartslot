import { Scissors, Stethoscope, Dumbbell, Shirt, UtensilsCrossed, Building2 } from 'lucide-react';

interface CategoryIconProps {
  category: string;
  className?: string;
}

export function CategoryIcon({ category, className = "w-6 h-6" }: CategoryIconProps) {
  const icons = {
    Salon: Scissors,
    Hospital: Stethoscope,
    Gym: Dumbbell,
    Turf: Shirt,
    Restaurant: UtensilsCrossed,
    Clinic: Building2,
  };

  const Icon = icons[category as keyof typeof icons] || Building2;
  
  return <Icon className={className} />;
}
