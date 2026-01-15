import os
import yaml
import json
from pathlib import Path

def load_yaml_requirements():
    req_ids = set()
    artifacts_dir = Path("artifacts")
    files = ["ui_interface.yaml", "func_interface.yaml", "api_interface.yaml"]
    
    print("--- 系统内部追踪需求 ID (from artifacts/*.yaml) ---")
    for f in files:
        path = artifacts_dir / f
        if not path.exists():
            continue
            
        with open(path, 'r', encoding='utf-8') as file:
            # Simple parsing line by line to avoid dependency issues if pyyaml not installed
            # But wait, let's try to read it as text and look for "related_req_id"
            content = file.read()
            for line in content.splitlines():
                if "related_req_id:" in line:
                    req_id = line.split("related_req_id:")[1].strip().strip('"')
                    req_ids.add(req_id)
    
    sorted_reqs = sorted(list(req_ids))
    for req in sorted_reqs:
        print(f"- {req}")
    print(f"Total Unique System Requirements: {len(req_ids)}")
    print("\n")
    return sorted_reqs

def load_test_cases():
    test_dir = Path("WebTestPilot-SJTU-Course-main/WebTestPilot-SJTU-Course-main/tests")
    
    modules = {
        "12306": [],
        "ctrip": []
    }
    
    if test_dir.exists():
        for module_name in modules.keys():
            module_path = test_dir / module_name
            if not module_path.exists():
                continue
                
            # Walk through all files
            for root, dirs, files in os.walk(module_path):
                for file in files:
                    if file.endswith(".json"):
                        file_path = Path(root) / file
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                data = json.load(f)
                                name = data.get('name', 'Unknown')
                                modules[module_name].append({
                                    "file": file,
                                    "name": name,
                                    "path": str(file_path.relative_to(test_dir))
                                })
                        except Exception as e:
                            print(f"Error reading {file}: {e}")

    print("--- 实际测试覆盖的功能点 (from tests/*.json) ---")
    for module, cases in modules.items():
        print(f"[{module.upper()} 模块] (共 {len(cases)} 个)")
        for case in sorted(cases, key=lambda x: x['file']):
            print(f"  - {case['name']} ({case['file']})")
        print("")

if __name__ == "__main__":
    load_yaml_requirements()
    load_test_cases()
