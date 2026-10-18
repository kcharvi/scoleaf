import { useTracks, AudioTrack, type TrackReference } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect, useRef } from 'react';

export const AgentAudio = () => {
    const tracks = useTracks(
        [{ source: Track.Source.Microphone, withPlaceholder: false }],
        { onlySubscribed: true },
    );

    // Reference to the placeholder audio element
    const placeholderAudioRef = useRef<HTMLAudioElement | null>(null);
    // Flag so we only stop the placeholder once ("only at the beginning")
    const hasRemoteStartedRef = useRef(false);

    /*
     * Start playing the placeholder music as soon as this component mounts.
     * Because the user had to click the "Start voice chat" button beforehand,
     * the browser will treat this as a user-initiated action, allowing autoplay.
     */
    useEffect(() => {
        placeholderAudioRef.current = new Audio('/music.mp3');
        placeholderAudioRef.current.loop = true;
        // Attempt to play; some browsers may block, which is fine.
        placeholderAudioRef.current.play().catch(() => {});

        // Cleanup on unmount
        return () => {
            placeholderAudioRef.current?.pause();
            placeholderAudioRef.current = null;
        };
    }, []);

    /*
     * Detect when a remote microphone track is subscribed. The moment we see
     * at least one non-local track, we stop the placeholder music and NEVER
     * start it again for the lifetime of this component.
     */
    useEffect(() => {
        if (!hasRemoteStartedRef.current && tracks.some(t => !t.participant.isLocal)) {
            hasRemoteStartedRef.current = true;
            placeholderAudioRef.current?.pause();
            placeholderAudioRef.current = null;
        }
    }, [tracks]);

    return (
        <>
            {tracks
                .filter((trackRef): trackRef is TrackReference => trackRef.publication !== undefined && !trackRef.participant.isLocal)
                .map(trackRef => (
                    <AudioTrack key={trackRef.publication.trackSid} trackRef={trackRef} />
                ))}
        </>
    );
}; 