import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Activity, Cpu, Shield, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRightCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import api from '../../services/api';

const ASTTreeView = ({ scanId, filePath, functionName, onClose }) => {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchTree = async () => {
      try {
        setLoading(true);
        const data = await api.getASTTree(scanId, filePath, functionName);
        if (mounted) setTreeData(data);
      } catch (err) {
        if (mounted) setError(err.response?.data?.detail || err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTree();
    return () => { mounted = false; };
  }, [scanId, filePath, functionName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <Activity className="w-8 h-8 text-primary animate-pulse" />
          <motion.div
            className="absolute inset-0 border-2 border-primary rounded-full"
            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Parsing Abstract Syntax Tree...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!treeData) return null;

  return (
    <div className="p-4 bg-black/40 rounded-xl border border-border/50 relative overflow-hidden">
      {/* Background connection line */}
      <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-border/50 z-0" />

      {/* Root Node: Function Definition */}
      <motion.div 
        className="relative z-10 flex items-start gap-3 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
          <FileCode className="w-4 h-4 text-primary" />
        </div>
        <div className="bg-card border border-border/50 p-3 rounded-lg flex-1 shadow-sm">
          <div className="flex items-center justify-between">
            <code className="text-sm font-semibold text-primary">{treeData.function_name}()</code>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              L{treeData.line_start}-{treeData.line_end}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Function Definition Root</p>
        </div>
      </motion.div>

      {/* Children: Call Nodes */}
      <div className="space-y-4 relative z-10">
        {treeData.children.map((child, idx) => {
          const isSink = child.is_sink;
          const isAmbiguous = child.confidence === "name_match_unambiguous";
          
          let borderColor = "border-border/50";
          let bgColor = "bg-card";
          let icon = <CheckCircle2 className="w-4 h-4 text-muted-foreground/60" />;
          let iconBg = "bg-muted border-border/50";

          if (isSink) {
            if (isAmbiguous) {
              borderColor = "border-orange-500/50";
              bgColor = "bg-orange-500/5";
              icon = <AlertTriangle className="w-4 h-4 text-orange-400" />;
              iconBg = "bg-orange-500/20 border-orange-500/40";
            } else {
              borderColor = "border-red-500/50";
              bgColor = "bg-red-500/10";
              icon = <Shield className="w-4 h-4 text-red-500" />;
              iconBg = "bg-red-500/20 border-red-500/40";
            }
          } else if (child.call === "<plaintext-password-comparison>()") {
            borderColor = "border-red-500/50";
            bgColor = "bg-red-500/10";
            icon = <Shield className="w-4 h-4 text-red-500" />;
            iconBg = "bg-red-500/20 border-red-500/40";
          } else {
            icon = <ShieldCheck className="w-4 h-4 text-emerald-500" />;
            iconBg = "bg-emerald-500/10 border-emerald-500/30";
          }

          return (
            <motion.div 
              key={idx}
              className="flex items-start gap-3 pl-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (idx * 0.15) }}
            >
              <div className="mt-2 w-4 h-0.5 bg-border/50 shrink-0" />
              <div className={`w-8 h-8 rounded-full ${iconBg} border flex items-center justify-center shrink-0 z-10`}>
                {icon}
              </div>
              <div className={`flex-1 border ${borderColor} ${bgColor} p-3 rounded-lg shadow-sm`}>
                <div className="flex justify-between items-start">
                  <code className="text-sm text-foreground font-mono">{child.call}</code>
                  {child.line && <span className="text-[10px] text-muted-foreground font-mono">L{child.line}</span>}
                </div>
                
                {(isSink || child.resolved_module) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {child.resolved_module && (
                      <Badge variant="outline" className="text-[10px] bg-background border-border/50">
                        module: {child.resolved_module}
                      </Badge>
                    )}
                    {child.category && (
                      <Badge variant="outline" className={`text-[10px] ${isAmbiguous ? 'border-orange-500/30 text-orange-400' : 'border-red-500/30 text-red-400'}`}>
                        {child.category}
                      </Badge>
                    )}
                  </div>
                )}
                
                {child.note && (
                  <p className={`mt-2 text-xs ${isSink ? (isAmbiguous ? 'text-orange-400/80' : 'text-red-400/80') : 'text-muted-foreground'}`}>
                    {child.note}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Terminal Node: Packaged for AI */}
        {treeData.children.some(c => c.is_sink || c.call === "<plaintext-password-comparison>()") && (
          <motion.div 
            className="flex items-start gap-3 pl-4 mt-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + (treeData.children.length * 0.15) + 0.3 }}
          >
            <div className="mt-4 w-4 h-0.5 bg-border/50 shrink-0" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 z-10">
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <motion.div 
                className="h-8 w-0.5 bg-indigo-500/30"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div className="flex-1 border border-indigo-500/30 bg-indigo-500/5 p-3 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-indigo-400 flex items-center gap-2">
                <ChevronRightCircle className="w-4 h-4" />
                Packaged for AI Analysis
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Wrapper function source and context successfully extracted and forwarded to LLM Phase 1 for vulnerability assessment.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const ASTWalkStage = ({ data, scanId }) => {
  const files = data?.files || [];
  const totalWrappers = data?.total_wrappers || 0;
  const sampledWrappers = data?.sampled_wrappers || 0;

  const [selectedFile, setSelectedFile] = useState(files[0] || null);
  const [selectedFunction, setSelectedFunction] = useState(files[0]?.functions?.[0] || null);

  // When file changes, auto-select first function
  useEffect(() => {
    if (selectedFile && selectedFile.functions?.length > 0) {
      if (!selectedFile.functions.find(f => f.name === selectedFunction?.name)) {
        setSelectedFunction(selectedFile.functions[0]);
      }
    } else {
      setSelectedFunction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

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

      {/* Interactive AST Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar: Picker */}
        <div className="col-span-1 border border-border/50 bg-card rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-3 border-b border-border/50 bg-muted/20">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select File</h3>
            <select 
              className="w-full bg-background border border-border/50 rounded-md text-sm p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
              value={selectedFile?.file || ''}
              onChange={(e) => setSelectedFile(files.find(f => f.file === e.target.value))}
            >
              {files.map(f => (
                <option key={f.file} value={f.file}>{f.file.split('/').pop()}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">Wrapper Functions</h3>
            {selectedFile?.functions?.map((fn, idx) => {
              const isSelected = selectedFunction?.name === fn.name;
              const hasSinkCalls = (fn.calls || []).length > 0;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedFunction(fn)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors flex items-center justify-between ${
                    isSelected 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-muted text-foreground/80'
                  }`}
                >
                  <span className="truncate">{fn.name}()</span>
                  {hasSinkCalls && <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-orange-400'}`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Area: AST Tree */}
        <div className="col-span-1 md:col-span-2 border border-border/50 bg-card rounded-xl overflow-y-auto h-[500px] p-4 relative">
          {selectedFunction ? (
            selectedFunction.has_source ? (
              <ASTTreeView 
                scanId={scanId} 
                filePath={selectedFile.file} 
                functionName={selectedFunction.name} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <FileCode className="w-12 h-12 text-muted-foreground/30" />
                <div>
                  <h3 className="text-lg font-medium text-foreground">Source Unavailable</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                    AST traversal requires raw source code, which was not captured for this wrapper (likely to save payload space or because it was an early trace).
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              Select a function to view its AST tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ASTWalkStage;
