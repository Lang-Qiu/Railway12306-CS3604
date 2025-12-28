const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:3000'

export function transformTrainData(trains: any[], departureDate: string) {
  const today = new Date();
  const depDate = new Date(departureDate);
  const diffTime = Math.abs(depDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  // Date factor: closer date -> fewer tickets
  let dateFactor = 1.0;
  if (diffDays <= 1) dateFactor = 0.4;
  else if (diffDays <= 3) dateFactor = 0.6;
  else if (diffDays <= 7) dateFactor = 0.8;

  return trains.map(train => {
    const availableSeats: { [key: string]: number | null } = {};
    const trainNo = String(train.train_no || '');
    const isGD = trainNo.startsWith('G') || trainNo.startsWith('D') || trainNo.startsWith('C');
    const isTZ = trainNo.startsWith('T') || trainNo.startsWith('Z');
    
    // Popularity factor: G/D -> fewer tickets (high demand)
    const typeFactor = isGD ? 0.7 : 1.0; 
    
    // Station factor: Simulate start station having more tickets
    // Simple random simulation: 30% chance of being "start/major" hub with more tickets
    const stationFactor = Math.random() > 0.7 ? 1.2 : 0.9;

    const totalFactor = dateFactor * typeFactor * stationFactor;

    const generateCount = (min: number, max: number) => {
        const base = Math.floor(Math.random() * (max - min + 1)) + min;
        return Math.max(0, Math.floor(base * totalFactor));
    };
    
    const getRandomSeats = () => generateCount(5, 50);

    // Helper to ensure price exists if we have seats (Mocking prices if missing)
    const prices: any = {
        business: train.business_price,
        firstClass: train.first_class_price,
        secondClass: train.second_class_price,
        noSeat: train.no_seat_price,
        softSleeper: train.soft_sleeper_price,
        hardSleeper: train.hard_sleeper_price,
        hardSeat: train.hard_seat_price, // Assuming these fields might exist or we mock
        softSeat: train.soft_seat_price,
    };

    if (isGD) {
        // G/D: 商务座、优选一等座、一等座、二等座、无座
        availableSeats['商务座'] = generateCount(5, 20);
        if (!prices.business) prices.business = 1800; 

        availableSeats['优选一等座'] = generateCount(10, 50);
        // Mock price for superior first class if not exists
        if (!train.superior_first_class_price) prices.superiorFirstClass = 1200;
        
        availableSeats['一等座'] = generateCount(20, 100);
        if (!prices.firstClass) prices.firstClass = 900;

        availableSeats['二等座'] = generateCount(50, 300);
        if (!prices.secondClass) prices.secondClass = 550;

        availableSeats['无座'] = generateCount(100, 500);
        if (!prices.noSeat) prices.noSeat = 550;

    } else if (isTZ) {
        // T/Z: 高级软卧、软卧、硬卧、软座、硬座、无座
        availableSeats['高级软卧'] = generateCount(5, 15);
        if (!train.superior_soft_sleeper_price) prices.superiorSoftSleeper = 800;

        availableSeats['软卧'] = generateCount(10, 50);
        if (!prices.softSleeper) prices.softSleeper = 400;

        availableSeats['硬卧'] = generateCount(30, 150);
        if (!prices.hardSleeper) prices.hardSleeper = 260;

        availableSeats['软座'] = generateCount(20, 80);
        if (!prices.softSeat) prices.softSeat = 150;

        availableSeats['硬座'] = generateCount(50, 300);
        if (!prices.hardSeat) prices.hardSeat = 98;

        availableSeats['无座'] = generateCount(100, 500);
        if (!prices.noSeat) prices.noSeat = 98;
    } else {
        // Others (K, etc.): Default mixed (Hard Seat, Hard Sleeper, No Seat mostly)
        availableSeats['软卧'] = generateCount(5, 20);
        if (!prices.softSleeper) prices.softSleeper = 380;

        availableSeats['硬卧'] = generateCount(20, 100);
        if (!prices.hardSleeper) prices.hardSleeper = 240;

        availableSeats['硬座'] = generateCount(50, 400);
        if (!prices.hardSeat) prices.hardSeat = 80;
        
        availableSeats['无座'] = generateCount(50, 400);
        if (!prices.noSeat) prices.noSeat = 80;
    }
    if (train.soft_sleeper_price !== undefined && train.soft_sleeper_price !== null) {
      availableSeats['软卧'] = getRandomSeats();
    }
    if (train.hard_sleeper_price !== undefined && train.hard_sleeper_price !== null) {
      availableSeats['硬卧'] = getRandomSeats();
    }
    if (train.dong_sleeper_price !== undefined && train.dong_sleeper_price !== null) {
      availableSeats['动卧'] = getRandomSeats();
    }

    // Construct the requested JSON format list
    const tickets = Object.keys(availableSeats).map(type => ({
        seat_type: type,
        remaining: availableSeats[type]
    }));

    return {
      trainNo: train.train_no,
      trainType: train.train_type,
      departureStation: train.origin,
      arrivalStation: train.destination,
      departureTime: train.departure_time,
      arrivalTime: train.arrival_time,
      duration: train.planned_duration_min,
      availableSeats: availableSeats,
      tickets: tickets, // The requested format
      prices: prices
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
    const transformedData = transformTrainData(data, departureDate);
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
