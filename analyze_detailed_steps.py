import json
import os
from pathlib import Path

def analyze_detailed_requirements():
    test_dir = Path("WebTestPilot-SJTU-Course-main/WebTestPilot-SJTU-Course-main/tests/12306")
    
    # 定义需求分类映射
    categories = {
        "注册/登录": ["register", "login"],
        "车票查询": ["tickets-filter", "tickets-prevent", "tickets-modify", "tickets-graceful"],
        "乘客管理": ["traveler", "passenger"],
        "订单/支付": ["orders", "pay"],
        "个人信息": ["profile"]
    }
    
    total_steps = 0
    detailed_reqs = []
    
    if test_dir.exists():
        for file in os.listdir(test_dir):
            if file.endswith(".json"):
                try:
                    with open(test_dir / file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        test_name = data.get('name', 'Unknown')
                        steps = data.get('steps', [])
                        
                        # 确定类别
                        category = "其他"
                        for cat, keywords in categories.items():
                            if any(k in file for k in keywords):
                                category = cat
                                break
                        
                        # 分析每个步骤作为细分需求
                        for i, step in enumerate(steps):
                            action = step.get('action', '')
                            expectation = step.get('expectation', '')
                            
                            # 只有包含具体操作或预期的才算有效细分需求
                            if action or expectation:
                                req_desc = f"{action}"
                                if expectation:
                                    req_desc += f" -> 预期: {expectation}"
                                
                                detailed_reqs.append({
                                    "category": category,
                                    "parent_feature": test_name,
                                    "detail": req_desc,
                                    "file": file
                                })
                                total_steps += 1
                                
                except Exception as e:
                    print(f"Error reading {file}: {e}")
    
    # 打印结果
    print(f"--- 12306 细分需求统计 (Total: {total_steps}) ---")
    
    # 按类别分组打印
    grouped = {}
    for req in detailed_reqs:
        cat = req['category']
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(req)
        
    for cat, reqs in grouped.items():
        print(f"\n【{cat}】 (共 {len(reqs)} 个细分点)")
        # 只打印前5个作为示例，避免输出过长，但统计总数
        for i, req in enumerate(reqs[:5]):
            print(f"  - [{req['parent_feature']}] {req['detail']}")
        if len(reqs) > 5:
            print(f"  ... 以及其他 {len(reqs)-5} 个点")

if __name__ == "__main__":
    analyze_detailed_requirements()
