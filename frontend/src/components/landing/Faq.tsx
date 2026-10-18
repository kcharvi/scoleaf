import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqData = [
    {
        question: "What exactly is Scoleaf?",
        answer: "Scoleaf is a personalized, interactive tutor that helps you learn directly from documents. It explains, highlights, scrolls, quizzes, and even jokes. Think of it as a fun, voice-enabled tutor that lives inside your study material.",
    },
    {
        question: "Why Scoleaf and not just YouTube or ChatGPT?",
        answer: "Because you're not here to just watch or ask. You're here to engage. Scoleaf works inside YOUR materials PDFs, slides, or anything! And it's built to talk back, challenge you, and adapt to how you learn.",
    },
    {
        question: "Is it really free?",
        answer: "Yes—for now, you get full access with up to 3 PDFs per user. Speech mode, explanations, and visualizations are all included. We want everyone to experience what modern learning feels like.",
    },
    {
        question: "Is there a paid version coming?",
        answer: "Absolutely. We're cooking up a premium version packed with more uploads, smarter explanations, AI memory, deeper personalization, and… a roast mode (yes, really). Stay tuned!",
    },
    {
        question: "What makes Scoleaf different from other AI tools?",
        answer: "Scoleaf doesn't throw information at you, it walks with you. It understands your pace, language, tone, and even jokes. No dull moments, no video fatigue, just learning with vibes.",
    },
    {
        question: "Are you fundraising or open to partnerships?",
        answer: "Yes! We're actively exploring funding opportunities to take Scoleaf to the next level. If you believe in fun, free, and inclusive learning... LET'S TALK!",
    },
];

const FaqItem = ({
    question,
    answer,
    isOpen,
    onClick,
}: {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}) => {
    return (
        <div className="border-b border-[color:var(--color-stone)] py-6">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left"
            >
                <h3 className="text-lg font-medium text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>{question}</h3>
                {isOpen ? (
                    <Minus className="w-6 h-6 text-[color:var(--color-dust)]" />
                ) : (
                    <Plus className="w-6 h-6 text-[color:var(--color-dust)]" />
                )}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: "16px" }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="text-gray-600 leading-relaxed" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Faq = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="bg-[color:var(--color-stone)]/60 py-16 sm:py-20">
            <div className="max-w-3xl mx-auto px-12">
                <h2 className="text-3xl font-bold text-left text-[color:var(--color-leaf)] mb-10" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Frequently asked questions
                </h2>
                <div>
                    {faqData.map((item, index) => (
                        <FaqItem
                            key={index}
                            question={item.question}
                            answer={item.answer}
                            isOpen={openIndex === index}
                            onClick={() => handleToggle(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Faq;
