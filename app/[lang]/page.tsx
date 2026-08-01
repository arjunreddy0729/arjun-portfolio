import ScrollProgress from "@/components/layout/scroll-progress";
import ManifestoFlow from "@/components/effects/manifesto-flow";
import Hero from "@/components/sections/hero";
import About from "@/components/sections/about";
import Stack from "@/components/sections/stack";
import Projects from "@/components/sections/projects";
import Architecture from "@/components/sections/architecture";
import Experience from "@/components/sections/experience";
import Roadmap from "@/components/sections/roadmap";
import Credentials from "@/components/sections/credentials";
import Assistant from "@/components/sections/assistant";
import Contact from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      <ScrollProgress />

      <main className="bg-background relative">

        <Hero />

        <div className="relative z-10 bg-background border-t border-border">

          <section id="about">
            <About />
          </section>

          <ManifestoFlow />

          <section id="stack">
            <Stack />
          </section>

          <ManifestoFlow reverse />

          <section id="projects">
            <Projects />
          </section>

          <section id="architecture">
            <Architecture />
          </section>

          <ManifestoFlow />

          <section id="experience">
            <Experience />
          </section>

          <section id="roadmap">
            <Roadmap />
          </section>

          <ManifestoFlow reverse />

          <section id="certifications">
            <Credentials />
          </section>

          <section id="assistant">
            <Assistant />
          </section>

          <section id="contact">
            <Contact />
          </section>

        </div>

      </main >
    </>
  );
}
