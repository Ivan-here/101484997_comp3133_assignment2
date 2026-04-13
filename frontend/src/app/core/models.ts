export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  designation: string;
  salary: number;
  dateOfJoining: string;
  department: string;
  position: string;
  profilePicture?: string | null;
}

export type EmployeeInput = Omit<Employee, 'id'>;
