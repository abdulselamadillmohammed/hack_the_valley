import { Search, Bell, User } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent px-8 py-6">
      <div className="flex items-center justify-between max-w-[1800px] mx-auto">
        <div className="flex items-center gap-12">
          <h1 className="text-red-600 tracking-wider">
            GRAMPAFLIX
          </h1>
          <nav className="flex gap-8">
            <button className="text-white hover:text-gray-300 transition-colors">
              Home
            </button>
            <button className="text-white hover:text-gray-300 transition-colors">
              Movies
            </button>
            <button className="text-white hover:text-gray-300 transition-colors">
              Series
            </button>
            <button className="text-white hover:text-gray-300 transition-colors">
              Documentaries
            </button>
            <button className="text-white hover:text-gray-300 transition-colors">
              My List
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-white hover:text-gray-300 transition-colors">
            <Search className="w-6 h-6" />
          </button>
          <button className="text-white hover:text-gray-300 transition-colors">
            <Bell className="w-6 h-6" />
          </button>
          <button className="text-white hover:text-gray-300 transition-colors">
            <User className="w-8 h-8" />
          </button>
        </div>
      </div>
    </header>
  );
}