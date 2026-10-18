const Footer = () => {
    return (
        <footer className="bg-[color:var(--color-stone)]/60 backdrop-blur-md">
            <div className="max-w-3xl mx-auto py-8 px-12">
                {/* Minimal separator */}
                <div className="w-full h-px bg-[color:var(--color-leaf)]/20 mb-8"></div>
                
                <div className="flex justify-between items-center">
                    <p className="text-sm text-[color:var(--color-leaf)]/70">© 2025 Scoleaf. All rights reserved.</p>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => window.open('mailto:info@scoleaf.com', '_blank')}
                            className="px-3 py-1.5 rounded-full bg-[color:var(--color-leaf)]/5 hover:bg-[color:var(--color-leaf)]/10 text-[color:var(--color-leaf)]/60 hover:text-[color:var(--color-leaf)]/80 transition-all duration-200 text-xs font-medium"
                        >
                            info@scoleaf.com
                        </button>
                        <button
                            onClick={() => window.open('https://www.linkedin.com/company/scoleaf/', '_blank')}
                            className="px-3 py-1.5 rounded-full bg-[color:var(--color-leaf)]/5 hover:bg-[color:var(--color-leaf)]/10 text-[color:var(--color-leaf)]/60 hover:text-[color:var(--color-leaf)]/80 transition-all duration-200 text-xs font-medium"
                        >
                            LinkedIn
                        </button>
                        <button
                            onClick={() => window.open('https://www.instagram.com/tryscoleaf', '_blank')}
                            className="px-3 py-1.5 rounded-full bg-[color:var(--color-leaf)]/5 hover:bg-[color:var(--color-leaf)]/10 text-[color:var(--color-leaf)]/60 hover:text-[color:var(--color-leaf)]/80 transition-all duration-200 text-xs font-medium"
                        >
                            Instagram
                        </button>
                        <button
                            onClick={() => window.open('https://www.youtube.com/@Scoleaf', '_blank')}
                            className="px-3 py-1.5 rounded-full bg-[color:var(--color-leaf)]/5 hover:bg-[color:var(--color-leaf)]/10 text-[color:var(--color-leaf)]/60 hover:text-[color:var(--color-leaf)]/80 transition-all duration-200 text-xs font-medium"
                        >
                            YouTube
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
