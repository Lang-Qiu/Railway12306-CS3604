export interface Station {
  name: string;
}

export interface TrainInfo {
  trainNumber: string;
  startStation: Station;
  endStation: Station;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startDate: string; // YYYY-MM-DD
}

export interface Passenger {
  name: string;
  idType: string;
  idNumber: string;
  ticketType: string;
  seatType: string;
  coachNumber: string;
  seatNumber: string;
  price: number;
  status: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  created_at: string;
  total_price: number;
  train: TrainInfo;
  passengers: Passenger[];
}
