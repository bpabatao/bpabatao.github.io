import { Hero } from "@/components/Hero";
import { Approach } from "@/components/Approach";
import { Work } from "@/components/Work";
import { Projects } from "@/components/Projects";
import { StackGrid } from "@/components/StackGrid";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <Approach />
      <Work />
      <Projects />
      <StackGrid />
      <Contact />
    </main>
  );
}
