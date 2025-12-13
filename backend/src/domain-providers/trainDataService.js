function listTrainsByRoute(from, to, date, highspeed) {
  const sample = [
    {
      trainNumber: 'G100',
      departure: from || '北京',
      arrival: to || '上海',
      departureTime: '08:00',
      arrivalTime: '12:30',
      duration: '4:30',
      businessPrice: 999,
      firstClassPrice: 699,
      secondClassPrice: 399,
      businessSeat: 30,
      firstClassSeat: 80,
      secondClassSeat: 200,
    },
    {
      trainNumber: 'G101',
      departure: from || '北京',
      arrival: to || '上海',
      departureTime: '09:00',
      arrivalTime: '13:30',
      duration: '4:30',
      businessPrice: 980,
      firstClassPrice: 680,
      secondClassPrice: 380,
      businessSeat: 25,
      firstClassSeat: 70,
      secondClassSeat: 210,
    },
  ];
  const list = sample.filter(t => {
    if (highspeed === '1') {
      return t.trainNumber.startsWith('G') || t.trainNumber.startsWith('D');
    }
    return true;
  });
  return list;
}

function getTrainDetail(trainNo) {
  if (!trainNo) return null;
  if (trainNo !== 'G100' && trainNo !== 'G101') return null;
  const base = trainNo === 'G100' ? {
    trainNumber: 'G100',
    route: [
      { station: '北京南', time: '08:00' },
      { station: '济南西', time: '10:10' },
      { station: '南京南', time: '11:30' },
      { station: '上海虹桥', time: '12:30' },
    ],
    fares: {
      business: 999,
      firstClass: 699,
      secondClass: 399,
    },
    seats: {
      business: 30,
      firstClass: 80,
      secondClass: 200,
    },
  } : {
    trainNumber: 'G101',
    route: [
      { station: '北京南', time: '09:00' },
      { station: '济南西', time: '11:10' },
      { station: '南京南', time: '12:30' },
      { station: '上海虹桥', time: '13:30' },
    ],
    fares: {
      business: 980,
      firstClass: 680,
      secondClass: 380,
    },
    seats: {
      business: 25,
      firstClass: 70,
      secondClass: 210,
    },
  };
  return base;
}

module.exports = {
  listTrainsByRoute,
  getTrainDetail,
}
