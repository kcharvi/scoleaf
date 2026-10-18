import { useRef } from "react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import PDFViewer, { type PDFViewerRef } from "./components/PDFViewer";
import ControlPanel from "./components/ControlPanel";
import ErrorBoundary from "./components/ErrorBoundary";
import BackendStatus from "./components/BackendStatus";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { SpeechProvider } from "./contexts/SpeechContext";
import { useAppStore } from "./store/appStore";

// Main app content (the existing PDF interface)
function MainApp() {
    const pdfViewerRef = useRef<PDFViewerRef>(null);
    const { pdfFile } = useAppStore();

    return (
        <SpeechProvider pdfViewerRef={pdfViewerRef}>
            <div className="relative min-h-screen w-full overflow-hidden">
                {/* Gradient Blur Background */}
                <div
                    className="absolute inset-0 -z-10"
                    style={{
                        background: "linear-gradient(90deg, #E5E0D8 60%, rgba(209,169,128,0.3) 100%)",
                        filter: "blur(70px)",
                        width: "100%",
                        height: "100%",
                    }}
                />
                {/* Backend Status Monitor - runs in background */}
                <BackendStatus />

                {/* Main Content Area */}
                <main className="flex h-screen overflow-hidden gap-4 p-4">
                    {/* PDF Viewer Area - take remaining space */}
                    <motion.div
                        className="flex-1 bg-white relative overflow-hidden rounded-[15px] shadow z-[1]"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <ErrorBoundary>
                            <PDFViewer ref={pdfViewerRef} file={pdfFile} />
                        </ErrorBoundary>
                    </motion.div>

                    {/* Control Panel - fixed width */}
                    <motion.div
                        className="w-[620px] min-w-[420px] max-w-[820px] relative rounded-[15px] shadow z-[2]"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <ErrorBoundary>
                            <ControlPanel pdfViewerRef={pdfViewerRef} />
                        </ErrorBoundary>
                    </motion.div>
                </main>
            </div>
        </SpeechProvider>
    );
}

function App() {
    return (
        <AuthProvider>
            <Toaster
                position="top-center"
                richColors
                toastOptions={{
                    style: {
                        zIndex: 9999,
                    },
                }}
            />
            <ProtectedRoute>
                <MainApp />
            </ProtectedRoute>
        </AuthProvider>
    );
}

export default App;
