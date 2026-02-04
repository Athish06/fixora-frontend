import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api } from '../services/api';
import { toast } from 'sonner';

const AIKnowledgeBase = () => {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      const data = await api.getAIPatterns();
      setPatterns(data);
    } catch (error) {
      toast.error('Failed to load AI patterns');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (patternId, isCorrect) => {
    try {
      await api.verifyAIPattern(patternId, isCorrect);
      toast.success(isCorrect ? 'Pattern verified' : 'Pattern rejected');
      fetchPatterns();
    } catch (error) {
      toast.error('Failed to update pattern');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="ai-knowledge-base">
        <div>
          <h1 className="text-4xl font-bold mb-2">AI Knowledge Base</h1>
          <p className="text-muted-foreground text-lg">
            Patterns discovered by AI that you can verify
          </p>
        </div>

        <div className="space-y-4">
          {patterns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No AI patterns discovered yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan your repositories to discover patterns
                </p>
              </CardContent>
            </Card>
          ) : (
            patterns.map((pattern, index) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-primary/30 transition-all" data-testid={`pattern-${index}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{pattern.pattern_name}</CardTitle>
                          <Badge variant="outline">{pattern.pattern_type}</Badge>
                          {pattern.is_verified && (
                            <Badge variant={pattern.user_override ? 'default' : 'destructive'}>
                              {pattern.user_override ? 'Verified' : 'Rejected'}
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{pattern.description}</CardDescription>
                      </div>
                      {!pattern.is_verified && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(pattern.id, true)}
                            className="border-green-500 text-green-500 hover:bg-green-500/10"
                            data-testid={`verify-btn-${index}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(pattern.id, false)}
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            data-testid={`reject-btn-${index}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Confidence: <span className="text-primary font-semibold">
                          {(pattern.confidence * 100).toFixed(0)}%
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Discovered: {new Date(pattern.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIKnowledgeBase;
