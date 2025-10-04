import { Play, Info } from "lucide-react";
import { Button } from "./ui/button";

interface HeroSectionProps {
  title: string;
  description: string;
  imageUrl: string;
}

export function HeroSection({ title, description, imageUrl }: HeroSectionProps) {
  return (
    <div className="relative h-[85vh] w-full">
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>
      
      <div className="relative h-full flex items-center px-8 max-w-[1800px] mx-auto">
        <div className="max-w-2xl space-y-6">
          <h2 className="text-white text-5xl">{title}</h2>
          <p className="text-white text-xl leading-relaxed max-w-xl">
            {description}
          </p>
          <div className="flex gap-4 pt-4">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-8 py-6 gap-2">
              <Play className="w-6 h-6 fill-current" />
              Play
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-gray-600/80 text-white hover:bg-gray-600/60 px-8 py-6 gap-2"
            >
              <Info className="w-6 h-6" />
              More Info
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
