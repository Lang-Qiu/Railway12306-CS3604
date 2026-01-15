import os
import difflib

target_dir = r"e:\LQiu\CS3604\Our-12306-CS3604-main\Our-12306-CS3604-main\reproduct\01-首页查询页"
report_file = os.path.join(target_dir, "rewrite_report.md")

with open(report_file, "w", encoding="utf-8") as report:
    report.write("# YAML Rewrite Comparison Report\n\n")
    
    files = [f for f in os.listdir(target_dir) if f.endswith(".yaml")]
    
    for file in files:
        original_file = os.path.join(target_dir, file + ".bak")
        new_file = os.path.join(target_dir, file)
        
        if not os.path.exists(original_file):
            continue
            
        with open(original_file, "r", encoding="utf-8") as f1, open(new_file, "r", encoding="utf-8") as f2:
            original_lines = f1.readlines()
            new_lines = f2.readlines()
            
        diff = difflib.unified_diff(
            original_lines, 
            new_lines, 
            fromfile=f"Original ({file})", 
            tofile=f"Rewritten ({file})", 
            lineterm=""
        )
        
        changes = list(diff)
        if changes:
            report.write(f"## File: {file}\n\n")
            report.write("```diff\n")
            # Limit the diff output to avoid huge files, just show first 50 lines of diff if too long
            count = 0
            for line in changes:
                if count > 50:
                    report.write("... (diff truncated) ...\n")
                    break
                report.write(line)
                count += 1
            report.write("\n```\n\n")
        else:
            report.write(f"## File: {file}\n\nNo changes detected.\n\n")

print(f"Report generated at {report_file}")
