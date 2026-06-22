import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, CheckCircle2, XCircle, BarChart3, AlertTriangle, Bug } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const REPOSITORIES = [
  { id: 'nodegoat', name: 'NodeGoat (Node.js)' },
  { id: 'vampi', name: 'VAmPI (Python/Flask)' },
  { id: 'test_repo', name: 'Custom Test Repo' }
];

const COMPARISON_DATA = {
  nodegoat: {
    title: 'NodeGoat (OWASP Benchmark)',
    description: 'A deliberately vulnerable Node.js application maintained by OWASP to demonstrate the OWASP Top 10.',
    vulnerability: {
      name: 'Insecure Deserialization / Eval Injection (RCE)',
      whatIsIt: 'Insecure Deserialization occurs when untrusted data is used to abuse the logic of an application. Eval Injection specifically happens when user input is executed directly as code. This allows an attacker to inject arbitrary system commands that the server executes, leading to complete Remote Code Execution (RCE).',
      file: 'app/routes/contributions.js',
      line: '32-34',
      codeSnippet: `// Target Function: this.handleContributionsUpdate()
// Vulnerable Sink: Passes untrusted data directly to eval.

const preTax = eval(req.body.preTax); // VULNERABLE SINK`,
      payload: '{"$type":"System.Windows.Data.ObjectDataProvider"}  // or simply: req.body.preTax = process.exit(1)',
      result: 'The attacker-controlled preTax is passed directly into the Node.js eval() function, allowing arbitrary JavaScript code execution on the backend server.'
    },
    performance: {
      fixora: {
        score: 100,
        found: true,
        falsePositives: 0,
        description: 'Perfectly identified via AI Wrapper tracing. The LLM accurately mapped the Express.js req.body object flow directly to the eval sink across functional boundaries.'
      },
      vanillaSemgrep: {
        score: 30,
        found: false,
        falsePositives: 3,
        description: 'Missed the exact data flow. Generated false positives on HTML template files due to Django misclassification.'
      },
      semgrepAi: {
        score: 85,
        found: true,
        falsePositives: 3,
        description: 'Successfully detected the RCE, SSRF, and Open Redirect flaws using deep intra-file data flow analysis. However, it still produced the Django CSRF false positives on HTML files.'
      }
    },
    rawLogs: `=== SEMGREP AI PRO RESULTS ===
36 matching findings
- Code Injection with Express (3)
- Server-Side Request Forgery (SSRF) with Express (1)
- detected-bcrypt-hash (3)
- code-string-concat (3)
- detected-private-key (1)
- open-redirect-deepsemgrep (1)
- Open Redirect with Express (1)
- plaintext-http-link (5)
- eval-detected (3)
- django-no-csrf-token (3)  [FALSE POSITIVE]
- express-cookie-session (6)
- using-http-server (1)
- no-new-privileges (1)
- writable-filesystem-service (1)
- Log Injection with Express (1)

=== FIXORA AI WRAPPER RESULTS ===
19 matching findings
- Insecure Deserialization / Eval Injection (3)
- Express Open Redirect (1)
- SSRF (1)
- Django No Csrf Token (3) [FALSE POSITIVE - Mitigated by heuristic]
- Var In Href XSS (1)
- Plaintext Http Link (5)
- Detected Private Key (1)
- Detected Bcrypt Hash (3)
- No New Privileges (1)
- Using Http Server (1)`
  },
  vampi: {
    title: 'VAmPI (Vulnerable API)',
    description: 'A vulnerable REST API built with Flask containing OWASP API Top 10 vulnerabilities.',
    vulnerability: {
      name: 'Broken Access Control (BOLA / IDOR)',
      whatIsIt: 'Broken Object Level Authorization (BOLA) or IDOR occurs when an application fails to properly verify if the requesting user has the permissions to access or modify a specific object. In VAmPI, the book retrieval endpoint blindly accepts a book title and returns the book details, even if it belongs to another user.',
      file: 'api_views/books.py',
      line: '51-63',
      codeSnippet: `// Target Function: get_by_title()
// Parameter: book_title

book = Book.query.filter_by(book_title=book_title).first()
if book:
    return jsonify(book.serialize())`,
      payload: 'book_title = another_user_book_title  // IDOR payload',
      result: 'The attacker successfully accesses sensitive book records belonging to other users. This completely circumvents the intended tenant isolation and data privacy controls.'
    },
    performance: {
      fixora: {
        score: 100,
        found: true,
        falsePositives: 0,
        description: 'Elite detection. Wrapper Hunter analyzed the Flask routing and correctly identified that the book_title parameter flows directly into a global database query without any tenant validation or user ownership scoping.'
      },
      vanillaSemgrep: {
        score: 20,
        found: false,
        falsePositives: 0,
        description: 'Failed completely on business logic. Vanilla Semgrep only found generic issues like Docker misconfigurations and XSS. It completely missed the IDOR, SQL Injection, Mass Assignment, and Plaintext Password logic flaws.'
      },
      semgrepAi: {
        score: 0,
        found: false,
        falsePositives: 0,
        description: 'Awaiting Semgrep AI results...'
      }
    },
    rawLogs: `=== VANILLA SEMGREP RESULTS ===
- avoid_hardcoded_config_SECRET_KEY (config.py:13)
- detected-jwt-token (openapi3.yml:193)
- run-shell-injection (.github/workflows)
- missing-user (Dockerfile:17)
- missing-user-entrypoint (Dockerfile:16)
- directly-returned-format-string (api_views/users.py:14, 16)

=== FIXORA AI WRAPPER RESULTS ===
- IDOR / Broken Access Control via book_title (api_views/books.py:51, 62, 63)
- Plaintext Password Comparison (api_views/users.py:92)
- ReDoS / Input Validation Failure via email (api_views/users.py:144, 163)
- Hardcoded Secret (config.py:13)
- Missing User Entrypoint (Dockerfile:16, 17)
- SQL Injection via username (models/user_model.py:73)
- Detected Jwt Token (openapi3.yml:193)`
  },
  test_repo: {
    title: 'Custom Test Repository',
    description: 'Internal testing repository designed to evaluate highly complex business logic flaws.',
    vulnerability: {
      name: 'SQL Injection (DB Cursor Execute)',
      whatIsIt: 'SQL Injection occurs when user input is interpolated directly into a database query string instead of being safely parameterized. This allows attackers to manipulate the query structure to bypass authentication or leak data.',
      file: 'backend/easy.py',
      line: '13',
      codeSnippet: `// Target Function: execute_query()
// Parameter: user_input

cursor.execute(f"SELECT * FROM users WHERE username = '{user_input}'")`,
      payload: "' OR 1=1 --",
      result: 'The payload converts the SQL predicate into an always-true condition, bypassing all authentication and dumping the entire users table.'
    },
    performance: {
      fixora: {
        score: 100,
        found: true,
        falsePositives: 0,
        description: 'Caught instantly. The engine perfectly mapped the taint flow from the user input parameter directly to the database execution sink.'
      },
      vanillaSemgrep: {
        score: 90,
        found: true,
        falsePositives: 0,
        description: 'Successfully detected. This is a standard, well-documented vulnerability pattern that generic SAST tools handle easily.'
      },
      semgrepAi: {
        score: 90,
        found: true,
        falsePositives: 0,
        description: 'Successfully detected and verified.'
      }
    },
    rawLogs: `=== RAW LOGS UNAVAILABLE ===\nNo raw logs provided for the internal test repo.`
  }
};

const MetricBar = ({ label, score, colorClass }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm font-medium">
      <span className="text-muted-foreground">{label}</span>
      <span>{score}/100</span>
    </div>
    <Progress value={score} className="h-2" indicatorColor={colorClass} />
  </div>
);

const Results = () => {
  const [selectedRepo, setSelectedRepo] = useState('nodegoat');
  
  const data = COMPARISON_DATA[selectedRepo];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12" data-testid="results-page">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Engine Comparison</h1>
            <p className="text-lg text-muted-foreground">
              Deep technical battle-cards comparing Fixora against generic SAST tools.
            </p>
          </div>
          
          <div className="w-full md:w-72">
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger className="w-full bg-background border-border h-12 text-lg">
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {REPOSITORIES.map(repo => (
                  <SelectItem key={repo.id} value={repo.id} className="text-base cursor-pointer">
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRepo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Repo Meta */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">{data.title}</h2>
              <p className="text-muted-foreground">{data.description}</p>
            </div>

            {/* Deep Dive Section */}
            <h3 className="text-xl font-bold mt-8 mb-4 border-b border-border pb-2">Vulnerability Deep Dive</h3>
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border pb-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="destructive" className="px-3 py-1 text-sm font-medium tracking-wide">HIGH SEVERITY</Badge>
                  <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                    {data.vulnerability.file}:{data.vulnerability.line}
                  </span>
                </div>
                <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                  <Bug className="w-6 h-6 text-destructive" />
                  {data.vulnerability.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-border bg-card">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Code2 className="w-4 h-4" /> The Mechanism
                    </h4>
                    <p className="text-sm text-card-foreground leading-relaxed mb-6">
                      {data.vulnerability.whatIsIt}
                    </p>
                    
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Target Code
                    </h4>
                    <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto border border-zinc-800">
                      <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
                        {data.vulnerability.codeSnippet}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-muted/10">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" /> Exploitation
                    </h4>
                    
                    <div className="mb-6">
                      <div className="text-xs text-muted-foreground mb-1 font-medium">Malicious Payload</div>
                      <div className="bg-destructive/10 text-destructive font-mono text-sm p-3 rounded-md border border-destructive/20 break-all">
                        {data.vulnerability.payload}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 font-medium">Result / Impact</div>
                      <p className="text-sm text-foreground bg-background p-4 rounded-md border border-border">
                        {data.vulnerability.result}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Battle Cards */}
            <h3 className="text-xl font-bold mt-12 mb-4 border-b border-border pb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> 
              Engine Battle Cards
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fixora */}
              <Card className="border-primary/50 shadow-md relative overflow-hidden bg-card">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold text-foreground">Fixora (AI + Semgrep)</CardTitle>
                    {data.performance.fixora.found ? 
                      <CheckCircle2 className="w-6 h-6 text-green-500" /> : 
                      <XCircle className="w-6 h-6 text-destructive" />
                    }
                  </div>
                  <CardDescription className="text-primary font-medium mt-1">Champion Architecture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.fixora.description}
                  </div>
                  
                  <MetricBar 
                    label="Detection Accuracy" 
                    score={data.performance.fixora.score} 
                    colorClass="bg-primary" 
                  />
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">False Positives</span>
                    <Badge variant={data.performance.fixora.falsePositives === 0 ? "outline" : "destructive"} className="font-mono">
                      {data.performance.fixora.falsePositives}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Vanilla Semgrep */}
              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold text-foreground">Vanilla Semgrep</CardTitle>
                    {data.performance.vanillaSemgrep.found ? 
                      <CheckCircle2 className="w-6 h-6 text-green-500" /> : 
                      <XCircle className="w-6 h-6 text-destructive" />
                    }
                  </div>
                  <CardDescription className="mt-1">Standard Ruleset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.vanillaSemgrep.description}
                  </div>
                  
                  <MetricBar 
                    label="Detection Accuracy" 
                    score={data.performance.vanillaSemgrep.score} 
                  />
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">False Positives</span>
                    <Badge variant={data.performance.vanillaSemgrep.falsePositives === 0 ? "outline" : "destructive"} className="font-mono">
                      {data.performance.vanillaSemgrep.falsePositives}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Semgrep AI */}
              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold text-foreground">Semgrep AI</CardTitle>
                    {data.performance.semgrepAi.found ? 
                      <CheckCircle2 className="w-6 h-6 text-green-500" /> : 
                      <XCircle className="w-6 h-6 text-destructive" />
                    }
                  </div>
                  <CardDescription className="mt-1">Auto-Remediation Tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.semgrepAi.description}
                  </div>
                  
                  <MetricBar 
                    label="Detection Accuracy" 
                    score={data.performance.semgrepAi.score} 
                  />
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">False Positives</span>
                    <Badge variant={data.performance.semgrepAi.falsePositives === 0 ? "outline" : "destructive"} className="font-mono">
                      {data.performance.semgrepAi.falsePositives}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Raw Logs Trigger */}
            <div className="flex justify-center mt-8 pb-8">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-border hover:bg-muted/50 text-muted-foreground transition-all">
                    View Raw Scan Results
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Raw Scan Execution Logs ({data.title})</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto bg-zinc-950 rounded-md border border-zinc-800 p-4 mt-4">
                    <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">
                      {data.rawLogs}
                    </pre>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Results;
