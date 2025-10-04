import { ContentCard } from "./ContentCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface Content {
  id: string;
  title: string;
  imageUrl: string;
}

interface ContentRowProps {
  title: string;
  content: Content[];
}

export function ContentRow({ title, content }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -900 : 900;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="px-8 mb-12 group/row">
      <h3 className="text-white mb-4">{title}</h3>
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 text-white opacity-0 group-hover/row:opacity-100 hover:bg-black/70 transition-all duration-300 flex items-center justify-center"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {content.map((item) => (
            <ContentCard key={item.id} title={item.title} imageUrl={item.imageUrl} />
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 text-white opacity-0 group-hover/row:opacity-100 hover:bg-black/70 transition-all duration-300 flex items-center justify-center"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
