const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:3000'

function transformTrainData(trains: any[]) {
  return trains.map(train => {
    const availableSeats: { [key: string]: number | null } = {};

    const getRandomSeats = () => {
        const r = Math.random();
        if (r < 0.1) return 0; 
        if (r < 0.3) return Math.floor(Math.random() * 19) + 1;
        return 20;
    };

    if (train.business_price !== null) {
      availableSeats['商务座'] = getRandomSeats();
    }
    if (train.first_class_price !== null) {
      availableSeats['一等座'] = getRandomSeats();
    }
    if (train.second_class_price !== null) {
      availableSeats['二等座'] = getRandomSeats();
    }
    if (train.no_seat_price !== null) {
        availableSeats['无座'] = getRandomSeats();
    }

    return {
      trainNo: train.train_no,
      trainType: train.train_type,
      departureStation: train.origin,
      arrivalStation: train.destination,
      departureTime: train.departure_time,
      arrivalTime: train.arrival_time,
      duration: train.planned_duration_min,
      availableSeats: availableSeats,
    };
  });
}

export async function searchTrains(departureStation: string, arrivalStation: string, departureDate: string, trainTypes?: string[]) {
  try {
    const response = await fetch(`${API_BASE}/api/trains?origin=${departureStation}&destination=${arrivalStation}&date=${departureDate}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const transformedData = transformTrainData(data);
    return { success: true, trains: transformedData, timestamp: Date.now() };
  } catch (error) {
    console.error('Error fetching trains:', error);
    return { success: false, error: 'Failed to fetch trains', trains: [] };
  }
}

export async function getAvailableDates() {
  const today = new Date().toISOString().split('T')[0]
  return { success: true, availableDates: [today], currentDate: today }
}