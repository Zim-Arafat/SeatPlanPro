import { cn } from '@/lib/utils';
import type { SeatAssignment } from '@/types/exam';

interface SeatingGridProps {
  rows: number;
  columns: number;
  seatAssignments: SeatAssignment[];
  className?: string;
}

export function SeatingGrid({ rows, columns, seatAssignments, className }: SeatingGridProps) {
  // Create a map for quick lookup of seat assignments
  const seatMap = new Map<string, SeatAssignment>();
  seatAssignments.forEach(assignment => {
    const key = `${assignment.row}-${assignment.column}`;
    seatMap.set(key, assignment);
  });

  // Generate grid
  const grid = [];
  for (let row = 1; row <= rows; row++) {
    const rowSeats = [];
    for (let col = 1; col <= columns; col++) {
      const key = `${row}-${col}`;
      const assignment = seatMap.get(key);
      rowSeats.push({
        row,
        column: col,
        assignment,
      });
    }
    grid.push(rowSeats);
  }

  // Department color mapping
  const getDepartmentColor = (deptCode: string) => {
    const colors = {
      'CST': 'bg-blue-100 border-blue-200 text-blue-800',
      'CT': 'bg-green-100 border-green-200 text-green-800',
      'PT': 'bg-yellow-100 border-yellow-200 text-yellow-800',
      'ET': 'bg-purple-100 border-purple-200 text-purple-800',
      'ENT': 'bg-pink-100 border-pink-200 text-pink-800',
      'EMT': 'bg-indigo-100 border-indigo-200 text-indigo-800',
    };
    return colors[deptCode as keyof typeof colors] || 'bg-gray-100 border-gray-200 text-gray-800';
  };

  return (
    <div className={cn('bg-gray-50 rounded-lg p-6', className)}>
      {/* Teacher's Desk */}
      <div className="text-center mb-4">
        <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium">
          Whiteboard / Teacher's Desk
        </div>
      </div>
      
      {/* Seat Grid */}
      <div className="space-y-3 max-w-4xl mx-auto">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-3 justify-center">
            {row.map((seat) => (
              <div
                key={`${seat.row}-${seat.column}`}
                className={cn(
                  'w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs cursor-pointer transition-colors',
                  seat.assignment
                    ? getDepartmentColor(seat.assignment.student.department.code)
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                )}
                title={
                  seat.assignment
                    ? `Seat ${seat.assignment.seatNumber}: ${seat.assignment.student.name} (${seat.assignment.student.rollNumber})`
                    : `Row ${seat.row}, Column ${seat.column}`
                }
              >
                <div className="font-bold leading-none">
                  {seat.assignment ? seat.assignment.seatNumber.toString().padStart(2, '0') : '--'}
                </div>
                {seat.assignment && (
                  <div className="text-xs leading-none truncate w-full text-center">
                    {seat.assignment.student.rollNumber.slice(-4)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Exit */}
      <div className="text-center mt-4">
        <div className="inline-block bg-gray-600 text-white px-4 py-1 rounded text-xs">
          Exit
        </div>
      </div>
    </div>
  );
}
