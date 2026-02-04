import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const AnimatedCard = ({
    children,
    className = '',
    hover = true,
    glassmorphism = false,
    ...props
}) => {
    return (
        <motion.div
            className={cn(
                'rounded-lg border transition-all duration-300',
                glassmorphism && 'glass-card',
                !glassmorphism && 'bg-card border-border',
                hover && 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/30',
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={hover ? { scale: 1.02 } : {}}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedCard;
