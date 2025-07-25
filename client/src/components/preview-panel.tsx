import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EyeIcon, UsersIcon, DownloadIcon, File, Ungroup, Users } from 'lucide-react';
import { useExamStore } from '@/store/exam-store';
import { SeatingGrid } from './seating-grid';
import type { ExamRoomDetail } from '@/types/exam';

export function PreviewPanel() {
  const { stats, selectedRoomPreview, setSelectedRoomPreview } = useExamStore();
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // Query for exam room details
  const { data: examRooms = [] } = useQuery<ExamRoomDetail[]>({
    queryKey: ['/api/exam-rooms', selectedExamId],
    enabled: !!selectedExamId,
  });

  const currentRoom = examRooms.find(room => room.id === selectedRoomPreview) || examRooms[0];

  const handleGenerateMasterPDF = () => {
    // TODO: Implement PDF generation
    console.log('Generating Master PDF...');
  };

  const handleGenerateClasswisePDFs = () => {
    // TODO: Implement class-wise PDF generation
    console.log('Generating Class-wise PDFs...');
  };

  const handleGenerateInvigilatorHandouts = () => {
    // TODO: Implement invigilator handouts generation
    console.log('Generating Invigilator Handouts...');
  };

  // Department color legend
  const departmentColors = [
    { code: 'CST', name: 'Computer Science & Technology', color: 'bg-blue-200' },
    { code: 'CT', name: 'Civil Technology', color: 'bg-green-200' },
    { code: 'PT', name: 'Power Technology', color: 'bg-yellow-200' },
    { code: 'ET', name: 'Electrical Technology', color: 'bg-purple-200' },
    { code: 'ENT', name: 'Electronics Technology', color: 'bg-pink-200' },
    { code: 'EMT', name: 'Electro Medical Technology', color: 'bg-indigo-200' },
  ];

  return (
    <div className="xl:col-span-2 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-cyan-600">{stats.totalRooms}</div>
            <div className="text-sm text-muted-foreground">Rooms Selected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalInvigilators}</div>
            <div className="text-sm text-muted-foreground">Invigilators</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.totalCapacity}</div>
            <div className="text-sm text-muted-foreground">Total Capacity</div>
          </CardContent>
        </Card>
      </div>

      {/* Seating Plan Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <EyeIcon className="w-5 h-5 mr-2 text-primary" />
              Seating Plan Preview
            </CardTitle>
            <div className="flex items-center space-x-2">
              {examRooms.length > 0 && (
                <Select 
                  value={currentRoom?.id.toString()} 
                  onValueChange={(value) => setSelectedRoomPreview(parseInt(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Room" />
                  </SelectTrigger>
                  <SelectContent>
                    {examRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentRoom ? (
            <>
              <SeatingGrid
                rows={currentRoom.room.rows}
                columns={currentRoom.room.columns}
                seatAssignments={currentRoom.seatAssignments}
                className="mb-4"
              />
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs">
                {departmentColors.map((dept) => (
                  <div key={dept.code} className="flex items-center">
                    <div className={`w-3 h-3 ${dept.color} rounded mr-1`}></div>
                    {dept.code} Department
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              Generate a seat plan to see the preview
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invigilator Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersIcon className="w-5 h-5 mr-2 text-primary" />
            Invigilator Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {examRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examRooms.map((examRoom) => {
                const chiefInstructor = examRoom.invigilatorAssignments.find(a => a.role === 'chief');
                const instructor = examRoom.invigilatorAssignments.find(a => a.role === 'main');
                const juniorInstructor = examRoom.invigilatorAssignments.find(a => a.role === 'junior');

                return (
                  <div key={examRoom.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{examRoom.room.name}</h4>
                      <span className="text-sm text-muted-foreground">
                        {examRoom.seatAssignments.length} students
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Chief Instructor:</span>
                        <span className="font-medium">
                          {chiefInstructor?.invigilator.name || 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Instructor:</span>
                        <span className="font-medium">
                          {instructor?.invigilator.name || 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Junior Instructor:</span>
                        <span className="font-medium">
                          {juniorInstructor?.invigilator.name || 'Not assigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No invigilator assignments yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DownloadIcon className="w-5 h-5 mr-2 text-primary" />
            Generate & Download
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button 
              onClick={handleGenerateMasterPDF}
              className="bg-green-600 hover:bg-green-700"
            >
              <File className="w-4 h-4 mr-2" />
              Master PDF
            </Button>
            <Button 
              onClick={handleGenerateClasswisePDFs}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Ungroup className="w-4 h-4 mr-2" />
              Class-wise PDFs
            </Button>
            <Button 
              onClick={handleGenerateInvigilatorHandouts}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Invigilator Handouts
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              Email to Invigilators
            </Button>
            <Button variant="secondary" size="sm">
              Print All
            </Button>
            <Button variant="secondary" size="sm">
              Export Excel
            </Button>
            <Button variant="secondary" size="sm">
              Save Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
