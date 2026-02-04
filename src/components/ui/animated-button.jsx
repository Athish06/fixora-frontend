import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button as ShadcnButton } from './button';
import { cn } from '../../lib/utils';

const AnimatedButton = ({
    children,
    className = '',
    variant = 'default',
    size = 'default',
    loading = false,
    ripple = true,
    ...props
}) => {
    const [ripples, setRipples] = useState([]);

    const addRipple = (event) => {
        if (!ripple) return;

        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const newRipple = {
            x,
            y,
            size,
            id: Date.now(),
        };

        setRipples((prev) => [...prev, newRipple]);

        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
    };

    return (
        <ShadcnButton
            className={cn('relative overflow-hidden', className)}
            variant={variant}
            size={size}
            disabled={loading}
            onClick={addRipple}
            {...props}
        >
            {ripples.map((ripple) => (
                <motion.span
                    key={ripple.id}
                    className="absolute bg-white/30 rounded-full pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size,
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                />
            ))}
            {loading ? (
                <motion.div
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            ) : (
                children
            )}
        </ShadcnButton>
    );
};

export default AnimatedButton;
