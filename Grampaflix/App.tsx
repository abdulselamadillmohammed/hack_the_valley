import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ContentRow } from "./components/ContentRow";

const mockContent = {
  familyMoments: [
    { id: "1", title: "Grandpa & Grandma", imageUrl: "https://images.unsplash.com/photo-1758686254493-7b3e49a8f325?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGRlcmx5JTIwY291cGxlJTIwc21pbGluZ3xlbnwxfHx8fDE3NTk1NjgxNDl8MA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "2", title: "Family Portrait", imageUrl: "https://images.unsplash.com/photo-1624448445915-97154f5e688c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBwb3J0cmFpdCUyMGhhcHB5fGVufDF8fHx8MTc1OTU1NDM3NXww&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "3", title: "Grandma & Grandchild", imageUrl: "https://images.unsplash.com/photo-1758513422975-60b6d15fe0e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFuZG1vdGhlciUyMGdyYW5kY2hpbGQlMjB0b2dldGhlcnxlbnwxfHx8fDE3NTk2MDQ5MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "4", title: "Grandpa & Grandson", imageUrl: "https://images.unsplash.com/photo-1753164725421-9b2ac63d880c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFuZGZhdGhlciUyMGdyYW5kc29uJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzU5NjA0OTE2fDA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "5", title: "Baby & Grandparent", imageUrl: "https://images.unsplash.com/photo-1635847318024-f14a1ac3e829?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWJ5JTIwZ3JhbmRwYXJlbnQlMjBob2xkaW5nfGVufDF8fHx8MTc1OTYwNDkxN3ww&ixlib=rb-4.1.0&q=80&w=1080" },
  ],
  celebrations: [
    { id: "6", title: "Family Dinner", imageUrl: "https://images.unsplash.com/photo-1699570340552-7b07ef5fac56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBnYXRoZXJpbmclMjBkaW5uZXJ8ZW58MXx8fHwxNzU5NjA0OTEwfDA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "7", title: "Birthday Party", imageUrl: "https://images.unsplash.com/photo-1623244736886-1108836855e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBiaXJ0aGRheSUyMGNlbGVicmF0aW9ufGVufDF8fHx8MTc1OTYwNDkxNXww&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "8", title: "Christmas Together", imageUrl: "https://images.unsplash.com/photo-1545622783-b3e021430fee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBjaHJpc3RtYXMlMjBob2xpZGF5fGVufDF8fHx8MTc1OTYwNDkyMHww&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "9", title: "Happy Moments", imageUrl: "https://images.unsplash.com/photo-1665802117152-73f00cce89bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBsYXVnaGluZyUyMHRvZ2V0aGVyfGVufDF8fHx8MTc1OTYwNDkyMXww&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "10", title: "Family Gathering", imageUrl: "https://images.unsplash.com/photo-1699570340552-7b07ef5fac56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBnYXRoZXJpbmclMjBkaW5uZXJ8ZW58MXx8fHwxNzU5NjA0OTEwfDA&ixlib=rb-4.1.0&q=80&w=1080" },
  ],
  togetherTime: [
    { id: "11", title: "Cooking Together", imageUrl: "https://images.unsplash.com/photo-1758874960466-fb0a3e0007bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBjb29raW5nJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzU5NTAwNTI1fDA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "12", title: "Game Night", imageUrl: "https://images.unsplash.com/photo-1599690352319-c3e8f571ddb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBnYW1lJTIwbmlnaHR8ZW58MXx8fHwxNzU5NjA0OTIwfDA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "13", title: "Grandchildren Playing", imageUrl: "https://images.unsplash.com/photo-1670234794408-030a53941f87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFuZGNoaWxkcmVuJTIwcGxheWluZyUyMGtpZHN8ZW58MXx8fHwxNzU5NjA0OTExfDA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "14", title: "Cooking Memories", imageUrl: "https://images.unsplash.com/photo-1758874960466-fb0a3e0007bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBjb29raW5nJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzU5NTAwNTI1fDA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "15", title: "Quality Time", imageUrl: "https://images.unsplash.com/photo-1599690352319-c3e8f571ddb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBnYW1lJTIwbmlnaHR8ZW58MXx8fHwxNzU5NjA0OTIwfDA&ixlib=rb-4.1.0&q=80&w=1080" },
  ],
  outdoors: [
    { id: "16", title: "Beach Vacation", imageUrl: "https://images.unsplash.com/photo-1552249352-02a0817a2d95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjB2YWNhdGlvbiUyMGJlYWNofGVufDF8fHx8MTc1OTUyNTgzMHww&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "17", title: "Park Walk", imageUrl: "https://images.unsplash.com/photo-1600999664509-69c4c6918e13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjB3YWxraW5nJTIwcGFya3xlbnwxfHx8fDE3NTk2MDQ5MTd8MA&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "18", title: "Picnic Day", imageUrl: "https://images.unsplash.com/photo-1528163353686-48373b77425f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBwaWNuaWMlMjBvdXRkb29yfGVufDF8fHx8MTc1OTU4MTA0Mnww&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "19", title: "Garden Time", imageUrl: "https://images.unsplash.com/photo-1548323678-0644152a2b88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBnYXJkZW4lMjBvdXRkb29yfGVufDF8fHx8MTc1OTYwNDkyMXww&ixlib=rb-4.1.0&q=80&w=1080" },
    { id: "20", title: "Family Adventure", imageUrl: "https://images.unsplash.com/photo-1552249352-02a0817a2d95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjB2YWNhdGlvbiUyMGJlYWNofGVufDF8fHx8MTc1OTUyNTgzMHww&ixlib=rb-4.1.0&q=80&w=1080" },
  ],
};

export default function App() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <HeroSection
        title="Our Family Memories"
        description="Relive the special moments and cherished memories with the whole family. Watch together, laugh together, and celebrate the love that binds us all."
        imageUrl="https://images.unsplash.com/photo-1624448445915-97154f5e688c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBwb3J0cmFpdCUyMGhhcHB5fGVufDF8fHx8MTc1OTU1NDM3NXww&ixlib=rb-4.1.0&q=80&w=1080"
      />
      <div className="relative -mt-32 space-y-8 pb-16">
        <ContentRow title="Precious Family Moments" content={mockContent.familyMoments} />
        <ContentRow title="Special Celebrations" content={mockContent.celebrations} />
        <ContentRow title="Together Time" content={mockContent.togetherTime} />
        <ContentRow title="Outdoor Adventures" content={mockContent.outdoors} />
      </div>
    </div>
  );
}
