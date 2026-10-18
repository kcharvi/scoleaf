import { useState } from "react";
import { motion } from "framer-motion";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase";
import { ArrowRight, X } from "lucide-react";
import Faq from "./landing/Faq";
import Footer from "./landing/Footer";
import { TextLoop } from "./motion-primitives/text-loop";

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-xl p-8 max-w-md w-full relative z-[10000]"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-[10001]"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-[color:var(--color-leaf)] mb-2">Welcome to Scoleaf</h2>
                    <p className="text-gray-600">Sign in or create your account to get started</p>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: "#0d9488",
                                    brandAccent: "#0d9488",
                                    brandButtonText: "white",
                                    defaultButtonBackground: "#f0fdfa",
                                    defaultButtonBackgroundHover: "#f0fdfa",
                                    inputBackground: "white",
                                    inputBorder: "#e5e7eb",
                                    inputBorderHover: "#0d9488",
                                    inputBorderFocus: "#0d9488",
                                },
                            },
                        },
                        className: {
                            container: "auth-container",
                            button: "auth-button",
                            input: "auth-input",
                        },
                    }}
                    providers={[]}
                    redirectTo={`${window.location.origin}`}
                    onlyThirdPartyProviders={false}
                />
            </motion.div>
        </div>
    );
};

const LandingPage = () => {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
            <div className="relative z-10">
                {/* Header with Logo and Try Beta Button */}
                <header className="pt-12 pb-8 bg-[color:var(--color-stone)]/60 backdrop-blur-md">
                    <div className="max-w-3xl mx-auto px-12">
                        {/* Logo and Scoleaf text left-aligned */}
                        <div className="flex flex-col space-y-2 pl-4">
                            {/* Logo Icon */}
                            <img src="/siteicon.svg" alt="Scoleaf Logo" className="w-16 h-16 rounded-sm" />
                            {/* Scoleaf text below logo - left-aligned */}
                            <span className="text-3xl font-semibold text-[color:var(--color-leaf)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                <span style={{ color: "var(--color-dust)" }}>Sco</span>
                                <span style={{ color: "var(--color-leaf)" }}>leaf</span>
                            </span>
                        </div>
                        {/* Tagline aligned with start of Scoleaf text */}
                        <span className="text-md text-gray-600 mt-2 pl-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>Your Personal Tutor for Everything</span>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="flex flex-col items-start justify-start pt-2 relative bg-[color:var(--color-stone)]/60">
                    <div className="max-w-3xl mx-auto px-12">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-3xl font-bold mb-6 text-left text-[color:var(--color-leaf)]"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        >
                            Learn&nbsp;
                            <TextLoop
                                className="overflow-y-clip"
                                transition={{
                                    type: "spring",
                                    stiffness: 900,
                                    damping: 80,
                                    mass: 10,
                                }}
                                variants={{
                                    initial: {
                                        y: 20,
                                        rotateX: 90,
                                        opacity: 0,
                                        filter: "blur(4px)",
                                    },
                                    animate: {
                                        y: 0,
                                        rotateX: 0,
                                        opacity: 1,
                                        filter: "blur(0px)",
                                    },
                                    exit: {
                                        y: -20,
                                        rotateX: -90,
                                        opacity: 0,
                                        filter: "blur(4px)",
                                    },
                                }}
                            >
                                <span>anything.</span>
                                <span>anywhere.</span>
                                <span>anytime.</span>
                                <span>in any language.</span>
                                <span>any style.</span>
                            </TextLoop>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-md text-gray-600 mb-6 max-w-2xl leading-relaxed text-left"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        >
                            Turn any PDF, article, or website into a personal lesson.<br />
                            Ask anything and get instant answers with diagrams, highlights, and notes in your language.<br />
                            No more boring materials, no waiting days. Just real, interactive learning, anytime you want.
                        </motion.p>

                        <div className="flex items-center space-x-4">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                onClick={() => setModalOpen(true)}
                                className="group bg-[color:var(--color-leaf)] text-white px-8 py-2 rounded-lg text-md font-medium hover:bg-[color:var(--color-dust)] transition-colors duration-300 flex items-center space-x-2 shadow mb-6"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                            >
                                <span>Try Beta Now</span>
                                <ArrowRight className="w-5 h-5 transition-colors group-hover:text-[color:var(--color-dust)] group-hover:translate-x-1 duration-300" />
                            </motion.button>
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                                onClick={() => window.open('mailto:info@scoleaf.com', '_blank')}
                                className="group border border-[color:var(--color-leaf)] text-[color:var(--color-leaf)] px-8 py-2 rounded-lg text-md font-medium hover:bg-[color:var(--color-leaf)] hover:text-white transition-colors duration-300 flex items-center space-x-2 shadow mb-6"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                            >
                                <span>Contact Us</span>
                            </motion.button>
                        </div>
                    </div>
                </section>

                {/* Video Section */}
                {/* <section className="pt-2 pb-6 bg-[color:var(--color-stone)]/60">
                    <div className="max-w-3xl mx-auto px-12">
                        <div className="w-full rounded-xl overflow-hidden shadow-lg">
                            <iframe 
                                width="100%" 
                                height="300" 
                                src="https://www.youtube.com/embed/7k40caY6ls4?si=CncLfOYXHEplgC68&modestbranding=1&rel=0&showinfo=0&controls=0&disablekb=1&iv_load_policy=3&fs=0&color=white&playsinline=1&loop=0&mute=0&autoplay=0" 
                                title="Scoleaf Demo Video" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                referrerPolicy="strict-origin-when-cross-origin" 
                                allowFullScreen
                                className="w-full h-[300px]"
                            ></iframe>
                        </div>
                    </div>
                </section> */}
                <section className="pt-2 pb-6 bg-[color:var(--color-stone)]/60">
                    <div className="max-w-3xl mx-auto px-12">
                        <div className="w-full rounded-xl overflow-hidden shadow-lg">
                            <video
                                width="100%"
                                height="300"
                                controls
                                className="w-full h-[300px]"
                            >
                                <source src="/demo_scoleaf.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </section>

                {/* <BentoGrid /> */}
                <Faq />
                {/* <motion.img
                    src="/faq_illustration.svg"
                    alt="Decorative element"
                    className="absolute bottom-20 right-2 w-[300px] max-w-none opacity-50 hidden md:block"
                    initial={{ opacity: 0, x: 100, rotate: 15 }}
                    whileInView={{ opacity: 0.5, x: 0, rotate: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                /> */}
                {/* CTA Section */}
                {/* <section className="px-6 py-20 bg-[color:var(--color-stone)]/80">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="relative bg-white/90 backdrop-blur-sm rounded-xl p-12 border border-[color:var(--color-stone)] shadow-lg"
                        >
                            <BorderTrail />
                            <h3 className="text-3xl font-bold text-[color:var(--color-leaf)] mb-4">
                                Ready to revolutionize your learning?
                            </h3>
                            <p className="text-lg text-[color:var(--color-leaf)]/80 mb-8">
                                Join thousands of learners who are already transforming their
                                learning experience.
                            </p>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="mx-auto group bg-[color:var(--color-leaf)] text-white px-8 py-2 rounded-lg text-lg font-medium hover:bg-[color:var(--color-dust)] hover:text-[color:var(--color-leaf)] transition-colors duration-300 flex items-center space-x-2 shadow"
                            >
                                <span>Get Started Now</span>
                                <ArrowRight className="w-5 h-5 transition-colors group-hover:text-[color:var(--color-dust)] group-hover:translate-x-1 duration-300" />
                            </button>
                        </motion.div>
                    </div>
                </section> */}
                <Footer />
            </div>

            {/* Auth Modal */}
            <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

            <style>{`
        .auth-container {
          border: none;
          box-shadow: none;
          padding: 0;
        }
        .auth-button,
        .supabase-auth-ui_ui-button,
        .c-bOcPnF {
                  background-color: var(--color-leaf) !important;
                  color: white !important;
                  border-radius: 0.5rem !important;
                  padding: 0.5rem 2rem !important;
                  font-size: 1.125rem !important;
                  font-weight: 500 !important;
                  border: none !important;
                  cursor: pointer !important;
                  transition: all 0.3s ease !important;
        }
        .auth-button:hover,
        .supabase-auth-ui_ui-button:hover,
        .c-bOcPnF:hover {
                   background-color: white !important;
                   color: var(--color-leaf) !important;
                   border: 1px solid var(--color-leaf) !important;
                   transform: translateY(-1px) !important;
                   box-shadow: 0 4px 12px rgba(116, 136, 115, 0.2) !important;
        }
        .auth-input {
                   border-radius: 0.5rem;
          padding: 12px 20px;
          border: 1px solid var(--color-stone);
        }
        .auth-input:focus {
                   border-color: var(--color-leaf);
                   box-shadow: 0 0 0 2px rgba(116, 136, 115, 0.2);
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
