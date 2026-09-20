import os
import re

files_to_clean = [
    "identity/server.js",
    "workflow/server.js",
    "consent-service/server.js",
    "dept-a/server.js",
    "dept-b/server.js",
    "dept-c/server.js",
    "mdm-service/server.js"
]

patterns_to_remove = [
    (r"// Seed.*?(?=\n\s*// Health check|\n\s*app\.get\('/health'|\n\s*const (applicantsRouter|workflowRoutes|eventsRouter)|\n\s*// Routes)", re.DOTALL),
    (r"const seedData = \(\) => \{.*?seedData\(\);", re.DOTALL),
    (r"const seedWorkflow = \(\) => \{.*?seedWorkflow\(\);", re.DOTALL),
    (r"const seedConsent = \(\) => \{.*?seedConsent\(\);", re.DOTALL),
]

for file in files_to_clean:
    if not os.path.exists(file):
        continue
    with open(file, "r") as f:
        content = f.read()
    
    original_content = content
    
    # Custom removals for specific files because regex might be tricky
    if "identity/server.js" in file:
        content = re.sub(r"// Seed users if empty.*?console\.log\('Initial users seeded\.'\);\n\s*\}", "", content, flags=re.DOTALL)
    if "workflow/server.js" in file:
        content = re.sub(r"const seedWorkflow = \(\) => \{.*?\n\s*seedWorkflow\(\);", "", content, flags=re.DOTALL)
    if "consent-service/server.js" in file:
        content = re.sub(r"const seedConsent = \(\) => \{.*?\n\s*seedConsent\(\);", "", content, flags=re.DOTALL)
    if "dept-" in file:
        content = re.sub(r"// Seed data\n\s*const seedData = \(\) => \{.*?\n\s*seedData\(\);", "", content, flags=re.DOTALL)
    
    if content != original_content:
        with open(file, "w") as f:
            f.write(content)
        print(f"Cleaned seed logic from {file}")
    else:
        print(f"No changes made to {file}")

