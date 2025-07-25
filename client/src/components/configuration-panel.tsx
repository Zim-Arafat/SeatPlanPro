import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, BuildingIcon, UploadIcon, PlayIcon } from 'lucide-react';
import { useExamStore } from '@/store/exam-store';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Department, Building, Room } from '@/types/exam';

const examFormSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  date: z.string().min(1, 'Date is required'),
  shift: z.enum(['1st', '2nd'], { required_error: 'Shift is required' }),
  departmentId: z.number().min(1, 'Department is required'),
  course: z.string().min(1, 'Course is required'),
});

export function ConfigurationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    examData,
    roomSelection,
    setExamData,
    setRoomSelection,
    setCurrentStep,
    setIsGenerating,
    setStats,
    setExamRooms,
  } = useExamStore();

  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [invigilatorFile, setInvigilatorFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      name: examData.name,
      date: examData.date,
      shift: examData.shift as '1st' | '2nd' | undefined,
      departmentId: examData.departmentId || undefined,
      course: examData.course,
    },
  });

  // Queries
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ['/api/buildings'],
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['/api/rooms', roomSelection.buildingId],
    enabled: !!roomSelection.buildingId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students', examData.departmentId],
    enabled: !!examData.departmentId,
  });

  // Mutations
  const createExamMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/exams', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
    },
  });

  const generateSeatsMutation = useMutation({
    mutationFn: async ({ examId, roomIds, seatingPattern }: any) => {
      const response = await apiRequest('POST', `/api/exams/${examId}/generate-seats`, {
        roomIds,
        seatingPattern,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Seat plan generated successfully!',
      });
      setCurrentStep(3);
      setIsGenerating(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to generate seat plan',
        variant: 'destructive',
      });
      setIsGenerating(false);
    },
  });

  const uploadStudentsMutation = useMutation({
    mutationFn: async (students: any[]) => {
      const response = await apiRequest('POST', '/api/students/upload', { students });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: 'Success',
        description: 'Students uploaded successfully!',
      });
    },
  });

  const uploadInvigilatorsMutation = useMutation({
    mutationFn: async (invigilators: any[]) => {
      const response = await apiRequest('POST', '/api/invigilators/upload', { invigilators });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invigilators'] });
      toast({
        title: 'Success',
        description: 'Invigilators uploaded successfully!',
      });
    },
  });

  // Handlers
  const handleFormChange = (field: string, value: any) => {
    setExamData({ [field]: value });
    form.setValue(field as any, value);
  };

  const handleRoomSelection = (roomId: number, checked: boolean) => {
    const newSelectedRooms = checked
      ? [...roomSelection.selectedRoomIds, roomId]
      : roomSelection.selectedRoomIds.filter(id => id !== roomId);
    
    setRoomSelection({ selectedRoomIds: newSelectedRooms });
    
    // Update stats
    const selectedRooms = rooms.filter(room => newSelectedRooms.includes(room.id));
    const totalCapacity = selectedRooms.reduce((sum, room) => sum + room.capacity, 0);
    
    setStats({
      totalStudents: students.length,
      totalRooms: selectedRooms.length,
      totalInvigilators: selectedRooms.length * 3, // 3 per room
      totalCapacity,
    });
  };

  const handleFileUpload = async (file: File, type: 'students' | 'invigilators') => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    if (type === 'students') {
      // Expected format: Roll Number, Name, Department Code
      const studentsData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const deptCode = values[2];
        const dept = departments.find(d => d.code === deptCode);
        
        return {
          rollNumber: values[0],
          name: values[1],
          departmentId: dept?.id || examData.departmentId,
        };
      }).filter(student => student.departmentId);
      
      uploadStudentsMutation.mutate(studentsData);
    } else {
      // Expected format: Name, Designation, Department Code
      const invigilatorsData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const deptCode = values[2];
        const dept = departments.find(d => d.code === deptCode);
        
        return {
          name: values[0],
          designation: values[1],
          departmentId: dept?.id,
        };
      }).filter(inv => inv.departmentId);
      
      uploadInvigilatorsMutation.mutate(invigilatorsData);
    }
  };

  const handleGenerateSeatPlan = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      if (roomSelection.selectedRoomIds.length === 0) {
        toast({
          title: 'No Rooms Selected',
          description: 'Please select at least one room',
          variant: 'destructive',
        });
        return;
      }

      if (!roomSelection.seatingPattern) {
        toast({
          title: 'No Pattern Selected',
          description: 'Please select a seating pattern',
          variant: 'destructive',
        });
        return;
      }

      setIsGenerating(true);

      // Create exam first
      const examResult = await createExamMutation.mutateAsync({
        name: examData.name,
        date: new Date(examData.date).toISOString(),
        shift: examData.shift,
        course: examData.course,
        departmentId: examData.departmentId,
      });

      // Generate seats
      await generateSeatsMutation.mutateAsync({
        examId: examResult.id,
        roomIds: roomSelection.selectedRoomIds,
        seatingPattern: roomSelection.seatingPattern,
      });

    } catch (error) {
      console.error('Error generating seat plan:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="xl:col-span-1 space-y-6">
      {/* Exam Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
            Exam Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="examName">Exam Name</Label>
            <Input
              id="examName"
              placeholder="e.g., Final Examination 2025"
              value={examData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="examDate">Date</Label>
              <Input
                id="examDate"
                type="date"
                value={examData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="shift">Shift</Label>
              <Select value={examData.shift} onValueChange={(value) => handleFormChange('shift', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st Shift (9:00 AM - 12:00 PM)</SelectItem>
                  <SelectItem value="2nd">2nd Shift (1:00 PM - 4:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="department">Department</Label>
            <Select 
              value={examData.departmentId?.toString()} 
              onValueChange={(value) => handleFormChange('departmentId', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.code} - {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="course">Course/Subject</Label>
            <Input
              id="course"
              placeholder="e.g., Data Structures, Circuit Analysis"
              value={examData.course}
              onChange={(e) => handleFormChange('course', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Room Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BuildingIcon className="w-5 h-5 mr-2 text-primary" />
            Room Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="building">Building</Label>
            <Select 
              value={roomSelection.buildingId?.toString()} 
              onValueChange={(value) => setRoomSelection({ buildingId: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Building" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id.toString()}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {roomSelection.buildingId && (
            <div>
              <Label>Room Selection</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-input rounded-md p-3">
                {rooms.map((room) => (
                  <label key={room.id} className="flex items-center p-2 hover:bg-accent rounded cursor-pointer">
                    <Checkbox
                      checked={roomSelection.selectedRoomIds.includes(room.id)}
                      onCheckedChange={(checked) => handleRoomSelection(room.id, checked as boolean)}
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium">{room.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {room.building.name}, Floor {room.floor} • Capacity: {room.capacity}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="pattern">Seating Pattern</Label>
            <Select 
              value={roomSelection.seatingPattern} 
              onValueChange={(value) => setRoomSelection({ seatingPattern: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear (Row by Row)</SelectItem>
                <SelectItem value="serpentine">Serpentine (Zigzag)</SelectItem>
                <SelectItem value="block">Block Pattern</SelectItem>
                <SelectItem value="randomized">Randomized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UploadIcon className="w-5 h-5 mr-2 text-primary" />
            Data Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Student List</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setStudentFile(file);
                    handleFileUpload(file, 'students');
                  }
                }}
                className="hidden"
                id="student-upload"
              />
              <label htmlFor="student-upload" className="cursor-pointer">
                <svg className="mx-auto h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">Click to upload CSV file</p>
                <p className="text-xs text-muted-foreground">Format: Roll Number, Name, Department</p>
              </label>
            </div>
          </div>
          
          <div>
            <Label>Invigilator List</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setInvigilatorFile(file);
                    handleFileUpload(file, 'invigilators');
                  }
                }}
                className="hidden"
                id="invigilator-upload"
              />
              <label htmlFor="invigilator-upload" className="cursor-pointer">
                <svg className="mx-auto h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">Click to upload CSV file</p>
                <p className="text-xs text-muted-foreground">Format: Name, Designation, Department</p>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button 
        onClick={handleGenerateSeatPlan}
        className="w-full py-4"
        size="lg"
        disabled={useExamStore.getState().isGenerating}
      >
        <PlayIcon className="w-5 h-5 mr-2" />
        Generate Seat Plan
      </Button>
    </div>
  );
}
