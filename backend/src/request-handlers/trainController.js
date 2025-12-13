const trainDataService = require('../domain-providers/trainDataService');

function searchTrains(req, res) {
  try {
    const { from, to, date, highspeed } = req.query;
    if (!from || !to || !date) {
      return res.status(400).json({ success: false, error: '缺少必要查询参数' });
    }
    const trains = trainDataService.listTrainsByRoute(from, to, date, highspeed);
    return res.status(200).json({ success: true, trains });
  } catch (err) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

function getTrainDetail(req, res) {
  try {
    const { trainNo } = req.params;
    const detail = trainDataService.getTrainDetail(trainNo);
    if (!detail) return res.status(404).json({ success: false, error: '未找到列车信息' });
    return res.status(200).json({ success: true, train: detail });
  } catch (err) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

module.exports = {
  searchTrains,
  getTrainDetail,
};
