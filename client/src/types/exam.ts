export interface ExamFormData {
  name: string;
  date: string;
  shift: "1st" | "2nd" | "";
  departmentId: number | null;
  course: string;
}

export interface RoomSelection {
  buildingId: number | null;
  selectedRoomIds: number[];
  seatingPattern: "linear" | "serpentine" | "block" | "randomized" | "";
}

export interface SeatPlanStats {
  totalStudents: number;
  totalRooms: number;
  totalInvigilators: number;
  totalCapacity: number;
}

export interface SeatAssignment {
  id: number;
  seatNumber: number;
  row: number;
  column: number;
  student: {
    id: number;
    rollNumber: string;
    name: string;
    department: {
      code: string;
      name: string;
    };
  };
}

export interface InvigilatorAssignment {
  id: number;
  role: "chief" | "main" | "junior";
  invigilator: {
    id: number;
    name: string;
    designation: string;
    department: {
      code: string;
      name: string;
    };
  };
}

export interface ExamRoomDetail {
  id: number;
  room: {
    id: number;
    number: string;
    name: string;
    capacity: number;
    rows: number;
    columns: number;
    building: {
      name: string;
    };
  };
  seatingPattern: string;
  seatAssignments: SeatAssignment[];
  invigilatorAssignments: InvigilatorAssignment[];
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Building {
  id: number;
  name: string;
  code: string;
}

export interface Room {
  id: number;
  number: string;
  name: string;
  capacity: number;
  rows: number;
  columns: number;
  floor: number;
  roomType: string;
  building: Building;
}

export interface Student {
  id: number;
  rollNumber: string;
  name: string;
  department: Department;
}

export interface Invigilator {
  id: number;
  name: string;
  designation: string;
  department: Department;
}
