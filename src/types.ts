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
  updatedAt: string;
}

export interface NotificationResponse {
  count: number;
  data: Notification[];
  message?: string;
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
  vehicles?: Vehicle[];
  residents?: Resident[];
  createdAt: string;
  updatedAt: string;
};

export type Vehicle = {
  id: number;
  plate: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export type Resident = {
  id: number;
  name: string;
};

export interface ResidenceResponse {
  count: number;
  data: Residence[];
  message?: string;
}

export interface Pricing {
  type: 'DAILY' | 'MONTHLY' | 'RESERVED';
  vehicleType: 'MOTORBIKE' | 'CAR';
  price: number;
}

export type TicketType = 'DAILY' | 'MONTHLY' | 'RESERVED';

export interface Ticket {
  id: number;
  type: TicketType;
  status: "AVAILABLE" | "INUSE" | "LOST";
  vehicleId?: number;
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicket {
  type: TicketType | null;
  userId?: number;
  vehicleId?: number;
  sectionId?: number;
  slot?: number;
}

export interface TicketResponse {
  count: number;
  data: Ticket[];
  message?: string;
}

export interface Transaction {
  id: number;
  userId: number;
  amount: number;
  status: "PENDING" | "PAID";
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  count: number;
  data: Transaction[];
  message?: string;
}



