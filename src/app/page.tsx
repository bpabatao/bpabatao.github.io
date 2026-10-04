import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Work } from "@/components/Work";
import { StackGrid } from "@/components/StackGrid";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Projects />
      <Work />
      <StackGrid />
      <Contact />
    </main>
  );
}
