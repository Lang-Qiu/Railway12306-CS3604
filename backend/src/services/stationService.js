const dbService = require('./dbService');
const path = require('path');
const cityStationMapping = require('../config/cityStationMapping');

/**
 * 站点服务
 */

/**
 * 获取所有站点
 */
async function getAllStations() {
  try {
    const rows = await dbService.all('SELECT * FROM stations ORDER BY name');
    return rows || [];
  } catch (err) {
    console.error('获取站点列表失败:', err);
    throw err;
  }
}

/**
 * 根据关键词搜索站点
 * 支持简拼、全拼、汉字搜索
 */
async function searchStations(keyword) {
  if (!keyword) {
    return await getAllStations();
  }
  
  try {
    const searchPattern = `%${keyword}%`;
    
    // 搜索站点名称、拼音、简拼
    const rows = await dbService.all(
      `SELECT * FROM stations 
       WHERE name LIKE ? OR pinyin LIKE ? OR short_pinyin LIKE ? 
       ORDER BY name`,
      [searchPattern, searchPattern, searchPattern]
    );
    return rows || [];
  } catch (err) {
    console.error('搜索站点失败:', err);
    throw err;
  }
}

/**
 * 验证站点是否有效
 * 如果站点无效，返回相似度匹配的推荐站点
 */
async function validateStation(stationName) {
  if (!stationName) {
    return { valid: false, error: '站点名称不能为空', suggestions: [] };
  }
  
  try {
    // 先精确匹配
    const row = await dbService.get('SELECT * FROM stations WHERE name = ?', [stationName]);
    
    if (row) {
      // 站点有效
      return { valid: true, station: row };
    }
    
    // 站点无效，查找相似站点
    const searchPattern = `%${stationName}%`;
    const rows = await dbService.all(
      `SELECT * FROM stations 
       WHERE name LIKE ? OR pinyin LIKE ? OR short_pinyin LIKE ? 
       ORDER BY name LIMIT 10`,
      [searchPattern, searchPattern, searchPattern]
    );
    
    return {
      valid: false,
      error: '无法匹配该出发地/到达地',
      suggestions: rows || []
    };
  } catch (err) {
    console.error('验证站点失败:', err);
    throw err;
  }
}

/**
 * 获取所有支持的城市列表
 */
async function getAllCities() {
  return cityStationMapping.getAllCities();
}

/**
 * 根据城市名获取该城市的所有车站
 * @param {string} cityName - 城市名
 * @returns {string[]} 车站列表
 */
async function getStationsByCity(cityName) {
  return cityStationMapping.getStationsByCity(cityName);
}

/**
 * 验证城市名是否有效
 * @param {string} cityName - 城市名
 * @returns {Object} 验证结果
 */
async function validateCity(cityName) {
  if (!cityName) {
    return { valid: false, error: '城市名称不能为空', suggestions: [] };
  }
  
  const isValid = cityStationMapping.isCityValid(cityName);
  
  if (isValid) {
    const stations = cityStationMapping.getStationsByCity(cityName);
    return { valid: true, city: cityName, stations };
  }
  
  // 城市无效，提供所有城市作为建议
  const allCities = cityStationMapping.getAllCities();
  return {
    valid: false,
    error: '无法匹配该城市',
    suggestions: allCities
  };
}

/**
 * 根据车站名反查所属城市
 * @param {string} stationName - 车站名
 * @returns {string|null} 城市名
 */
async function getCityByStation(stationName) {
  return cityStationMapping.getCityByStation(stationName);
}

module.exports = {
  getAllStations,
  searchStations,
  validateStation,
  getAllCities,
  getStationsByCity,
  validateCity,
  getCityByStation
};

