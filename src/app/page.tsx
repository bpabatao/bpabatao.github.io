import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Work } from "@/components/Work";
import { Approach } from "@/components/Approach";
import { StackGrid } from "@/components/StackGrid";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Projects />
      <Work />
      <Approach />
      <StackGrid />
      <Contact />
    </main>
  );
}
