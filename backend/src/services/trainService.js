// Mock service
const getTrainDetails = async (trainId) => {
  // TODO: Implement DB access
  // involved tables: trains, stations, train_seats, seat_types
  return {
    id: trainId,
    train_no: 'G27',
    start_station: '北京南',
    end_station: '上海虹桥',
    start_time: '19:00',
    end_time: '23:35',
    seats: [
        { type: '二等座', price: 553.0, available: 100 },
        { type: '一等座', price: 933.0, available: 20 }
    ]
  };
};

module.exports = {
  getTrainDetails
};
