import { AnimatePresence, motion } from 'framer-motion';
import { useSpeech } from '../contexts/SpeechContext';

interface RenderElementProps {
    element: any;
}

const RenderElement = ({ element }: RenderElementProps) => {
    const { kind, text, style = {}, initial, animate, exit } = element;

    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        ...style,
    };

    switch (kind) {
        case 'text':
            return (
                <motion.div
                    style={baseStyle}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                >
                    {typeof text === 'string' ? text : JSON.stringify(text)}
                </motion.div>
            );
        case 'box':
            return (
                <motion.div
                    style={{
                        ...baseStyle,
                        width: style.width || 120,
                        height: style.height || 120,
                        backgroundColor: style.backgroundColor || '#583CFF',
                        borderRadius: style.borderRadius || 12,
                    }}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                />
            );
        case 'circle':
            return (
                <motion.div
                    style={{
                        ...baseStyle,
                        width: style.diameter || 120,
                        height: style.diameter || 120,
                        backgroundColor: style.backgroundColor || '#00FFA3',
                        borderRadius: '50%',
                    }}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                />
            );
        case 'svg':
            if (!element.svg) return null;
            const { viewBox, elements: svgElements } = element.svg;
            const { width, height, ...restOfStyle } = style;

            return (
                <motion.div
                    style={{ ...baseStyle, ...restOfStyle }}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                >
                    <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={viewBox}
                        width={width || '100%'}
                        height={height || '100%'}
                    >
                        {svgElements?.map((el: any, idx: number) => {
                            const { tag, text, ...rest } = el;
                            const MotionTag = motion[tag as keyof typeof motion];
                            if (!MotionTag) return null;
                            return <MotionTag key={idx} {...rest}>{text}</MotionTag>;
                        })}
                    </motion.svg>
                </motion.div>
            );
        default:
            return null;
    }
};

const AnimationOverlay = () => {
    const { animations } = useSpeech();

    return (
        <AnimatePresence>
            {animations.map((anim) => (
                <motion.div
                    key={anim.id}
                    className="fixed inset-0 z-[1000] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.2, y: 300 }}
                    transition={{ duration: 0.4 }}
                    style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.2)' }}
                >
                    {/* Render elements */}
                    {anim.spec.elements?.map((el: any, idx: number) => (
                        <RenderElement key={idx} element={el} />
                    ))}
                </motion.div>
            ))}
        </AnimatePresence>
    );
};

export default AnimationOverlay; 