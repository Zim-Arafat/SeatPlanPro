import { create } from 'zustand';
import { ExamFormData, RoomSelection, SeatPlanStats, ExamRoomDetail } from '@/types/exam';

interface ExamStore {
  // Form data
  examData: ExamFormData;
  roomSelection: RoomSelection;
  
  // Generated data
  stats: SeatPlanStats;
  examRooms: ExamRoomDetail[];
  selectedRoomPreview: number;
  
  // UI state
  currentStep: number;
  isGenerating: boolean;
  
  // Actions
  setExamData: (data: Partial<ExamFormData>) => void;
  setRoomSelection: (selection: Partial<RoomSelection>) => void;
  setStats: (stats: SeatPlanStats) => void;
  setExamRooms: (rooms: ExamRoomDetail[]) => void;
  setSelectedRoomPreview: (roomId: number) => void;
  setCurrentStep: (step: number) => void;
  setIsGenerating: (generating: boolean) => void;
  reset: () => void;
}

const initialExamData: ExamFormData = {
  name: '',
  date: '',
  shift: '',
  departmentId: null,
  course: '',
};

const initialRoomSelection: RoomSelection = {
  buildingId: null,
  selectedRoomIds: [],
  seatingPattern: '',
};

const initialStats: SeatPlanStats = {
  totalStudents: 0,
  totalRooms: 0,
  totalInvigilators: 0,
  totalCapacity: 0,
};

export const useExamStore = create<ExamStore>((set, get) => ({
  // Initial state
  examData: initialExamData,
  roomSelection: initialRoomSelection,
  stats: initialStats,
  examRooms: [],
  selectedRoomPreview: 0,
  currentStep: 1,
  isGenerating: false,
  
  // Actions
  setExamData: (data) =>
    set((state) => ({
      examData: { ...state.examData, ...data },
    })),
    
  setRoomSelection: (selection) =>
    set((state) => ({
      roomSelection: { ...state.roomSelection, ...selection },
    })),
    
  setStats: (stats) => set({ stats }),
  
  setExamRooms: (rooms) => set({ examRooms: rooms }),
  
  setSelectedRoomPreview: (roomId) => set({ selectedRoomPreview: roomId }),
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  
  reset: () =>
    set({
      examData: initialExamData,
      roomSelection: initialRoomSelection,
      stats: initialStats,
      examRooms: [],
      selectedRoomPreview: 0,
      currentStep: 1,
      isGenerating: false,
    }),
}));
