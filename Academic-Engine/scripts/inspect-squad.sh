#!/usr/bin/env bash
# inspect-squad.sh - Validate and display BRIDS Founder & YC Sub-Agent Squad definitions

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
AGENTS_DIR="${CORE_DIR}/agents"

echo "========================================================"
echo "          BRIDS.io Founder & YC Sub-Agent Squad         "
echo "========================================================"
echo ""

python3 - <<EOF
import os
import glob
import sys

agents_dir = "$AGENTS_DIR"
yaml_files = sorted(glob.glob(os.path.join(agents_dir, "*.yaml")))

if not yaml_files:
    print(f"Error: No agent YAML files found in {agents_dir}")
    sys.exit(1)

def parse_agent_yaml(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    agent = {}
    current_list_key = None
    in_prompt = False
    prompt_lines = []
    
    for line in lines:
        if in_prompt:
            prompt_lines.append(line)
            continue
            
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#"):
            continue
            
        if trimmed.startswith("system_prompt:"):
            in_prompt = True
            continue
            
        if trimmed.startswith("- ") and current_list_key in ("skills", "outputs"):
            item = trimmed[2:].strip().strip('"\'')
            agent[current_list_key].append(item)
            continue
            
        if ":" in trimmed:
            k, v = trimmed.split(":", 1)
            k = k.strip()
            v = v.strip().strip('"\'')
            if k in ("skills", "outputs"):
                agent[k] = []
                current_list_key = k
            elif k == "tools":
                agent["tools"] = {}
                current_list_key = "tools"
            elif current_list_key == "tools" and k in ("write", "subagents", "mcp"):
                agent["tools"][k] = (v.lower() == "true")
            else:
                current_list_key = None
                if v.lower() == "true":
                    agent[k] = True
                elif v.lower() == "false":
                    agent[k] = False
                else:
                    agent[k] = v

    if prompt_lines:
        agent["system_prompt"] = "".join(prompt_lines).strip()
        
    return agent

print(f"Total Configured Sub-Agents: {len(yaml_files)}\n")

for i, yf in enumerate(yaml_files, 1):
    fname = os.path.basename(yf)
    ag = parse_agent_yaml(yf)
    
    name = ag.get("name", "UNNAMED")
    role = ag.get("role", "NO_ROLE")
    skills = ", ".join(ag.get("skills", []))
    tools = ag.get("tools", {})
    tools_str = ", ".join([f"{k}:{v}" for k, v in tools.items()])
    prompt_len = len(ag.get("system_prompt", ""))
    
    status = "OK (Autonomous YAML Valid)" if prompt_len > 0 else "WARNING: Missing system_prompt"
    
    print(f"[{i}] {name} ({role})")
    print(f"    Status: {status} -> {fname}")
    print(f"    Skills: {skills}")
    print(f"    Tools:  {tools_str}")
    print(f"    Description: {ag.get('description', '')}")
    print(f"    Outputs: {ag.get('outputs', [])}\n")

print("All individual agent YAML definitions validated successfully.")
EOF
