import { motion } from "framer-motion";
import { FileText, MessageSquare, Mic, Settings, Download } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { apiService } from "../services/api";

const Header = () => {
    const { currentMode, setCurrentMode, modelStatus, pdfFile, uploadedFileId } = useAppStore();

    const getStatusColor = () => {
        switch (modelStatus) {
            case "connected":
                return "bg-notion-green-500";
            case "connecting":
                return "bg-notion-yellow-500";
            case "error":
                return "bg-notion-red-500";
            default:
                return "bg-notion-gray-400";
        }
    };

    const getStatusText = () => {
        switch (modelStatus) {
            case "connected":
                return "Connected";
            case "connecting":
                return "Connecting...";
            case "error":
                return "Error";
            default:
                return "Disconnected";
        }
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
            // You could add a toast notification here
        }
    };

    return (
        <motion.header
            className="h-16 bg-white/0 backdrop-blur-md shadow-none flex items-center justify-between px-6 rounded-2xl"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-notion-blue-500" />
                    <h1 className="text-xl font-semibold text-notion-gray-800">Scoleaf</h1>
                </div>

                {/* Download Button */}
                {uploadedFileId && (
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-notion-blue-500 hover:bg-notion-blue-600 text-white rounded-md text-sm font-medium transition-colors duration-200"
                        title="Download PDF with highlights"
                    >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                    </button>
                )}
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center space-x-4">
                <div className="flex bg-notion-gray-200 rounded-lg p-1">
                    <button
                        onClick={() => setCurrentMode("text")}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                            currentMode === "text"
                                ? "bg-white text-notion-gray-800 shadow-sm"
                                : "text-notion-gray-600 hover:text-notion-gray-800"
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Text Mode</span>
                    </button>
                    <button
                        onClick={() => setCurrentMode("speech")}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                            currentMode === "speech"
                                ? "bg-white text-notion-gray-800 shadow-sm"
                                : "text-notion-gray-600 hover:text-notion-gray-800"
                        }`}
                    >
                        <Mic className="w-4 h-4" />
                        <span>Speech Mode</span>
                    </button>
                </div>

                {/* Model Status */}
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                    <span className="text-xs text-gray-500 inline-block min-w-[80px]">
                        {getStatusText()}
                    </span>
                </div>

                {/* --- DEBUG CODE START --- */}
                <div
                    style={{
                        position: "fixed",
                        bottom: "10px",
                        left: "10px",
                        backgroundColor: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: "5px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        zIndex: 9999,
                    }}
                >
                    API URL: {import.meta.env.VITE_API_BASE_URL || "NOT SET"}
                </div>
                {/* --- DEBUG CODE END --- */}

                {/* Settings */}
                <button className="p-2 rounded-md hover:bg-notion-gray-200 transition-colors duration-200">
                    <Settings className="w-5 h-5 text-notion-gray-600" />
                </button>
            </div>
        </motion.header>
    );
};

export default Header;
