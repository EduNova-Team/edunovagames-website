import Header from "@/components/Header";
import Hero from "@/components/Hero";
// import Research from "@/components/Research";
// import AISection from "@/components/AISection";
// import { Services } from "@/components/Services";
import Solutions from "@/components/Solutions";
import Blog from "@/components/Blog";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        {/* <Research /> */}
        {/* <AISection /> */}
        {/* <Services /> */}
        <Solutions />
        <Blog />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}
