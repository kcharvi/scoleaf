import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    LiveKitRoom,
    useRoomContext,
    useLocalParticipant,
    useVoiceAssistant,
} from '@livekit/components-react';
import { RoomEvent, type TranscriptionSegment, type Participant, type RemoteParticipant, type RpcInvocationData } from 'livekit-client';
import { apiService } from '../services/api';
import type { PDFViewerRef } from '../components/PDFViewer';

// Add this at the top of the file, after imports
declare global {
  interface Window {
    setActiveIllustrations?: any;
    closeActiveIllustrationAndAddToWhiteboard?: (id: string) => void;
  }
}

export type AgentState = 'offline' | 'connecting' | 'listening' | 'thinking' | 'speaking';

export interface Illustration {
    type: 'image' | 'mermaid' | 'roughjs' | 'equation' | 'animation';
    content: any;
}

export type ActiveIllustration = Illustration & { id: string };

export interface AnimationSpec {
    id: string;
    spec: any;
    duration: number;
    agent?: RemoteParticipant;
    illustrations: Illustration[];
    animations: AnimationSpec[];
    activeIllustrations: ActiveIllustration[];
}

export interface ToolCall {
    id: string;
    toolName: string;
}

export interface Transcription {
    segment: TranscriptionSegment;
    participant?: Participant;
}

interface SpeechContextType {
    connect: (pdfId?: string) => Promise<void>;
    disconnect: () => Promise<void>;
    isConnected: boolean;
    isConnecting: boolean;
    agentState: AgentState;
    transcriptions: Transcription[];
    agent?: RemoteParticipant;
    illustrations: Illustration[];
    animations: AnimationSpec[];
    activeIllustrations: ActiveIllustration[];
    toolCalls: ToolCall[];
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

// Inner provider to access context from LiveKitRoom
const InnerSpeechProvider = ({
    children,
    outerState,
    pdfViewerRef,
  }: {
    children: ReactNode;
    outerState: Omit<SpeechContextType, 'agentState' | 'transcriptions' | 'agent' | 'illustrations' | 'animations' | 'activeIllustrations' | 'toolCalls'> & { setDisconnectHandler: (handler: any) => void; };
    pdfViewerRef?: React.RefObject<PDFViewerRef>;
  }) => {
    const room = useRoomContext();
    const { agent } = useVoiceAssistant();
    const { localParticipant } = useLocalParticipant();
    const [agentState, setAgentState] = useState<AgentState>('offline');
    const [rawSegments, setRawSegments] = useState<Record<string, Transcription>>({});
    const [displayTranscriptions, setDisplayTranscriptions] = useState<Transcription[]>([]);
    const [illustrations, setIllustrations] = useState<Illustration[]>([]);
    const [animations, setAnimations] = useState<AnimationSpec[]>([]);
    const [activeIllustrations, setActiveIllustrations] = useState<ActiveIllustration[]>([]);
    const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

    useEffect(() => {
        outerState.setDisconnectHandler(() => () => room.disconnect());
    }, [room, outerState.setDisconnectHandler]);

    useEffect(() => {
        if (!agent) {
            setAgentState('offline');
            return;
        }

        const onStateChange = () => {
            const stateAttr = agent.attributes['lk-agent-state'];
            if (stateAttr) {
                setAgentState(stateAttr as AgentState);
            }
        };

        agent.on('attributesChanged', onStateChange);
        onStateChange();

        return () => {
            agent.off('attributesChanged', onStateChange);
        };
    }, [agent]);

    useEffect(() => {
        const updateRawSegments = (
            segments: TranscriptionSegment[],
            participant?: Participant,
        ) => {
            setRawSegments((prev) => {
                const newSegments = { ...prev };
                for (const segment of segments) {
                    newSegments[segment.id] = { segment, participant };
                }
                return newSegments;
            });
        };
        room.on(RoomEvent.TranscriptionReceived, updateRawSegments);

        return () => {
            room.off(RoomEvent.TranscriptionReceived, updateRawSegments);
        };
    }, [room]);
    
    useEffect(() => {
        const sorted = Object.values(rawSegments).sort(
            (a, b) => (a.segment.startTime ?? 0) - (b.segment.startTime ?? 0)
        );
        setDisplayTranscriptions(sorted);
    }, [rawSegments]);

    // Register RPC handlers
    useEffect(() => {
        const handleScroll = async (data: RpcInvocationData): Promise<string> => {
            const payload = JSON.parse(data.payload as string);
            console.log('Received scroll RPC:', payload);
            try {
                if (pdfViewerRef?.current?.scrollToPage) {
                    pdfViewerRef.current.scrollToPage(payload.page_number);
                    return JSON.stringify({ success: true });
                } else {
                    console.warn('Cannot scroll, pdfViewerRef.current.scrollToPage is not available');
                    return JSON.stringify({ success: false, error: 'scrollToPage not available' });
                }
            } catch (e: any) {
                console.error("Error handling scroll RPC:", e);
                return JSON.stringify({ success: false, error: e.message });
            }
        };

        const handleHighlight = async (data: RpcInvocationData): Promise<string> => {
            const payload = JSON.parse(data.payload as string);
            console.log('Received highlight RPC:', payload);
            try {
                if (!pdfViewerRef?.current || !payload.rects || payload.rects.length === 0) {
                  console.warn('Cannot handle highlight, ref or rects missing', { refExists: !!pdfViewerRef?.current, rects: payload.rects });
                  return JSON.stringify({ success: false, error: 'Cannot handle highlight, ref or rects missing' });
                }

                const { page_number, rects } = payload;

                // Compute proper width and height for each rect
                const processedRects = rects.map((rect: any) => ({
                  ...rect,
                  width: rect.x2 - rect.x1,
                  height: rect.y2 - rect.y1,
                  pageNumber: page_number
                }));

                const boundingRect = {
                  x1: Math.min(...rects.map((r: any) => r.x1)),
                  y1: Math.min(...rects.map((r: any) => r.y1)),
                  x2: Math.max(...rects.map((r: any) => r.x2)),
                  y2: Math.max(...rects.map((r: any) => r.y2)),
                  width: Math.max(...rects.map((r: any) => r.x2)) - Math.min(...rects.map((r: any) => r.x1)), 
                  height: Math.max(...rects.map((r: any) => r.y2)) - Math.min(...rects.map((r: any) => r.y1)),
                  pageNumber: page_number,
                };

                const highlightPayload = {
                    id: `agent-highlight-${Date.now()}`,
                    position: { 
                      pageNumber: page_number, 
                      boundingRect: boundingRect,
                      rects: processedRects,
                      usePdfCoordinates: true, // This tells the library these are PDF coordinates
                    },
                };
                
                console.log('Dispatching highlight to PDFViewer:', highlightPayload);
                console.log('Position structure:', JSON.stringify(highlightPayload.position, null, 2));
                pdfViewerRef.current.addAgentHighlight(highlightPayload);
                return JSON.stringify({ success: true });
            } catch (e: any) {
                console.error("Error handling highlight RPC:", e);
                return JSON.stringify({ success: false, error: e.message });
            }
        };

        const handleDisplayIllustration = async (data: RpcInvocationData): Promise<string> => {
            try {
                const payload = JSON.parse(data.payload as string);
                console.log('Received display_illustration RPC:', payload);

                const newIllustration: ActiveIllustration = {
                    id: `ill-${Date.now()}`,
                    type: payload.type,
                    content: payload.content,
                };

                setActiveIllustrations((prev) => [...prev, newIllustration]);

                // After a duration, move from active overlay to whiteboard
                const timeoutId = setTimeout(() => {
                    setActiveIllustrations((prev) => prev.filter((a) => a.id !== newIllustration.id));
                    setIllustrations((prev) => [...prev, { type: newIllustration.type, content: newIllustration.content }]);
                    delete illustrationTimeouts[newIllustration.id];
                }, 30000); // 30-second display duration
                illustrationTimeouts[newIllustration.id] = timeoutId;

                return JSON.stringify({ success: true });
            } catch (e: any) {
                console.error("Error handling display_illustration RPC:", e);
                return JSON.stringify({ success: false, error: e.message });
            }
        };

        const handleDisplayAnimation = async (data: RpcInvocationData): Promise<string> => {
            try {
                const payload = JSON.parse(data.payload as string);
                console.log('Received display_animation RPC:', payload);
                // Safe parse utility to handle slight JSON formatting issues (e.g., trailing commas, code fences)
                const safeParse = (input: string) => {
                    try {
                        return JSON.parse(input);
                    } catch {
                        // Remove markdown fences and trim
                        const cleaned = input
                          .replace(/```[\s\S]*?```/g, '')
                          .replace(/^```[a-zA-Z]*\n|```$/g, '')
                          .replace(/\r?\n|\r/g, ' ');
                        // Remove trailing commas before } or ]
                        const noTrailingCommas = cleaned.replace(/,\s*(}[\s]*|][\s]*)/g, '$1');
                        try {
                            return JSON.parse(noTrailingCommas);
                        } catch (e) {
                            try {
                                // Final fallback: evaluate as JS object (dangerous but limited to tutor-controlled input)
                                // Wrap in parentheses to allow object literal return
                                // eslint-disable-next-line no-new-func
                                return new Function(`return (${noTrailingCommas})`)();
                            } catch (err) {
                                console.error('Still failed to parse animation spec:', err, '\nInput:', input);
                                throw err;
                            }
                        }
                    }
                };

                const specObj = typeof payload.spec === 'string' ? safeParse(payload.spec) : payload.spec;
                const id = `anim-${Date.now()}`;
                
                const newAnimation: AnimationSpec = {
                    id: id,
                    spec: specObj,
                    duration: payload.duration || 5000,
                    agent,
                    illustrations: [],
                    animations: [],
                    activeIllustrations: [],
                };

                setAnimations((prev) => [...prev, newAnimation]);
                return JSON.stringify({ success: true });
            } catch (e: any) {
                console.error("Error handling display_animation RPC:", e);
                return JSON.stringify({ success: false, error: e.message });
            }
        };

        const handleToolCall = async (data: RpcInvocationData): Promise<string> => {
            try {
                const payload = JSON.parse(data.payload as string);
                console.log('Received tool_call RPC:', payload);

                if (payload.event === 'start') {
                    const newToolCall: ToolCall = {
                        id: payload.id || `tool-${Date.now()}`,
                        toolName: payload.tool_name,
                    };
                    setToolCalls((prev) => [...prev, newToolCall]);
                } else if (payload.event === 'end') {
                    setToolCalls((prev) => prev.filter((tc) => tc.id !== payload.id));
                }
                
                return JSON.stringify({ success: true });
            } catch (e: any) {
                console.error("Error handling tool_call RPC:", e);
                return JSON.stringify({ success: false, error: e.message });
            }
        };

        if (localParticipant) {
            localParticipant.registerRpcMethod('scroll_to_page', handleScroll);
            localParticipant.registerRpcMethod('highlight_text', handleHighlight);
            localParticipant.registerRpcMethod('display_illustration', handleDisplayIllustration);
            localParticipant.registerRpcMethod('display_animation', handleDisplayAnimation);
            localParticipant.registerRpcMethod('tool_call', handleToolCall);
        }

        return () => {
            if (localParticipant) {
                localParticipant.unregisterRpcMethod('scroll_to_page');
                localParticipant.unregisterRpcMethod('highlight_text');
                localParticipant.unregisterRpcMethod('display_illustration');
                localParticipant.unregisterRpcMethod('display_animation');
                localParticipant.unregisterRpcMethod('tool_call');
            }
        };
    }, [room, localParticipant, pdfViewerRef]);

    const illustrationTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

    useEffect(() => {
        // Expose setActiveIllustrations for overlay close button workaround
        window.setActiveIllustrations = setActiveIllustrations;
        // Expose a function to immediately move an active illustration to the whiteboard
        window.closeActiveIllustrationAndAddToWhiteboard = (id: string) => {
            // Clear the timeout if it exists
            if (illustrationTimeouts[id]) {
                clearTimeout(illustrationTimeouts[id]);
                delete illustrationTimeouts[id];
            }
            setActiveIllustrations((prev) => {
                const found = prev.find((a) => a.id === id);
                if (found) {
                    setIllustrations((prevIll) => [...prevIll, { type: found.type, content: found.content }]);
                }
                return prev.filter((a) => a.id !== id);
            });
        };
    }, [setActiveIllustrations, setIllustrations]);

    const state = {
        ...outerState,
        agentState,
        transcriptions: displayTranscriptions,
        agent,
        illustrations,
        animations,
        activeIllustrations,
        toolCalls,
    };

    return <SpeechContext.Provider value={state}>{children}</SpeechContext.Provider>;
};


export const SpeechProvider = ({ children, pdfViewerRef }: { children: ReactNode; pdfViewerRef?: React.RefObject<PDFViewerRef> }) => {
    const [token, setToken] = useState<string | undefined>(undefined);
    const [livekitUrl, setLivekitUrl] = useState<string | undefined>(undefined);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [disconnectHandler, setDisconnectHandler] = useState<(() => void) | null>(null);

    const connect = useCallback(async (pdfId?: string) => {
        setIsConnecting(true);
        try {
            const res = await apiService.getLiveKitToken({ pdf_id: pdfId });
            setToken(res.token);
            setLivekitUrl(res.url);
            setIsConnected(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        if (disconnectHandler) {
            disconnectHandler();
        }
        setIsConnected(false);
        setToken(undefined);
        setLivekitUrl(undefined);
    }, [disconnectHandler]);
    
    const value = {
        connect,
        disconnect,
        isConnected,
        isConnecting,
        setDisconnectHandler,
        agentState: 'offline', // Default value, will be updated by inner provider
        transcriptions: [], // Default value
        agent: undefined, // Default value
        illustrations: [], // Default value
        animations: [], // Default value
        activeIllustrations: [], // Default value
        toolCalls: [], // Default value
    };

    const serverUrl = livekitUrl || import.meta.env.VITE_LIVEKIT_URL;

    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={!!(token && serverUrl)}
            audio={true}
            video={false}
            onDisconnected={disconnect}
            onConnected={() => setIsConnected(true)}
            options={{
                publishDefaults: {
                  videoCodec: 'vp9',
                  dtx: true,
                },
                adaptiveStream: { pixelDensity: 'screen' },
              }}
        >
            <InnerSpeechProvider outerState={value} pdfViewerRef={pdfViewerRef}>
                {children}
            </InnerSpeechProvider>
        </LiveKitRoom>
    );
};

export const useSpeech = (): SpeechContextType => {
    const context = useContext(SpeechContext);
    if (context === undefined) {
        throw new Error('useSpeech must be used within a SpeechProvider');
    }
    return context;
}; 