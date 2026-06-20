import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode, ChevronDown, ChevronRight, AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '../ui/badge';

const functionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25 },
  }),
};

const FunctionNode = ({ fn, index }) => {
  const hasSinkCalls = (fn.calls || []).length > 0;

  return (
    <motion.div
      className={`border rounded-lg p-3 space-y-2 transition-colors ${
        hasSinkCalls
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-border/50 bg-card'
      }`}
      custom={index}
      variants={functionVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {hasSinkCalls && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </motion.div>
          )}
          <code className="font-mono font-semibold text-sm text-foreground">
            {fn.name}()
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">
            L{fn.line_start}–{fn.line_end}
          </span>
          {!fn.has_auth_check && fn.environment?.includes('Backend') && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/30 text-yellow-400">
              No Auth
            </Badge>
          )}
        </div>
      </div>

      {/* Calls */}
      {hasSinkCalls && (
        <div className="flex flex-wrap gap-1">
          {fn.calls.map((call, ci) => (
            <motion.span
              key={call}
              className="px-1.5 py-0.5 bg-red-500/15 border border-red-500/25 text-red-400 rounded text-[10px] font-mono"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + ci * 0.05 + 0.3 }}
            >
              {call}
            </motion.span>
          ))}
        </div>
      )}

      {/* Modules */}
      {(fn.modules_used || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fn.modules_used.map((mod) => (
            <span
              key={mod}
              className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-[10px] font-mono"
            >
              {mod}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const FileGroup = ({ fileData, globalIndex }) => {
  const [expanded, setExpanded] = useState(true);
  const fileName = fileData.file?.split('/').pop() || 'unknown';
  const filePath = fileData.file || 'unknown';

  return (
    <motion.div
      className="border border-border/40 rounded-xl overflow-hidden bg-card/50"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: globalIndex * 0.15 }}
    >
      <button
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <FileCode className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-medium truncate flex-1">{fileName}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{filePath}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5">
          {fileData.total_functions} fn{fileData.total_functions !== 1 ? 's' : ''}
        </Badge>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="px-4 pb-3 space-y-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fileData.functions.map((fn, fi) => (
              <FunctionNode key={fn.name + fi} fn={fn} index={fi} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ASTWalkStage = ({ data }) => {
  const files = data?.files || [];
  const totalWrappers = data?.total_wrappers || 0;
  const sampledWrappers = data?.sampled_wrappers || 0;

  if (!files.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Shield className="w-12 h-12 opacity-30" />
        <p>No wrapper functions found in this scan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <motion.div
        className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border border-border/40 rounded-xl text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-foreground font-medium">{totalWrappers}</span>
        <span className="text-muted-foreground">wrapper functions extracted</span>
        {sampledWrappers < totalWrappers && (
          <span className="text-xs text-muted-foreground/60 ml-auto">
            Showing {sampledWrappers} representative samples
          </span>
        )}
      </motion.div>

      {/* Scanning cursor effect */}
      <motion.div
        className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      {/* File groups */}
      <div className="space-y-3">
        {files.map((fileData, fi) => (
          <FileGroup key={fileData.file + fi} fileData={fileData} globalIndex={fi} />
        ))}
      </div>
    </div>
  );
};

export default ASTWalkStage;
