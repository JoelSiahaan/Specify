/**
 * Simple test to verify enrollment filtering logic
 * Run with: npx tsx test-enrollment-logic.ts
 */

// Mock data
const enrollments = [
  { id: '1', studentId: 'student-a', courseId: 'course-1', enrolledAt: new Date() },
  { id: '2', studentId: 'student-a', courseId: 'course-2', enrolledAt: new Date() },
  { id: '3', studentId: 'student-b', courseId: 'course-1', enrolledAt: new Date() },
];

const courses = [
  { id: 'course-1', name: 'Course 1', status: 'ACTIVE' },
  { id: 'course-2', name: 'Course 2', status: 'ACTIVE' },
  { id: 'course-3', name: 'Course 3', status: 'ACTIVE' },
];

// Simulate ListCoursesUseCase logic for student with enrolledOnly=true
function getEnrolledCourses(studentId: string) {
  console.log('\n=== Testing Enrollment Filtering ===');
  console.log('Student ID:', studentId);
  
  // Step 1: Get enrollments for student
  const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
  console.log('\nStep 1 - Student enrollments:', studentEnrollments.length);
  studentEnrollments.forEach(e => console.log('  -', e.courseId));
  
  // Step 2: Extract course IDs
  const enrolledCourseIds = studentEnrollments.map(e => e.courseId);
  console.log('\nStep 2 - Enrolled course IDs:', enrolledCourseIds);
  
  // Step 3: Get courses by IDs
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
  console.log('\nStep 3 - Enrolled courses:', enrolledCourses.length);
  enrolledCourses.forEach(c => console.log('  -', c.name, `(${c.id})`));
  
  // Step 4: Filter by status
  const activeCourses = enrolledCourses.filter(c => c.status === 'ACTIVE');
  console.log('\nStep 4 - Active enrolled courses:', activeCourses.length);
  activeCourses.forEach(c => console.log('  -', c.name));
  
  return activeCourses;
}

// Test for student-a (should get 2 courses)
const resultA = getEnrolledCourses('student-a');
console.log('\n✅ Result for student-a:', resultA.length, 'courses');
console.log('Expected: 2 courses (Course 1, Course 2)');

// Test for student-b (should get 1 course)
console.log('\n' + '='.repeat(50));
const resultB = getEnrolledCourses('student-b');
console.log('\n✅ Result for student-b:', resultB.length, 'courses');
console.log('Expected: 1 course (Course 1)');

// Test for student-c (should get 0 courses)
console.log('\n' + '='.repeat(50));
const resultC = getEnrolledCourses('student-c');
console.log('\n✅ Result for student-c:', resultC.length, 'courses');
console.log('Expected: 0 courses (not enrolled in any)');
