const trainDataService = require('../domain-providers/trainDataService');

function getTrains(req, res) {
  try {
    const { origin, destination, date } = req.query;
    const trains = trainDataService.listTrainsByRoute(origin, destination, date);
    res.json(trains);
  } catch (err) {
    console.error('Error getting trains', err);
    res.status(500).json({ error: 'Failed to retrieve train data.' });
  }
}

module.exports = {
  getTrains,
};