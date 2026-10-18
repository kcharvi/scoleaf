import { motion } from "framer-motion";
import { MessageSquare, Mic, Download, User, Trash2 } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { useState } from "react";
import { toast } from "sonner";
import FeedbackModal from "./FeedbackModal";

const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL;

const PanelHeader = () => {
    const {
        currentMode,
        setCurrentMode,
        pdfFile,
        uploadedFileId,
        setPdfFile,
        setUploadedFileId,
        resetConversation,
    } = useAppStore();

    const { user, signOut, profile } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const uploadAttempts = profile?.upload_count ?? 0;

    const handleRemoveDocument = () => {
        setUploadedFileId(null);
        setPdfFile(null);
        resetConversation();
    };

    const handleDownloadPDF = async () => {
        if (!uploadedFileId) return;

        try {
            const blob = await apiService.downloadPDF(uploadedFileId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `highlighted_${pdfFile?.name || "document.pdf"}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setShowUserMenu(false);
    };

    return (
        <div className="relative z-20 mt-4 max-w-2xl w-[90%] mx-auto">
          {/* Gradient border for glassmorphism effect */}
          <div className="rounded-2xl p-[2.5px] bg-gradient-to-br from-[rgba(209,169,128,0.35)] via-[rgba(116,136,115,0.18)] to-[rgba(255,255,255,0.25)] shadow-lg">
            <motion.div
              className="flex items-center justify-between px-6 py-3 bg-white/40 backdrop-blur-xl rounded-2xl min-h-[64px]"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
            {/* Left: Logo only */}
            <div className="flex items-center gap-3 select-none">
                {/* <img src="/logo.svg" alt="Scoleaf Logo" className="w-5 h-5" /> */}
                <span className="text-lg font-semibold text-[color:var(--color-leaf)] tracking-tight">Scoleaf</span>
            </div>

            {/* Center: (removed for minimalism) */}
            <div className="flex-1" />

            {/* Right: Controls & User */}
            <div className="flex items-center gap-3 min-w-[220px]">
                {/* Clear PDF */}
                {uploadedFileId && (
                    <button
                        onClick={handleRemoveDocument}
                        className="p-2 rounded-lg transition-colors"
                        title="Clear PDF"
                    >
                        <Trash2 className="w-4 h-4" color="var(--color-leaf)" />
                    </button>
                )}
                {/* Download PDF */}
                {uploadedFileId && (
                    <button
                        onClick={handleDownloadPDF}
                        className="p-2 bg-[color:var(--color-leaf)] hover:bg-[color:var(--color-dust)] text-white hover:text-[color:var(--color-leaf)] rounded-lg transition-colors duration-150"
                        title="Download PDF with highlights"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                )}
                {/* Mode Switcher */}
                <div className="flex items-center bg-[color:var(--color-stone)]/40 rounded-full px-1 py-1 gap-1 min-w-[110px]">
                    <button
                        onClick={() => setCurrentMode("text")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
                            ${currentMode === "text"
                                ? "bg-[color:var(--color-leaf)] text-white shadow"
                                : "text-[color:var(--color-leaf)] hover:bg-[color:var(--color-leaf)]/10"}
                        `}
                        style={{ minWidth: 54 }}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Text</span>
                    </button>
                    <button
                        onClick={() => setCurrentMode("speech")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
                            ${currentMode === "speech"
                                ? "bg-[color:var(--color-dust)] text-white shadow"
                                : "text-[color:var(--color-dust)] hover:bg-[color:var(--color-dust)]/10"}
                        `}
                        style={{ minWidth: 54 }}
                    >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Speak</span>
                    </button>
                </div>
                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-8 h-8 bg-gradient-to-br from-[color:var(--color-leaf)] to-[color:var(--color-dust)] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        <User className="w-4 h-4 text-white" />
                    </button>
                    {showUserMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-[9999]"
                        >
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-700">Signed in as</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                <p className="text-xs text-[color:var(--color-sand)] mt-2">{uploadAttempts}/3 uploads used</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                                <span>Sign Out</span>
                            </button>
                            <button
                                onClick={() => setShowFeedback(true)}
                                className="w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2"
                            >
                                <span>Anonymous Feedback</span>
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
            <FeedbackModal
                open={showFeedback}
                onClose={() => setShowFeedback(false)}
                onSubmit={async (data) => {
                    try {
                        // Use FormData instead of JSON to avoid CORS preflight
                        const formData = new FormData();
                        formData.append("recommend", data.recommend.toString());
                        formData.append("useful", data.useful.toString());
                        formData.append("feature", data.feature || "");
                        formData.append("comments", data.comments || "");
                        formData.append("timestamp", new Date().toISOString());

                        const response = await fetch(FEEDBACK_URL, {
                            method: "POST",
                            body: formData, // No Content-Type header needed for FormData
                        });

                        const result = await response.json();
                        if (result.success) {
                            toast.success("Thank you for your feedback!");
                        } else {
                            toast.error(result.error || "Failed to submit feedback.");
                        }
                    } catch (err) {
                        console.error("Feedback submission error:", err);
                        toast.error("Could not submit feedback. Please try again later.");
                    }
                }}
            />
            </motion.div>
          </div>
        </div>
    );
};

export default PanelHeader;
