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
        duplicates: 0,
        description: 'Successfully found 7 critical vulnerability types (Eval, SSRF, XSS, Open Redirect, CSRF, Insecure Sessions, Hardcoded Secrets). Zero false positives. Missed highly contextual logic flaws (NoSQLi, IDOR, Cookie Deserialization) and SCA.'
      },
      vanillaSemgrep: {
        score: 7,
        total: 11,
        falsePositives: 3,
        duplicates: 14,
        description: 'Found the same 7 vulnerability types, but generated 36 total noisy findings. Flagged 3 False Positives misidentifying Node.js templates as Django files.'
      },
      semgrepAi: {
        score: 0,
        total: 11,
        falsePositives: 0,
        duplicates: 0,
        description: 'Awaiting Semgrep AI results...'
      }
    },
    missedLogs: `=== FIXORA - FALSE POSITIVES ===
- None!

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
        name: 'SQL Injection (SQLi)',
        whatIsIt: 'SQL Injection occurs when user-supplied input is directly concatenated into a backend database query without proper parameterization or sanitization. VAmPI uses an SQLite database, and its lookup mechanisms fail to escape malicious characters.',
        file: 'models/user_model.py',
        line: '73',
        codeSnippet: `# Target Endpoint: GET /users/v1/{username}
# Vulnerable Sink: Unsanitized input passed to SQLite execution
query = f"SELECT * FROM users WHERE username = '{username}'"`,
        payload: `admin' OR '1'='1`,
        result: 'The attacker bypasses authentication or extracts the entire user database table by forcing the SQL statement to evaluate to true.'
      },
      {
        name: 'Broken Object Level Authorization (BOLA / IDOR)',
        whatIsIt: 'BOLA occurs when an API exposes an endpoint that handles object identifiers, but fails to check if the currently authenticated user actually has the permissions to access or modify that specific object.',
        file: 'api_views/books.py',
        line: '51',
        codeSnippet: `# Target Endpoint: GET /books/v1/{book}
# Vulnerable Sink: Returns book details without checking ownership
book = get_book_by_title(book_title)
return jsonify(book) # Missing: if current_user != book.owner_id: abort(403)`,
        payload: 'GET /books/v1/UserB_BookTitle (while authenticated as User A)',
        result: 'The attacker can view secrets or modify data belonging to other users, leading to horizontal privilege escalation.'
      },
      {
        name: 'Mass Assignment',
        whatIsIt: 'Mass assignment vulnerabilities occur when an API takes a client-supplied JSON object and blindly binds it to internal database models.',
        file: 'api_views/users.py',
        line: '70',
        codeSnippet: `# Target Endpoint: POST /users/v1/register
# Vulnerable Sink: Blindly injecting JSON payload into the database model
new_user = User(**request.json) 
new_user.save()`,
        payload: `{"username": "attacker", "password": "password", "admin": true}`,
        result: 'The attacker forces the backend to overwrite restricted properties, granting themselves administrative privileges upon account creation.'
      },
      {
        name: 'Excessive Data Exposure',
        whatIsIt: 'APIs often rely on the client side to filter data before displaying it to the user. Excessive Data Exposure happens when the API sends back sensitive information in the JSON response that should never leave the server.',
        file: 'api_views/users.py',
        line: 'debug_endpoint',
        codeSnippet: `# Target Endpoint: GET /users/v1/_debug
# Vulnerable Sink: Serializing and returning the entire database record
users = get_all_users()
return jsonify(users) # Exposes passwords, internal IDs, and roles`,
        payload: 'GET /users/v1/_debug',
        result: 'The API responds with the complete user model for everyone on the platform, leaking sensitive PII and password hashes.'
      },
      {
        name: 'Regular Expression Denial of Service (ReDoS)',
        whatIsIt: 'ReDoS affects unsafe regular expressions used for input validation. If an attacker submits a highly complex "evil regex" string, it forces the regex engine into catastrophic backtracking, consuming all CPU resources.',
        file: 'api_views/users.py',
        line: '144',
        codeSnippet: `# Target Endpoint: POST /users/v1/login or Register
# Vulnerable Sink: Checking password/email complexity with inefficient regex
if re.match(r"^(a+)+$", request.json.get("password")):`,
        payload: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaX',
        result: 'The server hangs while trying to evaluate the string, causing the API to crash and leading to a Denial of Service (DoS) for all users.'
      },
      {
        name: 'JWT Authentication Bypass (Weak Key)',
        whatIsIt: 'JSON Web Tokens (JWTs) rely on a secret signing key to ensure they haven\'t been tampered with. If the API uses a weak or hardcoded secret key, attackers can forge their own valid tokens.',
        file: 'config.py',
        line: '13',
        codeSnippet: `# Vulnerable Sink: Hardcoded/Weak Secret used for signing JWTs
app.config['SECRET_KEY'] = 'secret'`,
        payload: 'Brute-force offline, then sign new token with {"admin": true}',
        result: 'Complete authentication bypass, allowing attackers to impersonate any user or admin on the system.'
      },
      {
        name: 'Unauthorized Password Change',
        whatIsIt: 'The endpoint intended for users to update their passwords fails to require authorization or proof of the old password before committing the change.',
        file: 'api_views/users.py',
        line: 'PUT /users/v1/{username}/password',
        codeSnippet: `# Target Endpoint: PUT /users/v1/{username}/password
user.password = request.json.get("new_password")
db.session.commit() # Missing: check old password`,
        payload: 'PUT request targeting another user\'s profile',
        result: 'Attackers can unilaterally lock legitimate users out of their accounts and take them over.'
      },
      {
        name: 'Lack of Resources & Rate Limiting',
        whatIsIt: 'The API lacks throttling or rate-limiting restrictions (such as restricting an IP to 5 requests per minute).',
        file: 'Global APIs',
        line: 'N/A',
        codeSnippet: `# Missing API Gateway or Flask-Limiter config
# app.run() directly exposed`,
        payload: 'Automated script sending 10,000 requests per second',
        result: 'Attackers can perform unlimited credential stuffing or brute-force attacks against the login endpoint without being blocked.'
      },
      {
        name: 'User and Password Enumeration',
        whatIsIt: 'The API\'s error handling is overly verbose. By returning distinct error messages or HTTP status codes for different failure states, it allows attackers to map out valid accounts.',
        file: 'api_views/users.py',
        line: 'POST /users/v1/login',
        codeSnippet: `if not user:
    return "User does not exist", 404
if user.password != password:
    return "Invalid password", 401`,
        payload: 'Iterate through common usernames',
        result: 'Allows an attacker to build a massive list of valid usernames, making targeted brute-force attacks significantly more effective.'
      }
    ],
    performance: {
      fixora: {
        score: 5,
        total: 9,
        falsePositives: 0,
        duplicates: 0,
        description: 'Elite detection. Found 5 of the 9 core API logic flaws: SQL Injection, BOLA/IDOR, Mass Assignment, ReDoS, and Weak JWT Keys. Missed architectural and rate-limiting issues (which require DAST).'
      },
      vanillaSemgrep: {
        score: 1,
        total: 9,
        falsePositives: 0,
        duplicates: 2,
        description: 'Failed completely on business logic. Found only 1 of the 9 vulnerabilities (Hardcoded JWT Key). Produced 6 total findings, most of which were duplicate format string issues or Docker misconfigs irrelevant to the core API flaws.'
      },
      semgrepAi: {
        score: 0,
        total: 9,
        falsePositives: 0,
        duplicates: 0,
        description: 'Awaiting Semgrep AI results...'
      }
    },
    missedLogs: `=== FIXORA - FALSE POSITIVES ===
- None!

=== FIXORA - MISSED VULNERABILITIES (4) ===
1. Excessive Data Exposure (GET /users/v1/_debug)
2. Unauthorized Password Change (PUT /users/v1/{username}/password)
3. Lack of Resources & Rate Limiting
4. User and Password Enumeration

=== VANILLA SEMGREP - FALSE POSITIVES (0) ===
- None

=== VANILLA SEMGREP - MISSED VULNERABILITIES (8) ===
1. SQL Injection (SQLi)
2. Broken Object Level Authorization (BOLA / IDOR)
3. Mass Assignment
4. Excessive Data Exposure
5. Regular Expression Denial of Service (ReDoS)
6. Unauthorized Password Change
7. Lack of Resources & Rate Limiting
8. User and Password Enumeration`
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
        duplicates: 0,
        description: 'Caught instantly. The engine perfectly mapped the taint flow from the user input parameter directly to the database execution sink.'
      },
      vanillaSemgrep: {
        score: 1,
        total: 1,
        falsePositives: 0,
        duplicates: 0,
        description: 'Successfully detected. This is a standard, well-documented vulnerability pattern that generic SAST tools handle easily.'
      },
      semgrepAi: {
        score: 1,
        total: 1,
        falsePositives: 0,
        duplicates: 0,
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
                <CarouselPrevious className="-left-10" />
                <CarouselNext className="-right-10" />
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
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duplicates</span>
                    <Badge variant={data.performance.fixora.duplicates === 0 ? "outline" : "secondary"} className="font-mono bg-zinc-800 text-zinc-100 border-zinc-700">
                      {data.performance.fixora.duplicates}
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
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duplicates</span>
                    <Badge variant={data.performance.vanillaSemgrep.duplicates === 0 ? "outline" : "secondary"} className="font-mono bg-zinc-800 text-zinc-100 border-zinc-700">
                      {data.performance.vanillaSemgrep.duplicates}
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
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duplicates</span>
                    <Badge variant={data.performance.semgrepAi.duplicates === 0 ? "outline" : "secondary"} className="font-mono bg-zinc-800 text-zinc-100 border-zinc-700">
                      {data.performance.semgrepAi.duplicates}
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
