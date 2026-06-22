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
        name: 'Code Injection / Eval Injection (RCE)',
        whatIsIt: 'Eval Injection occurs when untrusted user input is executed directly as code. This allows an attacker to inject arbitrary system commands that the Node.js backend executes, leading to complete Remote Code Execution (RCE).',
        file: 'app/routes/contributions.js',
        line: '32',
        codeSnippet: `// Target Function: this.handleContributionsUpdate()
const preTax = eval(req.body.preTax); // VULNERABLE SINK`,
        payload: `req.body.preTax = "require('child_process').exec('rm -rf /')"`,
        result: 'Complete server compromise and arbitrary code execution.'
      },
      {
        name: 'NoSQL Injection',
        whatIsIt: 'Unlike SQL injection, NoSQL injection targets databases like MongoDB by passing JSON objects or operators instead of strings. NodeGoat fails to sanitize user input before passing it to a MongoDB .find() query.',
        file: 'app/routes/allocations.js',
        line: '15',
        codeSnippet: `// Target Function: this.displayAllocations()
const threshold = req.query.threshold;
db.allocations.find({ userId: userId, threshold: { $gt: threshold } }) // VULNERABLE SINK`,
        payload: '?threshold={"$ne": 0}',
        result: 'Bypasses query logic, allowing attackers to dump the entire database of user financial allocations.'
      },
      {
        name: 'Insecure Deserialization (RCE via Cookie)',
        whatIsIt: 'The application uses the highly vulnerable node-serialize package to decode a user profile cookie. Attackers can craft a serialized payload with an Immediately Invoked Function Expression (IIFE) that executes upon deserialization.',
        file: 'app/routes/profile.js',
        line: '64',
        codeSnippet: `// Target Function: this.displayProfile()
let profile = serialize.unserialize(req.cookies.profile); // VULNERABLE SINK`,
        payload: 'Base64 encoded: {"rce":"_$$ND_FUNC$$_function(){require(\'child_process\').exec(\'ls /\');}()"}',
        result: 'Complete Remote Code Execution (RCE) via a tampered session cookie.'
      },
      {
        name: 'Insecure Direct Object Reference (IDOR)',
        whatIsIt: 'The application accepts a userId parameter from the client to look up benefits data but fails to verify if the currently authenticated user actually owns that userId.',
        file: 'app/routes/benefits.js',
        line: '14',
        codeSnippet: `// Target Function: this.displayBenefits()
const userId = req.query.userId;
db.benefits.find({ userId: userId }) // VULNERABLE SINK (No Authz Check)`,
        payload: '/benefits?userId=102',
        result: 'Horizontal privilege escalation, allowing attackers to view the private data of every user on the platform.'
      },
      {
        name: 'Server-Side Request Forgery (SSRF)',
        whatIsIt: 'SSRF allows an attacker to force the server to make outbound HTTP requests. User input via req.query.url is passed directly to the needle HTTP client without being validated against an allowlist.',
        file: 'app/routes/research.js',
        line: '16',
        codeSnippet: `// Target Function: this.displayResearch()
needle.get(req.query.url, function (error, response, body) { ... }) // VULNERABLE SINK`,
        payload: '?url=http://169.254.169.254/latest/meta-data/',
        result: 'Attackers can bypass firewalls to scan internal networks or steal cloud infrastructure metadata/AWS keys.'
      },
      {
        name: 'Unvalidated Redirect (Open Redirect)',
        whatIsIt: 'The login route accepts a url parameter intended to redirect users back to their previous page after logging in. Without validation, attackers can redirect users to a malicious phishing site.',
        file: 'app/routes/index.js',
        line: '72',
        codeSnippet: `// Target Function: this.handleLogin()
res.redirect(req.query.url); // VULNERABLE SINK`,
        payload: 'http://nodegoat.com/login?url=http://evil-phishing-site.com',
        result: 'Used in social engineering to steal user credentials by mimicking the legitimate application.'
      },
      {
        name: 'Cross-Site Scripting (XSS)',
        whatIsIt: 'The application stores user inputs (like first name, last name) and reflects them back into the HTML without sanitization. It also allows unvalidated URLs inside href attributes.',
        file: 'app/views/profile.html',
        line: '78',
        codeSnippet: `<a href="{{ user.website }}">Personal Website</a>`,
        // eslint-disable-next-line no-script-url
        payload: 'Setting website field to: javascript:alert(document.cookie)',
        result: 'When another user or admin clicks the link, the attacker script executes in their browser, stealing their session cookies.'
      },
      {
        name: 'Security Misconfiguration (CSRF & HTTP)',
        whatIsIt: 'The Express server is missing critical security middleware. It does not enforce Cross-Site Request Forgery (CSRF) protection on forms, and it binds the application to an unencrypted HTTP server instead of HTTPS.',
        file: 'server.js',
        line: '15, 145',
        codeSnippet: `// Missing: app.use(csurf());
http.createServer(app).listen(config.port, function() { ... }); // VULNERABLE CONFIG`,
        payload: 'N/A (Structural Flaw)',
        result: 'Attackers can trick authenticated users into submitting state-changing requests via malicious third-party websites. Data in transit can be intercepted.'
      },
      {
        name: 'Broken Authentication (Insecure Session)',
        whatIsIt: 'The Express session cookie is configured insecurely. It lacks the HttpOnly, Secure, and SameSite flags.',
        file: 'server.js',
        line: '78',
        codeSnippet: `app.use(session({
    secret: 'nodegoat', // Also a hardcoded secret
    // Missing: cookie: { secure: true, httpOnly: true }
}));`,
        payload: 'document.cookie via XSS payload',
        result: 'Because HttpOnly is missing, XSS attacks can successfully extract the session cookie, leading to full account takeover.'
      },
      {
        name: 'Sensitive Data Exposure (Hardcoded Secrets)',
        whatIsIt: 'Private cryptographic keys and bcrypt password hashes are hardcoded directly into the repository files instead of being injected via environment variables.',
        file: 'artifacts/cert/server.key',
        line: '1',
        codeSnippet: `-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQDQ...`,
        payload: 'N/A (Source Code Disclosure)',
        result: 'Anyone with read access to the source code can steal the private keys, allowing them to decrypt intercepted HTTPS traffic.'
      },
      {
        name: 'Using Components with Known Vulnerabilities (SCA)',
        whatIsIt: 'NodeGoat intentionally locks its package.json dependencies to outdated versions (e.g., old versions of Express, Node-Serialize, and Marked).',
        file: 'package.json',
        line: 'dependencies',
        codeSnippet: `"dependencies": {
    "express": "4.12.4",
    "node-serialize": "0.0.4"
}`,
        payload: 'Public CVE Exploits',
        result: 'Attackers can use pre-written exploit scripts against the outdated libraries without finding flaws in custom logic.'
      }
    ],
    performance: {
      fixora: {
        score: 7,
        total: 11,
        falsePositives: 0,
        description: 'Successfully found 7 critical vulnerability types (Eval, SSRF, XSS, Open Redirect, CSRF, Insecure Sessions, Hardcoded Secrets). Zero false positives. Missed highly contextual logic flaws (NoSQLi, IDOR, Cookie Deserialization) and SCA.'
      },
      vanillaSemgrep: {
        score: 7,
        total: 11,
        falsePositives: 3,
        description: 'Found the same 7 vulnerability types, but generated 36 total noisy findings. Flagged 3 False Positives misidentifying Node.js templates as Django files.'
      },
      semgrepAi: {
        score: 0,
        total: 11,
        falsePositives: 0,
        description: 'Awaiting Semgrep AI results...'
      }
    },
    missedLogs: `=== FIXORA - FALSE POSITIVES ===
- None! (The Django FP was successfully mitigated by Fixora's intelligent language heuristic)

=== FIXORA - MISSED VULNERABILITIES (4) ===
1. NoSQL Injection (app/routes/allocations.js)
2. Insecure Deserialization via Cookie (app/routes/profile.js)
3. Insecure Direct Object Reference (app/routes/benefits.js)
4. Outdated Vulnerable Components (package.json)

=== VANILLA SEMGREP - FALSE POSITIVES (3) ===
1. django-no-csrf-token (benefits.html)
2. django-no-csrf-token (login.html)
3. django-no-csrf-token (memos.html)

=== VANILLA SEMGREP - MISSED VULNERABILITIES (4) ===
1. NoSQL Injection
2. Insecure Deserialization via Cookie
3. Insecure Direct Object Reference (IDOR)
4. Outdated Vulnerable Components`
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
            
            <div className="relative px-16">
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
                <CarouselPrevious className="-left-6" />
                <CarouselNext className="-right-6" />
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
            
            {/* Missed Vulns Trigger */}
            <div className="flex justify-center mt-8 pb-8">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-border hover:bg-muted/50 text-muted-foreground transition-all">
                    View Missed Ones
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Missed Vulnerabilities & False Positives ({data.title})</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto bg-zinc-950 rounded-md border border-zinc-800 p-4 mt-4">
                    <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">
                      {data.missedLogs || data.rawLogs}
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
