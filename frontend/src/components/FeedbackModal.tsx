import React, { useState } from "react";
import { motion } from "framer-motion";

interface FeedbackModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose, onSubmit }) => {
    const [recommend, setRecommend] = useState(5);
    const [useful, setUseful] = useState(5);
    const [feature, setFeature] = useState("");
    const [comments, setComments] = useState("");

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen bg-black/40 backdrop-blur-sm">
            <motion.div
                className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
            >
                <h2 className="text-xl font-semibold mb-4">We'd love to know your thoughts!</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit({ recommend, useful, feature, comments });
                        onClose();
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block font-medium mb-1">
                            How excited would you be for a full-featured, next version of this
                            product?{" "}
                            <span className="text-xs text-gray-400">
                                (1=Not at all, 10=Extremely)
                            </span>
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={recommend}
                            onChange={(e) => setRecommend(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="text-center text-sm mt-1">{recommend}</div>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">
                            How useful is this product to learn from multiple contents or documents?{" "}
                            <span className="text-xs text-gray-400">
                                (1=Not useful, 10=Very useful)
                            </span>
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={useful}
                            onChange={(e) => setUseful(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="text-center text-sm mt-1">{useful}</div>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">
                            What features do you think are nice-to-have for a AI-powered tutor?
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value="Speech Mode"
                                    checked={feature.includes("Speech Mode")}
                                    onChange={(e) => {
                                        if (e.target.checked)
                                            setFeature(
                                                feature ? feature + ",Speech Mode" : "Speech Mode"
                                            );
                                        else
                                            setFeature(
                                                feature
                                                    .split(",")
                                                    .filter((f) => f !== "Speech Mode")
                                                    .join(",")
                                            );
                                    }}
                                />
                                <span>Speech Mode</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value="Highlight & Explain"
                                    checked={feature.includes("Highlight & Explain")}
                                    onChange={(e) => {
                                        if (e.target.checked)
                                            setFeature(
                                                feature
                                                    ? feature + ",Highlight & Explain"
                                                    : "Highlight & Explain"
                                            );
                                        else
                                            setFeature(
                                                feature
                                                    .split(",")
                                                    .filter((f) => f !== "Highlight & Explain")
                                                    .join(",")
                                            );
                                    }}
                                />
                                <span>Highlight & Explain</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value="Diagram board"
                                    checked={feature.includes("Diagram board")}
                                    onChange={(e) => {
                                        if (e.target.checked)
                                            setFeature(
                                                feature
                                                    ? feature + ",Diagram board"
                                                    : "Diagram board"
                                            );
                                        else
                                            setFeature(
                                                feature
                                                    .split(",")
                                                    .filter((f) => f !== "Diagram board")
                                                    .join(",")
                                            );
                                    }}
                                />
                                <span>Diagram board</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value="Multilingual Support"
                                    checked={feature.includes("Multilingual Support")}
                                    onChange={(e) => {
                                        if (e.target.checked)
                                            setFeature(
                                                feature
                                                    ? feature + ",Multilingual Support"
                                                    : "Multilingual Support"
                                            );
                                        else
                                            setFeature(
                                                feature
                                                    .split(",")
                                                    .filter((f) => f !== "Multilingual Support")
                                                    .join(",")
                                            );
                                    }}
                                />
                                <span>Multilingual Support</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value="Fun & Interactivity"
                                    checked={feature.includes("Fun & Interactivity")}
                                    onChange={(e) => {
                                        if (e.target.checked)
                                            setFeature(
                                                feature
                                                    ? feature + ",Fun & Interactivity"
                                                    : "Fun & Interactivity"
                                            );
                                        else
                                            setFeature(
                                                feature
                                                    .split(",")
                                                    .filter((f) => f !== "Fun & Interactivity")
                                                    .join(",")
                                            );
                                    }}
                                />
                                <span>Fun & Interactivity</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">One quick suggestion?</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full border rounded px-2 py-1"
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default FeedbackModal;
