import React from 'react';
import { motion } from 'framer-motion';
import { Zap, FileCode, ArrowRight } from 'lucide-react';

const RuleGenStage = ({ data }) => {
  const rulesGenerated = data?.rules_generated || 0;
  const yamlPreview = data?.yaml_preview || '';
  const hasFullYaml = data?.has_full_yaml || false;

  return (
    <div className="space-y-6">
      {/* Compilation animation */}
      <motion.div
        className="flex items-center justify-center gap-6 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Finding cards */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center relative">
            <span className="text-2xl">🐛</span>
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <span className="text-[9px] text-white font-bold">{rulesGenerated}</span>
            </motion.div>
          </div>
          <span className="text-[10px] text-muted-foreground">Findings</span>
        </motion.div>

        {/* Animated compilation arrow */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <motion.div
            className="h-0.5 w-8 bg-gradient-to-r from-red-500/40 to-yellow-500/60 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="w-5 h-5 text-yellow-400" />
          </motion.div>
          <motion.div
            className="h-0.5 w-8 bg-gradient-to-r from-yellow-500/60 to-emerald-500/40 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
          <ArrowRight className="w-4 h-4 text-emerald-400" />
        </motion.div>

        {/* YAML output */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
        >
          <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <FileCode className="w-7 h-7 text-emerald-400" />
          </div>
          <span className="text-[10px] text-muted-foreground">.fixora-rules.yml</span>
        </motion.div>
      </motion.div>

      {/* Rules count */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <span className="text-3xl font-bold text-foreground">{rulesGenerated}</span>
        <p className="text-sm text-muted-foreground mt-1">
          custom Semgrep rule{rulesGenerated !== 1 ? 's' : ''} generated
        </p>
      </motion.div>

      {/* YAML preview */}
      {yamlPreview ? (
        <motion.div
          className="bg-card border border-border/50 rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/30">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-muted-foreground">.fixora-rules.yml</span>
            <span className="text-[10px] text-muted-foreground/60 ml-auto">preview</span>
          </div>
          <pre className="text-xs font-mono p-4 whitespace-pre-wrap text-foreground/80 leading-relaxed max-h-64 overflow-y-auto">
            {yamlPreview}
          </pre>
          {hasFullYaml && (
            <div className="px-4 py-2 border-t border-border/30 text-center">
              <span className="text-[10px] text-muted-foreground">
                Preview truncated — full YAML available in AI Debug tab
              </span>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-6 text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          No custom rules generated — no vulnerable wrappers were found.
        </motion.div>
      )}
    </div>
  );
};

export default RuleGenStage;
