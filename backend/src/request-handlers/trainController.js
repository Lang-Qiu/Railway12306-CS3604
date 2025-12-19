const trainDatasetService = require('../domain-providers/trainDatasetService');
const trainDataService = require('../domain-providers/trainDataService');

async function getTrains(req, res) {
  try {
    const { origin, destination, date } = req.query;
    console.log(`[TrainController] Searching trains from ${origin} to ${destination} on ${date}`);
    
    // 调用基于 JSON 文件的数据服务
    // highspeed 参数暂时不传，返回所有匹配车次
    const results = await trainDatasetService.search({ from: origin, to: destination });
    
    // 将嵌套结构扁平化，以匹配前端期望的格式
    const flatResults = results.map(t => ({
        train_no: t.train_no,
        train_type: t.train_type,
        origin: t.route.origin,
        destination: t.route.destination,
        departure_time: t.route.departure_time,
        arrival_time: t.route.arrival_time,
        planned_duration_min: t.route.planned_duration_min,
        // 票价映射，如果数据源中没有票价，这里为 undefined 或 null
        // 前端 transformTrainData 会处理 null 值
        business_price: t.fares.business_tz || t.fares.business || null,
        first_class_price: t.fares.first_tz || t.fares.first || null,
        second_class_price: t.fares.second_tz || t.fares.second || null,
        no_seat_price: t.fares.no_seat || null,
        // 其他席别...
    }));

    console.log(`[TrainController] Found ${flatResults.length} trains.`);
    res.json(flatResults);
  } catch (err) {
    console.error('Error getting trains', err);
    res.status(500).json({ error: 'Failed to retrieve train data.' });
  }
}

async function getTrainById(req, res) {
  try {
    const { trainId } = req.params;
    const train = trainDataService.getTrainDetail(trainId);
    
    if (!train) {
      return res.status(404).json({ error: 'Train not found' });
    }
    
    res.json(train);
  } catch (err) {
    console.error('Error getting train details', err);
    res.status(500).json({ error: 'Failed to retrieve train details.' });
  }
}

module.exports = {
  getTrains,
  getTrainById,
};
