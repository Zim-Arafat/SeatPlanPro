import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExamSchema, insertStudentSchema, insertInvigilatorSchema, type InsertInvigilator } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data on startup
  await storage.initializeData();

  // Departments
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  // Buildings
  app.get("/api/buildings", async (req, res) => {
    try {
      const buildings = await storage.getBuildings();
      res.json(buildings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch buildings" });
    }
  });

  // Rooms
  app.get("/api/rooms", async (req, res) => {
    try {
      const { buildingId } = req.query;
      let rooms;
      
      if (buildingId) {
        rooms = await storage.getRoomsByBuilding(parseInt(buildingId as string));
      } else {
        rooms = await storage.getRooms();
      }
      
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // Invigilators
  app.get("/api/invigilators", async (req, res) => {
    try {
      const invigilators = await storage.getInvigilators();
      res.json(invigilators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invigilators" });
    }
  });

  app.post("/api/invigilators/upload", async (req, res) => {
    try {
      const { invigilators } = req.body;
      
      // Validate each invigilator
      const validatedInvigilators = invigilators.map((inv: InsertInvigilator) => 
        insertInvigilatorSchema.parse(inv)
      );
      
      const results = await Promise.all(
        validatedInvigilators.map((inv: InsertInvigilator) => storage.createInvigilator(inv))
      );
      
      res.json({ success: true, count: results.length });
    } catch (error) {
      res.status(400).json({ error: "Failed to upload invigilators", details: error });
    }
  });

  // Students
  app.get("/api/students", async (req, res) => {
    try {
      const { departmentId } = req.query;
      let students;
      
      if (departmentId) {
        students = await storage.getStudentsByDepartment(parseInt(departmentId as string));
      } else {
        students = await storage.getStudents();
      }
      
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/students/upload", async (req, res) => {
    try {
      const { students } = req.body;
      
      if (!students || !Array.isArray(students)) {
        return res.status(400).json({ error: "Students array is required" });
      }
      
      // Validate each student
      const validatedStudents = students.map((student: InsertStudent) => 
        insertStudentSchema.parse(student)
      );
      
      const results = await storage.createStudentsBatch(validatedStudents);
      
      res.json({ success: true, count: results.length });
    } catch (error) {
      console.error("Student upload error:", error);
      res.status(400).json({ 
        error: "Failed to upload students", 
        message: "Please check the CSV format: Roll Number, Name, Department Code"
      });
    }
  });

  // Exams
  app.get("/api/exams", async (req, res) => {
    try {
      const exams = await storage.getExams();
      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const exam = await storage.getExam(id);
      
      if (!exam) {
        return res.status(404).json({ error: "Exam not found" });
      }
      
      res.json(exam);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", async (req, res) => {
    try {
      const examData = insertExamSchema.parse(req.body);
      const exam = await storage.createExam(examData);
      res.json(exam);
    } catch (error) {
      res.status(400).json({ error: "Failed to create exam", details: error });
    }
  });

  // Seat Plan Generation
  app.post("/api/exams/:id/generate-seats", async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const { roomIds, seatingPattern } = req.body;

      if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
        return res.status(400).json({ error: "Room IDs are required" });
      }

      // Get exam details
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ error: "Exam not found" });
      }

      // Get students for the department
      const students = await storage.getStudentsByDepartment(exam.departmentId);
      if (students.length === 0) {
        return res.status(400).json({ error: "No students found for this department" });
      }

      // Get rooms
      const allRooms = await storage.getRooms();
      const selectedRooms = allRooms.filter(room => roomIds.includes(room.id));

      // Calculate total capacity
      const totalCapacity = selectedRooms.reduce((sum, room) => sum + room.capacity, 0);
      
      if (students.length > totalCapacity) {
        return res.status(400).json({ 
          error: "Not enough capacity in selected rooms",
          studentsCount: students.length,
          totalCapacity 
        });
      }

      // Create exam rooms
      const examRooms = await Promise.all(
        selectedRooms.map(room => 
          storage.createExamRoom({
            examId,
            roomId: room.id,
            seatingPattern: seatingPattern || "linear"
          })
        )
      );

      // Generate seat assignments using different patterns
      const seatAssignments = generateSeatAssignments(
        students, 
        selectedRooms, 
        examRooms, 
        seatingPattern || "linear"
      );

      // Save seat assignments
      await storage.createSeatAssignmentsBatch(seatAssignments);

      // Generate invigilator assignments
      const invigilatorAssignments = await generateInvigilatorAssignments(examRooms, selectedRooms);
      await Promise.all(
        invigilatorAssignments.map(assignment => 
          storage.createInvigilatorAssignment(assignment)
        )
      );

      res.json({ 
        success: true, 
        examRoomsCount: examRooms.length,
        seatAssignmentsCount: seatAssignments.length,
        invigilatorAssignmentsCount: invigilatorAssignments.length
      });

    } catch (error) {
      console.error("Seat generation error:", error);
      res.status(500).json({ error: "Failed to generate seat plan", details: error });
    }
  });

  // Get exam room details with assignments
  app.get("/api/exam-rooms/:examId", async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const examRooms = await storage.getExamRooms(examId);
      
      // Get detailed information for each room
      const roomDetails = await Promise.all(
        examRooms.map(async (examRoom) => {
          const seatAssignments = await storage.getSeatAssignments(examRoom.id);
          const invigilatorAssignments = await storage.getInvigilatorAssignments(examRoom.id);
          
          return {
            ...examRoom,
            seatAssignments,
            invigilatorAssignments
          };
        })
      );
      
      res.json(roomDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exam room details" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate seat assignments based on pattern
function generateSeatAssignments(
  students: any[], 
  rooms: any[], 
  examRooms: any[], 
  pattern: string
) {
  const assignments = [];
  let studentIndex = 0;

  for (let i = 0; i < rooms.length && studentIndex < students.length; i++) {
    const room = rooms[i];
    const examRoom = examRooms[i];
    const studentsInRoom = Math.min(room.capacity, students.length - studentIndex);
    
    const roomStudents = students.slice(studentIndex, studentIndex + studentsInRoom);
    
    // Generate seats based on pattern
    const seats = generateSeatsForRoom(room, roomStudents, pattern);
    
    for (let j = 0; j < seats.length; j++) {
      assignments.push({
        examRoomId: examRoom.id,
        studentId: roomStudents[j].id,
        seatNumber: j + 1,
        row: seats[j].row,
        column: seats[j].column
      });
    }
    
    studentIndex += studentsInRoom;
  }

  return assignments;
}

// Helper function to generate seats for a room based on pattern
function generateSeatsForRoom(room: any, students: any[], pattern: string) {
  const seats = [];
  const { rows, columns } = room;
  
  switch (pattern) {
    case "linear":
      // Fill row by row, left to right
      for (let r = 0; r < rows && seats.length < students.length; r++) {
        for (let c = 0; c < columns && seats.length < students.length; c++) {
          seats.push({ row: r + 1, column: c + 1 });
        }
      }
      break;
      
    case "serpentine":
      // Zigzag pattern - alternate direction each row
      for (let r = 0; r < rows && seats.length < students.length; r++) {
        if (r % 2 === 0) {
          // Left to right
          for (let c = 0; c < columns && seats.length < students.length; c++) {
            seats.push({ row: r + 1, column: c + 1 });
          }
        } else {
          // Right to left
          for (let c = columns - 1; c >= 0 && seats.length < students.length; c--) {
            seats.push({ row: r + 1, column: c + 1 });
          }
        }
      }
      break;
      
    case "block":
      // Fill in blocks of 2x2
      const blockSize = 2;
      for (let br = 0; br < Math.ceil(rows / blockSize) && seats.length < students.length; br++) {
        for (let bc = 0; bc < Math.ceil(columns / blockSize) && seats.length < students.length; bc++) {
          for (let r = br * blockSize; r < Math.min((br + 1) * blockSize, rows) && seats.length < students.length; r++) {
            for (let c = bc * blockSize; c < Math.min((bc + 1) * blockSize, columns) && seats.length < students.length; c++) {
              seats.push({ row: r + 1, column: c + 1 });
            }
          }
        }
      }
      break;
      
    case "randomized":
      // Generate all possible seats and shuffle
      const allSeats = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          allSeats.push({ row: r + 1, column: c + 1 });
        }
      }
      // Simple shuffle
      for (let i = allSeats.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allSeats[i], allSeats[j]] = [allSeats[j], allSeats[i]];
      }
      seats.push(...allSeats.slice(0, students.length));
      break;
      
    default:
      // Default to linear
      for (let r = 0; r < rows && seats.length < students.length; r++) {
        for (let c = 0; c < columns && seats.length < students.length; c++) {
          seats.push({ row: r + 1, column: c + 1 });
        }
      }
  }
  
  return seats;
}

// Helper function to generate invigilator assignments
async function generateInvigilatorAssignments(examRooms: any[], rooms: any[]) {
  const assignments = [];
  const invigilators = await storage.getInvigilators();
  
  // Separate invigilators by designation
  const chiefInstructors = invigilators.filter(inv => inv.designation === "Chief Instructor");
  const instructors = invigilators.filter(inv => inv.designation === "Instructor");
  const juniorInstructors = invigilators.filter(inv => inv.designation === "Junior Instructor");
  
  for (let i = 0; i < examRooms.length; i++) {
    const examRoom = examRooms[i];
    
    // Assign one of each type per room (cycling through available invigilators)
    if (chiefInstructors.length > 0) {
      assignments.push({
        examRoomId: examRoom.id,
        invigilatorId: chiefInstructors[i % chiefInstructors.length].id,
        role: "chief"
      });
    }
    
    if (instructors.length > 0) {
      assignments.push({
        examRoomId: examRoom.id,
        invigilatorId: instructors[i % instructors.length].id,
        role: "main"
      });
    }
    
    if (juniorInstructors.length > 0) {
      assignments.push({
        examRoomId: examRoom.id,
        invigilatorId: juniorInstructors[i % juniorInstructors.length].id,
        role: "junior"
      });
    }
  }
  
  return assignments;
}
