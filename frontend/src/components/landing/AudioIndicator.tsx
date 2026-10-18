import { motion } from "framer-motion";

function AudioIndicator() {
    const bars = [
        { baseHeight: 12, delay: 0 },
        { baseHeight: 18, delay: 0.1 },
        { baseHeight: 14, delay: 0.2 },
        { baseHeight: 12, delay: 0.3 },
        { baseHeight: 16, delay: 0.4 },
        { baseHeight: 18, delay: 0.5 },
        { baseHeight: 14, delay: 0.6 },
        { baseHeight: 12, delay: 0.7 },
        { baseHeight: 16, delay: 0.8 },
        { baseHeight: 18, delay: 0.9 },
        { baseHeight: 14, delay: 1.0 },
        { baseHeight: 12, delay: 1.1 },
        { baseHeight: 16, delay: 1.2 },
        { baseHeight: 18, delay: 1.3 },
        { baseHeight: 14, delay: 1.4 },
        { baseHeight: 12, delay: 1.5 },
    ];

    return (
        <svg
            width="206"
            height="64"
            viewBox="0 0 103 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g filter="url(#filter0_i_1_2713)">
                {bars.map((bar, index) => (
                    <motion.rect
                        key={index}
                        x={14 + index * 5}
                        width="2"
                        rx="1"
                        initial={{
                            fill: "#6C47F6",
                            height: bar.baseHeight,
                            y: 16 - bar.baseHeight / 2,
                        }}
                        animate="hover"
                        variants={{
                            initial: {
                                fill: "#16A568",
                                height: bar.baseHeight,
                                y: 16 - bar.baseHeight / 2,
                            },
                            hover: {
                                fill: "#16A568",
                                height: bar.baseHeight * 1.5,
                                y: 16 - (bar.baseHeight * 1.5) / 2,
                                transition: {
                                    duration: 0.6,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    delay: bar.delay,
                                    ease: "easeInOut",
                                },
                            },
                        }}
                    />
                ))}
            </g>
            <defs>
                <filter
                    id="filter0_i_1_2713"
                    x="0"
                    y="-2"
                    width="103"
                    height="34"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset dy="-2" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0.647059 0 0 0 0 0.682353 0 0 0 0 0.721569 0 0 0 0.5 0"
                    />
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1_2713" />
                </filter>
                <linearGradient
                    id="paint0_linear_1_2713"
                    x1="16.5"
                    y1="16"
                    x2="86.5"
                    y2="16"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A5AEB8" stopOpacity="0.25" />
                    <stop offset="0.496333" stopColor="#A5AEB8" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#A5AEB8" stopOpacity="0.25" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export default AudioIndicator;
