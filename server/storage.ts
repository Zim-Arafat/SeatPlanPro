import {
  departments,
  buildings,
  rooms,
  invigilators,
  exams,
  students,
  examRooms,
  seatAssignments,
  invigilatorAssignments,
  type Department,
  type Building,
  type Room,
  type RoomWithBuilding,
  type Invigilator,
  type Exam,
  type ExamWithDetails,
  type Student,
  type StudentWithDepartment,
  type InvigilatorWithDepartment,
  type ExamRoom,
  type SeatAssignment,
  type InvigilatorAssignment,
  type InsertDepartment,
  type InsertBuilding,
  type InsertRoom,
  type InsertInvigilator,
  type InsertExam,
  type InsertStudent,
  type InsertExamRoom,
  type InsertSeatAssignment,
  type InsertInvigilatorAssignment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Departments
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Buildings
  getBuildings(): Promise<Building[]>;
  createBuilding(building: InsertBuilding): Promise<Building>;

  // Rooms
  getRooms(): Promise<RoomWithBuilding[]>;
  getRoomsByBuilding(buildingId: number): Promise<RoomWithBuilding[]>;
  createRoom(room: InsertRoom): Promise<Room>;

  // Invigilators
  getInvigilators(): Promise<InvigilatorWithDepartment[]>;
  createInvigilator(invigilator: InsertInvigilator): Promise<Invigilator>;

  // Students
  getStudents(): Promise<StudentWithDepartment[]>;
  getStudentsByDepartment(departmentId: number): Promise<StudentWithDepartment[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  createStudentsBatch(students: InsertStudent[]): Promise<Student[]>;

  // Exams
  getExams(): Promise<ExamWithDetails[]>;
  getExam(id: number): Promise<ExamWithDetails | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;

  // Exam Rooms
  createExamRoom(examRoom: InsertExamRoom): Promise<ExamRoom>;
  getExamRooms(examId: number): Promise<ExamRoom[]>;

  // Seat Assignments
  createSeatAssignment(assignment: InsertSeatAssignment): Promise<SeatAssignment>;
  createSeatAssignmentsBatch(assignments: InsertSeatAssignment[]): Promise<SeatAssignment[]>;
  getSeatAssignments(examRoomId: number): Promise<SeatAssignment[]>;

  // Invigilator Assignments
  createInvigilatorAssignment(assignment: InsertInvigilatorAssignment): Promise<InvigilatorAssignment>;
  getInvigilatorAssignments(examRoomId: number): Promise<InvigilatorAssignment[]>;

  // Initialization
  initializeData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(asc(departments.code));
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [created] = await db.insert(departments).values(department).returning();
    return created;
  }

  async getBuildings(): Promise<Building[]> {
    return await db.select().from(buildings).orderBy(asc(buildings.name));
  }

  async createBuilding(building: InsertBuilding): Promise<Building> {
    const [created] = await db.insert(buildings).values(building).returning();
    return created;
  }

  async getRooms(): Promise<RoomWithBuilding[]> {
    return await db
      .select()
      .from(rooms)
      .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
      .orderBy(asc(buildings.name), asc(rooms.number))
      .then(rows => 
        rows.map(row => ({
          ...row.rooms,
          building: row.buildings!
        }))
      );
  }

  async getRoomsByBuilding(buildingId: number): Promise<RoomWithBuilding[]> {
    return await db
      .select()
      .from(rooms)
      .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
      .where(eq(rooms.buildingId, buildingId))
      .orderBy(asc(rooms.number))
      .then(rows => 
        rows.map(row => ({
          ...row.rooms,
          building: row.buildings!
        }))
      );
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [created] = await db.insert(rooms).values(room).returning();
    return created;
  }

  async getInvigilators(): Promise<InvigilatorWithDepartment[]> {
    return await db
      .select()
      .from(invigilators)
      .leftJoin(departments, eq(invigilators.departmentId, departments.id))
      .where(eq(invigilators.isActive, true))
      .orderBy(asc(invigilators.designation), asc(invigilators.name))
      .then(rows => 
        rows.map(row => ({
          ...row.invigilators,
          department: row.departments!
        }))
      );
  }

  async createInvigilator(invigilator: InsertInvigilator): Promise<Invigilator> {
    const [created] = await db.insert(invigilators).values(invigilator).returning();
    return created;
  }

  async getStudents(): Promise<StudentWithDepartment[]> {
    return await db
      .select()
      .from(students)
      .leftJoin(departments, eq(students.departmentId, departments.id))
      .where(eq(students.isActive, true))
      .orderBy(asc(students.rollNumber))
      .then(rows => 
        rows.map(row => ({
          ...row.students,
          department: row.departments!
        }))
      );
  }

  async getStudentsByDepartment(departmentId: number): Promise<StudentWithDepartment[]> {
    return await db
      .select()
      .from(students)
      .leftJoin(departments, eq(students.departmentId, departments.id))
      .where(eq(students.departmentId, departmentId))
      .orderBy(asc(students.rollNumber))
      .then(rows => 
        rows.map(row => ({
          ...row.students,
          department: row.departments!
        }))
      );
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student).returning();
    return created;
  }

  async createStudentsBatch(studentsData: InsertStudent[]): Promise<Student[]> {
    return await db.insert(students).values(studentsData).returning();
  }

  async getExams(): Promise<ExamWithDetails[]> {
    // This would need complex joins - for now return basic exams
    const examList = await db
      .select()
      .from(exams)
      .leftJoin(departments, eq(exams.departmentId, departments.id))
      .orderBy(desc(exams.createdAt));

    // Convert to ExamWithDetails format (simplified)
    return examList.map(row => ({
      ...row.exams,
      department: row.departments!,
      examRooms: []
    })) as ExamWithDetails[];
  }

  async getExam(id: number): Promise<ExamWithDetails | undefined> {
    const [exam] = await db
      .select()
      .from(exams)
      .leftJoin(departments, eq(exams.departmentId, departments.id))
      .where(eq(exams.id, id));

    if (!exam) return undefined;

    return {
      ...exam.exams,
      department: exam.departments!,
      examRooms: []
    } as ExamWithDetails;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [created] = await db.insert(exams).values(exam).returning();
    return created;
  }

  async createExamRoom(examRoom: InsertExamRoom): Promise<ExamRoom> {
    const [created] = await db.insert(examRooms).values(examRoom).returning();
    return created;
  }

  async getExamRooms(examId: number): Promise<ExamRoom[]> {
    return await db.select().from(examRooms).where(eq(examRooms.examId, examId));
  }

  async createSeatAssignment(assignment: InsertSeatAssignment): Promise<SeatAssignment> {
    const [created] = await db.insert(seatAssignments).values(assignment).returning();
    return created;
  }

  async createSeatAssignmentsBatch(assignments: InsertSeatAssignment[]): Promise<SeatAssignment[]> {
    return await db.insert(seatAssignments).values(assignments).returning();
  }

  async getSeatAssignments(examRoomId: number): Promise<SeatAssignment[]> {
    return await db.select().from(seatAssignments).where(eq(seatAssignments.examRoomId, examRoomId));
  }

  async createInvigilatorAssignment(assignment: InsertInvigilatorAssignment): Promise<InvigilatorAssignment> {
    const [created] = await db.insert(invigilatorAssignments).values(assignment).returning();
    return created;
  }

  async getInvigilatorAssignments(examRoomId: number): Promise<InvigilatorAssignment[]> {
    return await db.select().from(invigilatorAssignments).where(eq(invigilatorAssignments.examRoomId, examRoomId));
  }

  async initializeData(): Promise<void> {
    // Check if data already exists
    const existingDepartments = await this.getDepartments();
    if (existingDepartments.length > 0) {
      return; // Data already initialized
    }

    // Initialize departments
    const departmentData: InsertDepartment[] = [
      { code: "CST", name: "Computer Science & Technology", description: "Computer Science and Technology Department" },
      { code: "CT", name: "Civil Technology", description: "Civil Technology Department" },
      { code: "PT", name: "Power Technology", description: "Power Technology Department" },
      { code: "ET", name: "Electrical Technology", description: "Electrical Technology Department" },
      { code: "ENT", name: "Electronics Technology", description: "Electronics Technology Department" },
      { code: "EMT", name: "Electro Medical Technology", description: "Electro Medical Technology Department" },
    ];

    const createdDepartments = await Promise.all(
      departmentData.map(dept => this.createDepartment(dept))
    );

    // Initialize buildings
    const buildingData: InsertBuilding[] = [
      { name: "Building 1", code: "B1" },
      { name: "Building 2", code: "B2" },
    ];

    const createdBuildings = await Promise.all(
      buildingData.map(building => this.createBuilding(building))
    );

    // Initialize rooms based on your exact building structure
    const roomData: InsertRoom[] = [
      // Building 1 - Ground Floor (1101-1135)
      ...Array.from({ length: 35 }, (_, i) => ({
        number: `110${(i + 1).toString().padStart(2, '0')}`,
        name: `Room 110${(i + 1).toString().padStart(2, '0')}`,
        buildingId: createdBuildings[0].id,
        floor: 0, // Ground floor
        capacity: Math.floor(Math.random() * 16) + 50, // 50-65 capacity
        rows: 8,
        columns: 8,
        roomType: "standard",
      })),
      
      // Building 1 - First Floor (1201-1235) + special rooms 1201-A, 1201-B, conference 1219
      ...Array.from({ length: 35 }, (_, i) => {
        const roomNum = `120${(i + 1).toString().padStart(2, '0')}`;
        // Skip 1201 as we'll add 1201-A and 1201-B separately
        if (roomNum === "1201") return null;
        
        return {
          number: roomNum,
          name: `Room ${roomNum}`,
          buildingId: createdBuildings[0].id,
          floor: 1,
          capacity: roomNum === "1219" ? 105 : Math.floor(Math.random() * 16) + 50, // Conference room 1219
          rows: roomNum === "1219" ? 12 : 8,
          columns: roomNum === "1219" ? 9 : 8,
          roomType: roomNum === "1219" ? "conference" : "standard",
        };
      }).filter(Boolean) as InsertRoom[],
      
      // Special rooms 1201-A and 1201-B (50 capacity each)
      {
        number: "1201-A",
        name: "Class 1201-A",
        buildingId: createdBuildings[0].id,
        floor: 1,
        capacity: 50,
        rows: 7,
        columns: 8,
        roomType: "standard",
      },
      {
        number: "1201-B",
        name: "Class 1201-B",
        buildingId: createdBuildings[0].id,
        floor: 1,
        capacity: 50,
        rows: 7,
        columns: 8,
        roomType: "standard",
      },
      
      // Building 1 - Second Floor (1301-1335-B) with halls 1335-A and 1335-B
      ...Array.from({ length: 34 }, (_, i) => {
        const roomNum = `130${(i + 1).toString().padStart(2, '0')}`;
        // Skip 1335 as we'll add 1335-A and 1335-B separately
        if (roomNum === "1335") return null;
        
        return {
          number: roomNum,
          name: `Room ${roomNum}`,
          buildingId: createdBuildings[0].id,
          floor: 2,
          capacity: Math.floor(Math.random() * 16) + 50, // 50-65 capacity
          rows: 8,
          columns: 8,
          roomType: "standard",
        };
      }).filter(Boolean) as InsertRoom[],
      
      // Special halls 1335-A and 1335-B (70 capacity each)
      {
        number: "1335-A",
        name: "Hall 1335-A",
        buildingId: createdBuildings[0].id,
        floor: 2,
        capacity: 70,
        rows: 9,
        columns: 8,
        roomType: "hall",
      },
      {
        number: "1335-B",
        name: "Hall 1335-B",
        buildingId: createdBuildings[0].id,
        floor: 2,
        capacity: 70,
        rows: 9,
        columns: 8,
        roomType: "hall",
      },
      
      // Building 2 - Ground Floor (2101-2120)
      ...Array.from({ length: 20 }, (_, i) => ({
        number: `210${(i + 1).toString().padStart(2, '0')}`,
        name: `Room 210${(i + 1).toString().padStart(2, '0')}`,
        buildingId: createdBuildings[1].id,
        floor: 0,
        capacity: Math.floor(Math.random() * 16) + 50, // 50-65 capacity
        rows: 8,
        columns: 8,
        roomType: "standard",
      })),
      
      // Building 2 - First Floor (2201-2219)
      ...Array.from({ length: 19 }, (_, i) => ({
        number: `220${(i + 1).toString().padStart(2, '0')}`,
        name: `Room 220${(i + 1).toString().padStart(2, '0')}`,
        buildingId: createdBuildings[1].id,
        floor: 1,
        capacity: Math.floor(Math.random() * 16) + 50, // 50-65 capacity
        rows: 8,
        columns: 8,
        roomType: "standard",
      })),
      
      // Building 2 - Second Floor (2301-2319)
      ...Array.from({ length: 19 }, (_, i) => ({
        number: `230${(i + 1).toString().padStart(2, '0')}`,
        name: `Room 230${(i + 1).toString().padStart(2, '0')}`,
        buildingId: createdBuildings[1].id,
        floor: 2,
        capacity: Math.floor(Math.random() * 16) + 50, // 50-65 capacity
        rows: 8,
        columns: 8,
        roomType: "standard",
      })),
    ];

    await Promise.all(roomData.map(room => this.createRoom(room)));

    // Initialize sample invigilators
    const invigilatorData: InsertInvigilator[] = [
      { name: "Sarah Ahmed", designation: "Chief Instructor", departmentId: createdDepartments[0].id },
      { name: "Michael Johnson", designation: "Instructor", departmentId: createdDepartments[0].id },
      { name: "Lisa Chen", designation: "Junior Instructor", departmentId: createdDepartments[0].id },
      { name: "David Wilson", designation: "Chief Instructor", departmentId: createdDepartments[1].id },
      { name: "Emma Davis", designation: "Instructor", departmentId: createdDepartments[1].id },
      { name: "James Brown", designation: "Junior Instructor", departmentId: createdDepartments[1].id },
      { name: "Maria Rodriguez", designation: "Chief Instructor", departmentId: createdDepartments[2].id },
      { name: "Robert Taylor", designation: "Instructor", departmentId: createdDepartments[2].id },
      { name: "Jennifer Wilson", designation: "Junior Instructor", departmentId: createdDepartments[2].id },
      { name: "Ahmed Khan", designation: "Chief Instructor", departmentId: createdDepartments[3].id },
      { name: "Fatima Ali", designation: "Instructor", departmentId: createdDepartments[3].id },
      { name: "Hassan Mahmood", designation: "Junior Instructor", departmentId: createdDepartments[3].id },
      { name: "Ayesha Rehman", designation: "Chief Instructor", departmentId: createdDepartments[4].id },
      { name: "Omar Farooq", designation: "Instructor", departmentId: createdDepartments[4].id },
      { name: "Zara Sheikh", designation: "Junior Instructor", departmentId: createdDepartments[4].id },
      { name: "Ali Raza", designation: "Chief Instructor", departmentId: createdDepartments[5].id },
      { name: "Nadia Iqbal", designation: "Instructor", departmentId: createdDepartments[5].id },
      { name: "Usman Ahmed", designation: "Junior Instructor", departmentId: createdDepartments[5].id },
    ];

    await Promise.all(invigilatorData.map(inv => this.createInvigilator(inv)));
  }
}

export const storage = new DatabaseStorage();
