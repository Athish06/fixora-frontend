import React, { useState, useEffect } from 'react';
import ScanVisualizer from './ScanVisualizer';
import { motion } from 'framer-motion';
import { Eye, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';

const DemoVisualizer = () => {
  const { id } = useParams();
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepo = async () => {
      try {
        const data = await api.getRepository(id);
        setRepo(data);
      } catch (error) {
        console.error('Failed to fetch repository for demo', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRepo();
  }, [id]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={`/repositories/${id}`} className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Back to Repository
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">Fixora</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-medium px-4 py-2 bg-muted/50 rounded-lg shadow-sm border border-border/50">
              Presentation Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2"
          >
            <Eye className="w-4 h-4" />
            <span>Interactive Demo</span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-5xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            How Fixora Understands {repo?.name || 'Your Code'}
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Watch how our pipeline automatically discovers the framework, identifies dangerous abstractions, and generates custom security rules—all without human intervention.
          </motion.p>
        </div>

        {/* Visualizer Container */}
        <motion.div
          className="bg-card border border-border/50 rounded-2xl shadow-xl shadow-black/5 p-6 md:p-8 min-h-[500px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 25 }}
        >
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <Loader2 className="w-10 h-10 animate-spin text-primary" />
             </div>
          ) : repo?.latest_scan_id ? (
            <ScanVisualizer scanId={repo.latest_scan_id} repositoryId={id} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Eye className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm max-w-sm">
                No scans have been run on this repository yet. Start a scan to view the pipeline visualizer.
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default DemoVisualizer;
