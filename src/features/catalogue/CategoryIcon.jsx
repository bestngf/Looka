import {
  Armchair, Bike, Camera, Car, Hammer, Laptop, Lightbulb, Mic, Music, Package,
  Shirt, Speaker, Tent, Truck, UtensilsCrossed, Wrench,
} from 'lucide-react';

const ICONES = {
  armchair: Armchair, bike: Bike, camera: Camera, car: Car, hammer: Hammer, laptop: Laptop,
  lightbulb: Lightbulb, mic: Mic, music: Music, package: Package, shirt: Shirt, speaker: Speaker,
  tent: Tent, truck: Truck, utensils: UtensilsCrossed, 'utensils-crossed': UtensilsCrossed, wrench: Wrench,
};

export default function CategoryIcon({ icon, size = 26 }) {
  const nom = String(icon || '').trim();
  // Emoji ou texte non latin : affiché tel quel.
  if (nom && /[^\x00-\x7F]/.test(nom)) return <span style={{ fontSize: size - 2, lineHeight: 1 }}>{nom}</span>;
  const Icone = ICONES[nom.toLowerCase()] || Package;
  return <Icone size={size} />;
}
