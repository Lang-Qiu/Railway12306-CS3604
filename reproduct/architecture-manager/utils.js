const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sharp = require('sharp');
const { exec } = require('child_process');

// --- 基础文件与数据操作 ---

function loadYaml(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[Error] File not found: ${filePath}`);
      return null;
    }
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    console.error(`[Error] Failed to load YAML at ${filePath}:`, e);
    return null;
  }
}

function saveYaml(filePath, data) {
  try {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    const yamlStr = yaml.dump(data, { indent: 2, lineWidth: -1 });
    fs.writeFileSync(filePath, yamlStr, 'utf8');
  } catch (e) {
    console.error(`[Error] Failed to save YAML at ${filePath}:`, e);
    throw e;
  }
}

function validateInputs(args) {
  if (!args || typeof args !== 'object') {
     return "ERROR: No arguments received. Please provide inputs as a JSON object.";
  }
  const { project_root } = args;
  if (!project_root || project_root.trim() === '') {
    return "ERROR: Missing 'project_root'. Please provide the absolute path.";
  }
  return null;
}

// --- Git 操作逻辑 (New) ---

function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        // Git reset returns error code sometimes even if successful on some platforms, but usually strict error checking is good.
        // For 'git add', empty stdout is fine.
        console.warn(`[Command Warn] ${command}: ${stderr}`);
        // reject(error); // Don't reject immediately, let caller handle stderr
      }
      resolve({ stdout, stderr, error });
    });
  });
}

// --- 树遍历与搜索逻辑 ---

function findRequirementById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findRequirementById(child, id);
      if (found) return found;
    }
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRequirementById(item, id);
      if (found) return found;
    }
  }
  return null;
}

function findParentByChildId(node, childId) {
  if (!node || typeof node !== 'object') return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findParentByChildId(item, childId);
      if (found) return found;
    }
    return null;
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child.id === childId) {
        return node;
      }
      const found = findParentByChildId(child, childId);
      if (found) return found;
    }
  }
  return null;
}

function flattenPreOrder(node, list) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach(item => flattenPreOrder(item, list));
    return;
  }
  if (node.id) list.push({ id: node.id, status: 'unprocessed' });
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => flattenPreOrder(child, list));
  }
}

// --- 接口收集逻辑 ---

function collectRequirementInterfaces(projectRoot, reqId) {
  const uiPath = path.join(projectRoot, 'artifacts', 'ui_interface.yaml');
  const apiPath = path.join(projectRoot, 'artifacts', 'api_interface.yaml');
  const funcPath = path.join(projectRoot, 'artifacts', 'func_interface.yaml');
  const uiIndex = loadYaml(uiPath) || {};
  const apiIndex = loadYaml(apiPath) || {};
  const funcIndex = loadYaml(funcPath) || {};
  const result = { ui: [], api: [], func: [] };
  
  // 简化逻辑：只收集 explicitly linked 的接口，不再过滤 upstream/downstream 以免混乱
  Object.entries(uiIndex).forEach(([id, item]) => {
    const rel = item && item.related_req_id;
    if ((Array.isArray(rel) && rel.includes(reqId)) || rel === reqId) {
      result.ui.push({ id, ...item });
    }
  });
  Object.entries(apiIndex).forEach(([id, item]) => {
    const rel = item && item.related_req_id;
    if ((Array.isArray(rel) && rel.includes(reqId)) || rel === reqId) {
      result.api.push({ id, ...item });
    }
  });
  Object.entries(funcIndex).forEach(([id, item]) => {
    const rel = item && item.related_req_id;
    if ((Array.isArray(rel) && rel.includes(reqId)) || rel === reqId) {
      result.func.push({ id, ...item });
    }
  });
  return result;
}

// --- 架构图管理逻辑 ---

function loadGraph(projectRoot) {
  const graphPath = path.join(projectRoot, 'artifacts', 'architecture_graph.yaml');
  const graph = loadYaml(graphPath);
  if (!graph || !graph.nodes) {
    return { nodes: {}, edges: [] };
  }
  return graph;
}

function saveGraph(projectRoot, graph) {
  const graphPath = path.join(projectRoot, 'artifacts', 'architecture_graph.yaml');
  saveYaml(graphPath, graph);
}

function initGraphFromRequirements(projectRoot, requirements) {
  const graph = { nodes: {}, edges: [] };

  function traverse(node, parentId = null) {
    if (!node || !node.id) return;
    graph.nodes[node.id] = {
      type: 'REQUIREMENT',
      name: node.name,
      description: node.description
    };
    if (parentId) {
      graph.edges.push({ from: parentId, to: node.id, relation: 'HAS_CHILD' });
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => traverse(child, node.id));
    }
  }

  if (Array.isArray(requirements)) {
    requirements.forEach(req => traverse(req));
  } else {
    traverse(requirements);
  }

  saveGraph(projectRoot, graph);
  return graph;
}

function updateGraphNode(projectRoot, nodeType, nodeId, nodeData, relations) {
  const graph = loadGraph(projectRoot);
  graph.nodes[nodeId] = { type: nodeType, ...nodeData };
  const addEdge = (from, to, relation) => {
    if (!from || !to) return;
    const exists = graph.edges.some(e => e.from === from && e.to === to && e.relation === relation);
    if (!exists) graph.edges.push({ from, to, relation });
  };

  if (relations.related_req_id) {
    const reqIds = Array.isArray(relations.related_req_id) ? relations.related_req_id : [relations.related_req_id];
    reqIds.forEach(reqId => addEdge(reqId, nodeId, 'DEFINES'));
  }
  if (relations.upstream_ids && Array.isArray(relations.upstream_ids)) {
    relations.upstream_ids.forEach(upId => addEdge(upId, nodeId, 'CALLS'));
  }
  if (relations.downstream_ids && Array.isArray(relations.downstream_ids)) {
    relations.downstream_ids.forEach(downId => addEdge(nodeId, downId, 'CALLS'));
  }
  if (relations.db_tables && Array.isArray(relations.db_tables)) {
      graph.nodes[nodeId].db_tables = relations.db_tables;
  }
  saveGraph(projectRoot, graph);
}

function generateTextGraphDescription(graphObj) {
  let output = "**节点列表**\n";
  Object.keys(graphObj.nodes).forEach(id => {
    const node = graphObj.nodes[id];
    output += `- [${node.type}] ${id}: ${node.name || node.description || '无描述'}\n`;
  });
  output += "\n**关系列表**\n";
  graphObj.edges.forEach(e => {
    output += `- ${e.from} -> ${e.to} (${e.relation})\n`;
  });
  return output;
}

// --- 图片提取逻辑 ---

async function extractImages(baseDir, text) {
  if (!text || typeof text !== 'string') return {};
  const images = {};
  const regex = /(?:!\[.*?\]|\[.*?\])\((.*?)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const relativePath = match[1];
    if (!/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(relativePath)) continue;
    try {
      const absPath = path.resolve(baseDir, relativePath);
      if (fs.existsSync(absPath)) {
        try {
          const image = sharp(absPath);
          const metadata = await image.metadata();
          let processedBuffer;
          if (metadata.width && metadata.width > 1) {
            const newWidth = Math.max(1, Math.round(metadata.width * 0.707));
            processedBuffer = await image.resize({ width: newWidth }).toBuffer();
          } else {
            processedBuffer = fs.readFileSync(absPath);
          }
          images[relativePath] = processedBuffer.toString('base64');
        } catch (sharpError) {
          const fileBuffer = fs.readFileSync(absPath);
          images[relativePath] = fileBuffer.toString('base64');
        }
      }
    } catch (e) {
      console.error(`[Error] Failed to read image ${relativePath}:`, e.message);
    }
  }
  return images;
}

// --- 核心业务逻辑 ---

async function popNextRequirement(projectRoot, progressFileName, reqDocPath) {
  const progressPath = path.join(projectRoot, 'artifacts', progressFileName);
  const progressList = loadYaml(progressPath);
  if (!progressList || !Array.isArray(progressList)) {
    return { error: `Progress file not found at ${progressPath}. Please run the init tool first.` };
  }

  const taskIndex = progressList.findIndex(item => item.status === 'unprocessed');
  if (taskIndex === -1) {
    return { message: "All requirements in this phase are completed.", completed: true };
  }

  const currentTask = progressList[taskIndex];
  const rawReqs = loadYaml(reqDocPath);
  if (!rawReqs) return { error: `Requirements document not found at ${reqDocPath}` };

  const reqNode = findRequirementById(rawReqs, currentTask.id);
  if (!reqNode) return { error: `Requirement ID ${currentTask.id} not found in source document.` };

  // Update status
  progressList[taskIndex].status = 'processed';
  saveYaml(progressPath, progressList);

  const { children, ...basicInfo } = reqNode;
  
  // Interfaces are technically empty at start of design, but checking for existing ones in case of retry
  const currentInterfaces = collectRequirementInterfaces(projectRoot, reqNode.id);
  
  // Extract Images
  const reqDocDir = path.dirname(reqDocPath);
  const loadedImages = await extractImages(reqDocDir, basicInfo.description);

  // Parent Info
  const parentNode = findParentByChildId(rawReqs, reqNode.id);
  let parentInfo = null;
  if (parentNode) {
    const pInterfaces = collectRequirementInterfaces(projectRoot, parentNode.id);
    parentInfo = {
      id: parentNode.id,
      name: parentNode.name,
      description: parentNode.description,
      interfaces: pInterfaces
    };
  }

  // Graph
  let fullGraph = loadGraph(projectRoot);
  if (!fullGraph || !fullGraph.nodes) {
       fullGraph = initGraphFromRequirements(projectRoot, rawReqs);
  }
  const graphText = generateTextGraphDescription(fullGraph);

  // Format Response
  const finalRequirement = {
    ...basicInfo,
    scenarios: reqNode.scenarios || [], // Explicitly ensure scenarios are passed
    interfaces: currentInterfaces
  };

  const formatted = formatRequirementResponse(finalRequirement, graphText, loadedImages, parentInfo);
  return { formattedOutput: formatted };
}

function updateRequirementArtifacts(projectRoot, reqId, category, artifactId) {
  const progressPath = path.join(projectRoot, 'artifacts', 'phase_one_progress.yaml'); // Use same progress file
  const progressList = loadYaml(progressPath);
  if (!progressList) return;

  const taskIndex = progressList.findIndex(item => item.id === reqId);
  if (taskIndex === -1) return;

  if (!progressList[taskIndex].artifacts) progressList[taskIndex].artifacts = {};
  if (!progressList[taskIndex].artifacts[category]) progressList[taskIndex].artifacts[category] = [];

  const list = progressList[taskIndex].artifacts[category];
  if (!list.includes(artifactId)) {
    list.push(artifactId);
    saveYaml(progressPath, progressList);
  }
}

function registerInterfaceItem(projectRoot, fileName, itemId, newItemData, mergeArrays = []) {
  const filePath = path.join(projectRoot, 'artifacts', fileName);
  let data = loadYaml(filePath) || {};
  if (data[itemId]) {
    const existing = data[itemId];
    existing.path = newItemData.path || existing.path;
    existing.description = newItemData.description || existing.description;
    existing.signature = newItemData.signature || existing.signature;
    mergeArrays.forEach(field => {
      if (newItemData[field] && Array.isArray(newItemData[field])) {
        const oldSet = new Set(existing[field] || []);
        newItemData[field].forEach(item => oldSet.add(item));
        existing[field] = Array.from(oldSet);
      }
    });
    data[itemId] = existing;
  } else {
    data[itemId] = newItemData;
  }
  saveYaml(filePath, data);
  return { status: "success" };
}

function formatRequirementResponse(req, graphText, images, parentInfo) {
  let output = "";
  output += `#### 当前需求: ${req.id} - ${req.name}\n`;
  output += `描述: ${req.description || ' '}\n\n`;
  
  if (parentInfo) {
     output += `#### 父需求上下文\n`;
     output += `ID: ${parentInfo.id} (${parentInfo.name})\n`;
     output += `描述: ${parentInfo.description}\n\n`;
  }

  output += `#### 验收场景 (Scenarios)\n`;
  if (req.scenarios && req.scenarios.length > 0) {
    req.scenarios.forEach(s => {
      output += `- [${s.id}] ${s.name}\n`;
      output += `  前置条件: ${s.prerequisites ? s.prerequisites.join(', ') : '无'}\n`;
      output += `  步骤与预期:\n`;
      if (s.steps) {
        s.steps.forEach((step, idx) => {
          output += `    ${idx+1}. ${step.action} => ${step.expectation}\n`;
        });
      }
    });
  } else {
    output += `(无明确场景，请参考描述)\n`;
  }
  output += "\n";

  output += `#### 架构上下文 (Graph)\n${graphText}\n\n`;

  output += `#### 视觉参考 (Base64 Images)\n`;
  const imgKeys = Object.keys(images);
  if (imgKeys.length > 0) {
    // 修改: 显式输出 Base64 字符串，以便模型可以“看见”图片
    imgKeys.forEach(key => {
        output += `- ${key}: ${images[key]}\n`;
    });
  } else {
    output += `- 无参考图片\n`;
  }
  
  return output;
}

module.exports = {
  loadYaml,
  saveYaml,
  validateInputs,
  flattenPreOrder,
  popNextRequirement,
  updateRequirementArtifacts,
  registerInterfaceItem,
  initGraphFromRequirements,
  updateGraphNode,
  runCommand
};