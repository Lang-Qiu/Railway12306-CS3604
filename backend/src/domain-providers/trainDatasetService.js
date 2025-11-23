const fs = require('fs')
const path = require('path')

function toTrainItem(j) {
  const r = j && (j.route || j.basic || {})
  const fares = j && j.fares ? j.fares : {}
  const trainNo = j.train_no || j.trainNo || j.code || j.number
  if (!trainNo || !r) return null
  const origin = r.origin || r.from || r.start || r.departure
  const destination = r.destination || r.to || r.end || r.arrival
  const departure_time = r.departure_time || r.departureTime
  const arrival_time = r.arrival_time || r.arrivalTime
  const planned_duration_min = r.planned_duration_min || r.durationMin
  return {
    train_no: trainNo,
    train_type: j.train_type || j.type || '',
    route: {
      origin,
      destination,
      departure_time,
      arrival_time,
      planned_duration_min,
    },
    fares,
  }
}

async function search({ from, to, highspeed }) {
  try {
    const dataPath = path.resolve(process.cwd(), 'database', 'custom_train_data.json');
    if (!fs.existsSync(dataPath)) {
        return [];
    }
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const allTrains = JSON.parse(raw);

    const out = [];
    for (const train of allTrains) {
        const item = toTrainItem(train); // Normalize the item
        if (!item) continue;

        const origin = item.route?.origin;
        const dest = item.route?.destination;

        let match = origin === from && dest === to;
        if (match) {
            if (highspeed === '1') {
                if (item.train_type === 'G' || item.train_type === 'D') {
                    out.push(item);
                }
            } else {
                out.push(item);
            }
        }
    }
    return out;
  } catch (e) {
    console.error('Failed to search train data from custom file:', e);
    return [];
  }
}

module.exports = { search }