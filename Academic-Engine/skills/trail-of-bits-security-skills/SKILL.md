---
name: trail-of-bits-security-skills
description: "Enterprise-grade security auditing and vulnerability scanning based on Trail of Bits standards. Use when running CodeQL queries, Semgrep security scans, auditing Python codebases for OWASP Top 10 vulnerabilities, or writing custom security rules. For code style and linting, see python-code-style; for design patterns, see python-design-patterns."
metadata:
  version: 1.0.0
---

# Trail of Bits Security Skills

Enterprise-grade security auditing skills inspired by Trail of Bits security research engineering. Detect vulnerabilities, enforce secure coding standards, and automate SAST/SCA workflows across Python and multi-language projects.

## Capabilities Overview

- **CodeQL Queries & Taint Analysis**: Perform deep semantic analysis and track untrusted data flow from sources to sinks.
- **Semgrep Pattern-Based Scanning**: Fast AST-level static analysis for common cryptographic, authentication, and injection flaws.
- **OWASP Top 10 Vulnerability Detection**: Prevent injection (SQLi, command injection), broken authentication, insecure deserialization, and path traversal.
- **Custom Rule Engineering**: Author custom Semgrep rules with test-driven precision to eliminate false positives.
- **SARIF Automation**: Parse and remediate structured SARIF findings into actionable code patches.

---

## 1. Semgrep & Static Analysis for Python

### Essential Python Security Rules

Run Semgrep with security rulesets before promoting code to production:

```bash
# Run Semgrep with standard security ruleset
semgrep scan --config=auto

# Run specific Python security rules
semgrep scan --config "p/python" --config "p/owasp-top-ten" --error
```

### Key Python Insecurities to Flag

#### Insecure Deserialization (`pickle`)
```python
# Bad: Unsafe deserialization of untrusted input
import pickle
data = pickle.loads(untrusted_payload)  # RCE vulnerability!

# Good: Use safe, typed serialization (JSON or Pydantic)
import json
data = json.loads(untrusted_payload)
```

#### SQL Injection
```python
# Bad: String formatting into SQL query
cursor.execute(f"SELECT * FROM users WHERE id = {user_input}")

# Good: Parameterized queries
cursor.execute("SELECT * FROM users WHERE id = %s", (user_input,))
```

#### Command Injection
```python
# Bad: shell=True with user input
import subprocess
subprocess.run(f"ping -c 1 {host}", shell=True)

# Good: Argument lists without shell execution
subprocess.run(["ping", "-c", "1", host], check=True, capture_output=True)
```

#### Path Traversal
```python
# Bad: Direct path concatenation
from pathlib import Path
file_path = Path("/safe/dir") / user_filename  # e.g., "../../etc/passwd"

# Good: Resolve and verify boundary containment
safe_dir = Path("/safe/dir").resolve()
target_path = (safe_dir / user_filename).resolve()
if not target_path.is_relative_to(safe_dir):
    raise PermissionError("Path traversal detected")
```

---

## 2. Writing Custom Semgrep Rules

Follow Trail of Bits test-driven methodology: create a positive test case, a negative test case, and an AST-targeted pattern.

```yaml
rules:
  - id: python-insecure-eval
    patterns:
      - pattern: eval($INPUT)
      - pattern-not: eval("...")  # Allow literal constants
    message: "Arbitrary code execution via eval(). Use ast.literal_eval() or structured parsers."
    languages: [python]
    severity: ERROR
```

---

## 3. Supply Chain Security (SCA)

Audit dependencies for known CVEs:

```bash
# Audit installed packages with pip-audit
pip-audit --desc

# Or using safety CLI
safety check
```

---

## 4. Security Audit Checklist

- [ ] All database queries use parameterized statements.
- [ ] No `eval()`, `exec()`, or `pickle.loads()` on untrusted data.
- [ ] Subprocess calls avoid `shell=True` and validate arguments.
- [ ] File operations enforce boundary checks against path traversal.
- [ ] Secrets and API keys are loaded via environment variables, never hardcoded.
- [ ] Dependencies pass vulnerability scan without critical CVEs.
