import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
});

export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  buildingId: integer("building_id").references(() => buildings.id).notNull(),
  floor: integer("floor").notNull(),
  capacity: integer("capacity").notNull(),
  rows: integer("rows").notNull(),
  columns: integer("columns").notNull(),
  roomType: varchar("room_type", { length: 20 }).notNull().default("standard"), // standard, hall, conference
  isActive: boolean("is_active").notNull().default(true),
});

export const invigilators = pgTable("invigilators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  designation: varchar("designation", { length: 50 }).notNull(), // Chief Instructor, Instructor, Junior Instructor
  departmentId: integer("department_id").references(() => departments.id),
  isActive: boolean("is_active").notNull().default(true),
});

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  shift: varchar("shift", { length: 10 }).notNull(), // 1st, 2nd
  course: text("course").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  rollNumber: varchar("roll_number", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const examRooms = pgTable("exam_rooms", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  seatingPattern: varchar("seating_pattern", { length: 20 }).notNull(), // linear, serpentine, block, randomized
});

export const seatAssignments = pgTable("seat_assignments", {
  id: serial("id").primaryKey(),
  examRoomId: integer("exam_room_id").references(() => examRooms.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  seatNumber: integer("seat_number").notNull(),
  row: integer("row").notNull(),
  column: integer("column").notNull(),
});

export const invigilatorAssignments = pgTable("invigilator_assignments", {
  id: serial("id").primaryKey(),
  examRoomId: integer("exam_room_id").references(() => examRooms.id).notNull(),
  invigilatorId: integer("invigilator_id").references(() => invigilators.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // chief, main, junior
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  rooms: many(rooms),
  invigilators: many(invigilators),
  exams: many(exams),
  students: many(students),
}));

export const buildingsRelations = relations(buildings, ({ many }) => ({
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  building: one(buildings, {
    fields: [rooms.buildingId],
    references: [buildings.id],
  }),
  examRooms: many(examRooms),
}));

export const invigilatorsRelations = relations(invigilators, ({ one, many }) => ({
  department: one(departments, {
    fields: [invigilators.departmentId],
    references: [departments.id],
  }),
  assignments: many(invigilatorAssignments),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  department: one(departments, {
    fields: [exams.departmentId],
    references: [departments.id],
  }),
  examRooms: many(examRooms),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  department: one(departments, {
    fields: [students.departmentId],
    references: [departments.id],
  }),
  seatAssignments: many(seatAssignments),
}));

export const examRoomsRelations = relations(examRooms, ({ one, many }) => ({
  exam: one(exams, {
    fields: [examRooms.examId],
    references: [exams.id],
  }),
  room: one(rooms, {
    fields: [examRooms.roomId],
    references: [rooms.id],
  }),
  seatAssignments: many(seatAssignments),
  invigilatorAssignments: many(invigilatorAssignments),
}));

export const seatAssignmentsRelations = relations(seatAssignments, ({ one }) => ({
  examRoom: one(examRooms, {
    fields: [seatAssignments.examRoomId],
    references: [examRooms.id],
  }),
  student: one(students, {
    fields: [seatAssignments.studentId],
    references: [students.id],
  }),
}));

export const invigilatorAssignmentsRelations = relations(invigilatorAssignments, ({ one }) => ({
  examRoom: one(examRooms, {
    fields: [invigilatorAssignments.examRoomId],
    references: [examRooms.id],
  }),
  invigilator: one(invigilators, {
    fields: [invigilatorAssignments.invigilatorId],
    references: [invigilators.id],
  }),
}));

// Insert schemas
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertBuildingSchema = createInsertSchema(buildings).omit({ id: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
export const insertInvigilatorSchema = createInsertSchema(invigilators).omit({ id: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertExamRoomSchema = createInsertSchema(examRooms).omit({ id: true });
export const insertSeatAssignmentSchema = createInsertSchema(seatAssignments).omit({ id: true });
export const insertInvigilatorAssignmentSchema = createInsertSchema(invigilatorAssignments).omit({ id: true });

// Types
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Building = typeof buildings.$inferSelect;
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Invigilator = typeof invigilators.$inferSelect;
export type InsertInvigilator = z.infer<typeof insertInvigilatorSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type ExamRoom = typeof examRooms.$inferSelect;
export type InsertExamRoom = z.infer<typeof insertExamRoomSchema>;
export type SeatAssignment = typeof seatAssignments.$inferSelect;
export type InsertSeatAssignment = z.infer<typeof insertSeatAssignmentSchema>;
export type InvigilatorAssignment = typeof invigilatorAssignments.$inferSelect;
export type InsertInvigilatorAssignment = z.infer<typeof insertInvigilatorAssignmentSchema>;

// Extended types for API responses
export type RoomWithBuilding = Room & {
  building: Building;
};

export type ExamWithDetails = Exam & {
  department: Department;
  examRooms: (ExamRoom & {
    room: RoomWithBuilding;
    seatAssignments: (SeatAssignment & {
      student: Student & { department: Department };
    })[];
    invigilatorAssignments: (InvigilatorAssignment & {
      invigilator: Invigilator;
    })[];
  })[];
};

export type StudentWithDepartment = Student & {
  department: Department;
};

export type InvigilatorWithDepartment = Invigilator & {
  department: Department;
};
