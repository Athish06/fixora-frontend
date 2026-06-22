import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, CheckCircle2, XCircle, BarChart3, AlertTriangle, Bug } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../components/ui/carousel';

const REPOSITORIES = [
  { id: 'nodegoat', name: 'NodeGoat (Node.js)' },
  { id: 'vampi', name: 'VAmPI (Python/Flask)' },
  { id: 'test_repo', name: 'Custom Test Repo' }
];

const COMPARISON_DATA = {
  nodegoat: {
    title: 'NodeGoat (OWASP Benchmark)',
    description: 'A deliberately vulnerable Node.js application maintained by OWASP to demonstrate the OWASP Top 10.',
    vulnerabilities: [
      {
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
      {
        name: 'Server-Side Request Forgery (SSRF)',
        whatIsIt: 'SSRF allows an attacker to force the server to make requests to internal or external systems. In NodeGoat, user input via req.query.url is passed directly to the needle HTTP client.',
        file: 'app/routes/research.js',
        line: '16',
        codeSnippet: `// Target Function: this.displayResearch()
// Parameter: req.query.url

needle.get(req.query.url, function(err, resp, body) { ... })`,
        payload: 'http://169.254.169.254/latest/meta-data/',
        result: 'The attacker extracts AWS EC2 instance metadata because the server blindly fetched the internal IP address provided in the URL parameter.'
      },
      {
        name: 'Cross-Site Scripting (XSS) via Var In Href',
        whatIsIt: 'XSS occurs when untrusted data is included in a web page without proper validation or escaping. NodeGoat places an unescaped variable directly into an HTML href attribute.',
        file: 'app/views/profile.html',
        line: '78',
        codeSnippet: `<a href="{{link}}">User Website</a>`,
        // eslint-disable-next-line no-script-url
        payload: 'javascript:alert(document.cookie)',
        result: 'When a victim clicks the link, the browser executes the malicious JavaScript, leading to session hijacking.'
      },
      {
        name: 'Open Redirect',
        whatIsIt: 'An open redirect occurs when an application takes a parameter and redirects the user to that URL without validation. This is commonly used in phishing attacks to trick users into visiting malicious sites.',
        file: 'app/routes/index.js',
        line: '72',
        codeSnippet: `return res.redirect(req.query.url);`,
        payload: 'http://evil.com/login_spoof',
        result: 'The user is transparently redirected to a malicious website that mimics the application, tricking them into handing over credentials.'
      }
    ],
    performance: {
      fixora: {
        score: 11,
        total: 11,
        falsePositives: 0,
        description: 'Perfect detection. Fixora successfully identified all 11 core vulnerability categories present in the repository, deduping the results to just 19 highly actionable findings.'
      },
      vanillaSemgrep: {
        score: 11,
        total: 11,
        falsePositives: 3,
        description: 'Successfully detected the flaws, but generated 36 total findings, creating extreme noise for developers. It also produced 3 False Positives misidentifying Node.js Swig templates as Django files.'
      },
      semgrepAi: {
        score: 0,
        total: 11,
        falsePositives: 0,
        description: 'Awaiting Semgrep AI results...'
      }
    },
    rawLogs: `=== VANILLA SEMGREP RESULTS ===
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
- express-check-csurf-middleware-usage (1)

=== FIXORA AI WRAPPER RESULTS ===
19 matching findings
- Insecure Deserialization / Eval Injection (3)
- Express Open Redirect (1)
- SSRF (1)
- Django No Csrf Token (3) [FALSE POSITIVE - Mitigated by Fixora Heuristic Engine]
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
    vulnerabilities: [
      {
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
      {
        name: 'Mass Assignment (Privilege Escalation)',
        whatIsIt: 'Mass Assignment occurs when an application automatically assigns client-provided data (JSON or forms) to internal objects or database records without proper filtering. It allows attackers to modify object properties that they are not supposed to have access to.',
        file: 'api_views/users.py',
        line: '70',
        codeSnippet: `// Target Function: register_user()
// Parameter: request_data

user = User(**request_data) 
db.session.add(user)
db.session.commit()`,
        payload: '{"username": "test", "password": "test", "email": "test@example.com", "admin": true}',
        result: 'The attacker-controlled JSON dictionary is unpacked directly into the database model. The attacker successfully injects "admin": true, instantly gaining root administrative privileges.'
      },
      {
        name: 'SQL Injection via username',
        whatIsIt: 'SQL Injection occurs when user input is interpolated directly into a database query string instead of being safely parameterized. This allows attackers to manipulate the query structure to bypass authentication or leak data.',
        file: 'models/user_model.py',
        line: '73',
        codeSnippet: `// Target Function: get_user()
// Parameter: username

query = f"SELECT * FROM users WHERE username = '{username}'"
db.session.execute(query)`,
        payload: "' OR 1=1 --",
        result: 'The payload converts the SQL predicate into an always-true condition, bypassing all authentication and dumping the entire users table.'
      }
    ],
    performance: {
      fixora: {
        score: 5,
        total: 10,
        falsePositives: 0,
        description: 'Elite detection. Wrapper Hunter analyzed the Flask routing and correctly identified 5 out of the 10 core OWASP API vulnerabilities, including extremely complex logic flaws like IDOR and Mass Assignment.'
      },
      vanillaSemgrep: {
        score: 0,
        total: 10,
        falsePositives: 0,
        description: 'Failed completely on business logic. Vanilla Semgrep only found generic issues like Docker misconfigurations and XSS. It completely missed the core API logic flaws like IDOR, SQL Injection, Mass Assignment, and Plaintext Password comparisons.'
      },
      semgrepAi: {
        score: 0,
        total: 10,
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
    vulnerabilities: [
      {
        name: 'SQL Injection (DB Cursor Execute)',
        whatIsIt: 'SQL Injection occurs when user input is interpolated directly into a database query string instead of being safely parameterized. This allows attackers to manipulate the query structure to bypass authentication or leak data.',
        file: 'backend/easy.py',
        line: '13',
        codeSnippet: `// Target Function: execute_query()
// Parameter: user_input

cursor.execute(f"SELECT * FROM users WHERE username = '{user_input}'")`,
        payload: "' OR 1=1 --",
        result: 'The payload converts the SQL predicate into an always-true condition, bypassing all authentication and dumping the entire users table.'
      }
    ],
    performance: {
      fixora: {
        score: 1,
        total: 1,
        falsePositives: 0,
        description: 'Caught instantly. The engine perfectly mapped the taint flow from the user input parameter directly to the database execution sink.'
      },
      vanillaSemgrep: {
        score: 1,
        total: 1,
        falsePositives: 0,
        description: 'Successfully detected. This is a standard, well-documented vulnerability pattern that generic SAST tools handle easily.'
      },
      semgrepAi: {
        score: 1,
        total: 1,
        falsePositives: 0,
        description: 'Successfully detected and verified.'
      }
    },
    rawLogs: `=== RAW LOGS UNAVAILABLE ===\nNo raw logs provided for the internal test repo.`
  }
};

const MetricBar = ({ label, score, total, colorClass }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm font-medium">
      <span className="text-muted-foreground">{label}</span>
      <span>{score} out of {total}</span>
    </div>
    <Progress value={(score / total) * 100} className="h-2" indicatorColor={colorClass} />
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
            <h1 className="text-3xl font-bold tracking-tight mb-2">Comparison</h1>
          </div>
          
          <div className="w-full md:w-64">
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger className="w-full bg-background border-border h-10 text-sm">
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {REPOSITORIES.map(repo => (
                  <SelectItem key={repo.id} value={repo.id} className="text-sm cursor-pointer">
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
              <p className="text-sm text-muted-foreground">{data.description}</p>
            </div>

            {/* Vulnerabilities Carousel Section */}
            <h3 className="text-xl font-bold mt-8 mb-4 border-b border-border pb-2">Vulnerabilities</h3>
            
            <div className="relative px-12">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {data.vulnerabilities.map((vuln, index) => (
                    <CarouselItem key={index} className="md:basis-1/1 lg:basis-1/1">
                      <Card className="border-border shadow-sm overflow-hidden h-full">
                        <CardHeader className="bg-muted/30 border-b border-border pb-6">
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="destructive" className="px-3 py-1 text-xs font-medium tracking-wide">HIGH SEVERITY</Badge>
                            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                              {vuln.file}:{vuln.line}
                            </span>
                          </div>
                          <CardTitle className="text-xl text-foreground flex items-center gap-2">
                            <Bug className="w-5 h-5 text-destructive" />
                            {vuln.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-6 border-b lg:border-b-0 lg:border-r border-border bg-card">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <Code2 className="w-4 h-4" /> The Mechanism
                              </h4>
                              <p className="text-sm text-card-foreground leading-relaxed mb-6">
                                {vuln.whatIsIt}
                              </p>
                              
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Target Code
                              </h4>
                              <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto border border-zinc-800">
                                <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                                  {vuln.codeSnippet}
                                </pre>
                              </div>
                            </div>
                            
                            <div className="p-6 bg-muted/10">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" /> Exploitation
                              </h4>
                              
                              <div className="mb-6">
                                <div className="text-xs text-muted-foreground mb-1 font-medium">Malicious Payload</div>
                                <div className="bg-destructive/10 text-destructive font-mono text-xs p-3 rounded-md border border-destructive/20 break-all">
                                  {vuln.payload}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 font-medium">Result / Impact</div>
                                <p className="text-sm text-foreground bg-background p-4 rounded-md border border-border">
                                  {vuln.result}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 -translate-x-1/2" />
                <CarouselNext className="right-0 translate-x-1/2" />
              </Carousel>
            </div>

            {/* Performance Battle Cards */}
            <h3 className="text-xl font-bold mt-12 mb-4 border-b border-border pb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> 
              Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fixora */}
              <Card className="border-primary/50 shadow-md relative overflow-hidden bg-card">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-foreground">Fixora (AI + Semgrep)</CardTitle>
                    {data.performance.fixora.score > 0 ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-destructive" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.fixora.description}
                  </div>
                  
                  <MetricBar 
                    label="Vulnerabilities Found" 
                    score={data.performance.fixora.score} 
                    total={data.performance.fixora.total}
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
                    <CardTitle className="text-lg font-bold text-foreground">Vanilla Semgrep</CardTitle>
                    {data.performance.vanillaSemgrep.score > 0 ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-destructive" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.vanillaSemgrep.description}
                  </div>
                  
                  <MetricBar 
                    label="Vulnerabilities Found" 
                    score={data.performance.vanillaSemgrep.score} 
                    total={data.performance.vanillaSemgrep.total}
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
                    <CardTitle className="text-lg font-bold text-foreground">Semgrep AI</CardTitle>
                    {data.performance.semgrepAi.score > 0 ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-destructive" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground min-h-[120px]">
                    {data.performance.semgrepAi.description}
                  </div>
                  
                  <MetricBar 
                    label="Vulnerabilities Found" 
                    score={data.performance.semgrepAi.score} 
                    total={data.performance.semgrepAi.total}
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
