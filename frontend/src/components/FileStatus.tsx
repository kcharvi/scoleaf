import { FileText } from "lucide-react";

interface FileStatusProps {
    uploadedFileId: string | null;
}

const FileStatus = ({ uploadedFileId }: FileStatusProps) => {
    if (uploadedFileId) {
        return (
            <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-md text-sm text-gray-700">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>PDF Ready</span>
                </div>
            </div>
        );
    }
    // If no PDF, render nothing
    return null;
};

export default FileStatus;
