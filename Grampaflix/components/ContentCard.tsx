import { motion } from "motion/react";

interface ContentCardProps {
  title: string;
  imageUrl: string;
}

export function ContentCard({ title, imageUrl }: ContentCardProps) {
  return (
    <motion.div
      className="flex-shrink-0 w-[300px] cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative aspect-video rounded-md overflow-hidden bg-gray-800">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h4 className="text-white">{title}</h4>
        </div>
      </div>
    </motion.div>
  );
}
