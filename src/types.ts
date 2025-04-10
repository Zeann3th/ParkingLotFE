export interface Notification {
  id: number;
  from: {
    id: number;
    username: string;
    name: string;
  };
  message: string;
  status: string;
  createdAt: string;
}

export interface NotificationResponse {
  count: number;
  data: Notification[];
}

export type CheckIn = {
  sectionId: number | string;
  ticketId: number | string;
  plate: string;
  type: string;
};

export type CheckOut = {
  sectionId: number | string;
  ticketId: number | string;
  plate: string;
};

export type Residence = {
  id: number;
  building: string;
  room: number;
};

export type Vehicle = {
  id: number;
  plate: string;
  type: string;
};

export type Resident = {
  id: number;
  name: string;
};

export type ResidenceDetail = {
  id: number;
  building: string;
  room: number;
  vehicles: Vehicle[];
  residents: Resident[];
};

export interface ResidenceResponse {
  count: number;
  data: Residence[];
}

export interface Pricing {
  type: 'DAILY' | 'MONTHLY' | 'RESERVED';
  vehicleType: 'MOTORBIKE' | 'CAR';
  price: number;
}

export interface Ticket {
  id: number;
  title: string;
  type: "DAILY" | "MONTHLY" | "RESERVED";
  status: "AVAILABLE" | "INUSE" | "LOST";
  vehicleId?: number;
  userId?: number;
}

export interface TicketResponse {
  count: number;
  data: Ticket[];
}

export interface Transaction {
  id: number;
  userId: number;
  amount: number;
  status: "PENDING" | "PAID";
  month: number;
  year: number;
}

export interface TransactionResponse {
  count: number;
  data: Transaction[];
}



