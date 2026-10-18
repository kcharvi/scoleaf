import {
    CircleDot,
    BookOpen,
    Mic,
    Languages,
    FileText,
    PenSquare,
    MessageCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import AudioIndicator from "./AudioIndicator";

const deployments = [
    {
        name: "Smart Highlights",
        description: "Interactive highlights that make complex ideas click.",
        status: "New",
        dotColor: "text-green-500",
    },
    {
        name: "Voice That Teaches",
        description: "AI that converses and guides you through documents.",
        status: "New",
        dotColor: "text-green-500",
    },
    {
        name: "See It, Get It",
        description: "Visual cues that turn confusion into clarity.",
        status: "New",
        dotColor: "text-green-500",
    },
];

const integrations = [
    {
        name: "Realtime Text and Speech Mode",
        icon: Mic,
        iconBgColor: "bg-teal-50", // #f0fdfa
        // iconColor: "text-teal-600", // #0d9488
        iconColor: "#16A568",
    },
    {
        name: "Ask Anything, Anytime",
        icon: MessageCircle,
        iconBgColor: "bg-purple-50", // #faf5ff
        // iconColor: "text-purple-600", // #9333ea
        iconColor: "#6C47F6",
    },
    {
        name: "Multiple Languages",
        icon: Languages,
        iconBgColor: "bg-sky-50", // #f0f9ff
        // iconColor: "text-sky-600", // #0284c7
        iconColor: "#3C8AFE",
    },
    {
        name: "Whiteboard It",
        icon: PenSquare,
        iconBgColor: "bg-yellow-50", // #fefce8
        // iconColor: "text-yellow-600", // #ca8a04
        iconColor: "#FFD215",
    },
    {
        name: "Automatic Highlighting",
        icon: FileText,
        iconBgColor: "bg-rose-50", // #fff1f2
        // iconColor: "text-rose-600", // #e11d48
        iconColor: "#F32626",
    },
    {
        name: "Smarter Explanations",
        icon: BookOpen,
        iconBgColor: "bg-indigo-50", // #eef2ff
        // iconColor: "text-indigo-600", // #4f46e5
        iconColor: "#4f46e5",
    },
];

const stats = [
    { name: "Growing User Base", value: "405+" },
    { name: "Low-Latency Inference", value: "<350", unit: "ms" },
];

const tabs = ["Voice Mode", "Chat Mode", "Highlight", "Illustrations"];

const BentoGrid = () => {
    const [currentDeployment, setCurrentDeployment] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);

    // Auto-flip through deployments every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentDeployment((prev) => (prev + 1) % deployments.length);
                setIsFlipping(false);
            }, 250);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <style>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            <section className="bg-[color:var(--color-stone)] text-[color:var(--color-leaf)] py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-[color:var(--color-leaf)] mb-4">
                            First-ever interactive AI agent. Learning without limits
                        </h2>
                        <p className="text-xl text-[color:var(--color-leaf)]/80 max-w-2xl mx-auto">
                            Designed to make learning intuitive, engaging, and effective.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Top-left card: Deployments */}
                        <div className="bg-white rounded-xl border border-[color:var(--color-stone)] overflow-hidden lg:col-span-3 flex flex-col relative">
                            {/* Background Image */}
                            <img
                                src="/application.png"
                                alt="Application preview background"
                                className="absolute inset-0 w-full h-full object-cover"
                                aria-hidden="true"
                            />
                            <div className="p-6 flex-1 flex flex-col relative z-10">
                                <h3 className="text-sm font-semibold text-[color:var(--color-leaf)]/80">
                                    Application Preview
                                </h3>
                                <div className="flex-1"></div>
                                <div
                                    className="mt-4 transition-transform duration-300"
                                    style={{
                                        transformStyle: "preserve-3d",
                                        perspective: "1000px",
                                        transform: isFlipping ? "rotateX(90deg)" : "rotateX(0deg)",
                                    }}
                                >
                                    <div className="flex items-center justify-between bg-[color:var(--color-stone)] p-4 rounded-lg border border-[color:var(--color-stone)]">
                                        <div className="flex items-center">
                                            <CircleDot
                                                className={`h-5 w-5 ${deployments[currentDeployment].dotColor}`}
                                            />
                                            <div className="ml-3">
                                                <p className="font-medium text-[color:var(--color-leaf)] text-lg">
                                                    {deployments[currentDeployment].name}
                                                </p>
                                                <p className="text-sm text-[color:var(--color-leaf)]/80 mt-1">
                                                    {deployments[currentDeployment].description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <span
                                                className={`text-sm px-3 py-1 rounded-full ${
                                                    deployments[currentDeployment].status === "New"
                                                        ? "bg-[color:var(--color-dust)] text-[color:var(--color-leaf)]"
                                                        : "bg-[color:var(--color-stone)] text-[color:var(--color-leaf)]/80"
                                                }`}
                                            >
                                                {deployments[currentDeployment].status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top-right card: Integrations */}
                        <div className="bg-white p-6 rounded-xl border border-[color:var(--color-stone)] relative lg:col-span-2">
                            <div className="absolute inset-0 bg-dots-pattern -z-10" />
                            <h4 className="text-sm text-[color:var(--color-leaf)]/80">Integrations</h4>
                            <h3 className="text-lg font-semibold text-[color:var(--color-leaf)] mt-2">
                                Feature Rich Scoleaf
                            </h3>
                            <p className="text-[color:var(--color-leaf)]/80 mt-1">
                                Talk with your documents and learn quickly with personallized modes
                                and features
                            </p>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                {integrations.map((integration) => (
                                    <div
                                        key={integration.name}
                                        className="flex items-center bg-[color:var(--color-stone)] p-2 rounded-lg border border-[color:var(--color-stone)]"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${integration.iconBgColor}`}
                                        >
                                            <integration.icon
                                                className="w-6 h-6"
                                                style={{ color: integration.iconColor }}
                                            />
                                        </div>
                                        <span className="ml-3 text-[color:var(--color-leaf)]/80 font-medium text-sm">
                                            {integration.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom-left card: Security */}
                        <div className="bg-white p-6 rounded-xl border border-[color:var(--color-stone)] flex flex-col justify-between lg:col-span-2">
                            <div>
                                <h4 className="text-sm text-[color:var(--color-leaf)]/80">AI Tutor</h4>
                                <h3 className="text-lg font-semibold text-[color:var(--color-leaf)] mt-1">
                                    Smarter Explanations, Instantly.
                                </h3>
                                <p className="text-[color:var(--color-leaf)]/80 mt-2">
                                    Every student deserves a tutor that scrolls, speaks, and
                                    occasionally roasts. Reads your PDF, scrolls with you,
                                    highlights key points, and explains like your smartest and
                                    sassiest friend.
                                </p>
                            </div>
                            <div className="flex justify-center items-center mt-6">
                                <AudioIndicator />
                            </div>
                        </div>

                        {/* Bottom-right card: Stats */}
                        <div className="bg-white rounded-xl border border-[color:var(--color-stone)] p-6 lg:col-span-3 relative">
                            <img
                                src="/box_illustrations.svg"
                                alt="Decorative box illustrations"
                                className="absolute bottom-0 right-0 w-[350px] max-w-none opacity-80 pointer-events-none hidden lg:block"
                            />
                            <div>
                                <div className="border-[color:var(--color-stone)]">
                                    <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide pb-2 md:overflow-x-visible md:pb-0">
                                        {tabs.map((tab) => (
                                            <div
                                                key={tab}
                                                className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors border-transparent text-[color:var(--color-leaf)]/80 hover:text-[color:var(--color-leaf)] hover:border-[color:var(--color-leaf)] cursor-default flex-shrink-0"
                                            >
                                                {tab}
                                            </div>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="flex items-center">
                                    <img
                                        src="/bullet_illustration.svg"
                                        alt="Bullet illustration"
                                        className="w-6 h-6"
                                    />
                                    <p className="font-medium text-[color:var(--color-leaf)] ml-3">
                                        High-Quality/Low-Latency Explanations
                                    </p>
                                </div>
                                <p className="text-sm text-[color:var(--color-leaf)]/80 ml-8">
                                    Join other users in learning with Scoleaf
                                </p>
                            </div>
                            <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 text-center divide-x divide-[color:var(--color-stone)]">
                                {stats.map((stat) => (
                                    <div key={stat.name} className="px-4 py-2">
                                        <p className="text-sm text-[color:var(--color-leaf)]/80">{stat.name}</p>
                                        <p className="text-4xl font-bold text-[color:var(--color-leaf)] mt-1 flex items-baseline justify-center">
                                            {stat.value}
                                            {stat.unit && (
                                                <span className="text-sm font-normal text-[color:var(--color-leaf)]/80 ml-1">
                                                    {stat.unit}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default BentoGrid;
