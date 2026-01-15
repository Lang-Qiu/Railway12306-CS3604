import json
import os
from pathlib import Path

def generate_requirements_doc():
    test_dir = Path("WebTestPilot-SJTU-Course-main/WebTestPilot-SJTU-Course-main/tests/12306")
    output_file = Path("Detailed_Requirements_List.md")
    
    # 定义需求分类映射
    categories = {
        "注册与登录 (Registration & Login)": ["register", "login"],
        "车票查询 (Ticket Search)": ["tickets"],
        "乘客管理 (Passenger Management)": ["traveler", "passenger"],
        "订单与支付 (Order & Payment)": ["orders", "pay"],
        "个人信息 (Profile)": ["profile"]
    }
    
    # 存储结果
    grouped_reqs = {cat: [] for cat in categories}
    grouped_reqs["其他 (Others)"] = [] # Fallback category
    
    total_features = 0
    total_atomic_reqs = 0
    
    if test_dir.exists():
        # 获取文件列表并排序，保证输出顺序稳定
        files = sorted([f for f in os.listdir(test_dir) if f.endswith(".json")])
        
        for file in files:
            try:
                with open(test_dir / file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    test_name = data.get('name', 'Unknown Feature')
                    steps = data.get('steps', [])
                    
                    # 确定类别
                    assigned_cat = "其他 (Others)"
                    for cat, keywords in categories.items():
                        if any(k in file for k in keywords):
                            assigned_cat = cat
                            break
                    
                    # 提取原子需求
                    atomic_reqs = []
                    for i, step in enumerate(steps):
                        action = step.get('action', '').strip()
                        expectation = step.get('expectation', '').strip()
                        
                        if action or expectation:
                            req_desc = action
                            if expectation:
                                if req_desc:
                                    req_desc += f" -> **预期**: {expectation}"
                                else:
                                    req_desc = f"**预期**: {expectation}"
                            atomic_reqs.append(req_desc)
                    
                    if atomic_reqs:
                        grouped_reqs[assigned_cat].append({
                            "feature_name": test_name,
                            "file_name": file,
                            "reqs": atomic_reqs
                        })
                        total_features += 1
                        total_atomic_reqs += len(atomic_reqs)
                        
            except Exception as e:
                print(f"Error processing {file}: {e}")

    # 生成 Markdown 内容
    content = []
    content.append("# 12306 系统详细需求清单")
    content.append(f"> **生成时间**: 2025-12-28")
    content.append(f"> **统计概览**: 共覆盖 **{len(grouped_reqs) - (1 if not grouped_reqs['其他 (Others)'] else 0)}** 大业务模块，包含 **{total_features}** 个功能特性，拆解为 **{total_atomic_reqs}** 个原子需求点。\n")
    
    # 遍历每个分类写入
    for category, features in grouped_reqs.items():
        if not features:
            continue
            
        content.append(f"## {category}")
        content.append(f"*(共 {len(features)} 个功能特性，{sum(len(f['reqs']) for f in features)} 个原子需求)*\n")
        
        for feature in features:
            content.append(f"### {feature['feature_name']}")
            content.append(f"- **测试用例源文件**: `{feature['file_name']}`")
            content.append(f"- **原子需求列表**: ")
            
            for idx, req in enumerate(feature['reqs'], 1):
                content.append(f"  {idx}. {req}")
            content.append("") # 空行分隔
            
    # 写入文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(content))
        
    print(f"Successfully generated {output_file} with {total_atomic_reqs} requirements.")

if __name__ == "__main__":
    generate_requirements_doc()
