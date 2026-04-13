import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthPayload, Employee, EmployeeInput } from './models';

interface GraphQlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

const employeeFields = `
  id
  firstName
  lastName
  email
  gender
  designation
  salary
  dateOfJoining
  department
  position
  profilePicture
`;

@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = 'https://101484997-comp3133-assignment2-back.vercel.app/graphql';
  login(email: string, password: string): Promise<AuthPayload> {
    return this.request<{ login: AuthPayload }>(
      `mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          user { id username email }
        }
      }`,
      { email, password },
    ).then((data) => data.login);
  }

  signup(username: string, email: string, password: string): Promise<AuthPayload> {
    return this.request<{ signup: AuthPayload }>(
      `mutation Signup($username: String!, $email: String!, $password: String!) {
        signup(username: $username, email: $email, password: $password) {
          token
          user { id username email }
        }
      }`,
      { username, email, password },
    ).then((data) => data.signup);
  }
  employees(filters: { department?: string; position?: string } = {}): Promise<Employee[]> {
    return this.request<{ employees: Employee[] }>(
      `query Employees($department: String, $position: String) {
        employees(department: $department, position: $position) { ${employeeFields} }
      }`,
      filters,
    ).then((data) => data.employees);
  }
  employee(id: string): Promise<Employee | null> {
    return this.request<{ employee: Employee | null }>(
      `query Employee($id: ID!) {
        employee(id: $id) { ${employeeFields} }
      }`,
      { id },
    ).then((data) => data.employee);
  }
  addEmployee(input: EmployeeInput): Promise<Employee> {
    return this.request<{ addEmployee: Employee }>(
      `mutation AddEmployee($input: EmployeeInput!) {
        addEmployee(input: $input) { ${employeeFields} }
      }`,
      { input },
    ).then((data) => data.addEmployee);
  }

  updateEmployee(id: string, input: Partial<EmployeeInput>): Promise<Employee> {
    return this.request<{ updateEmployee: Employee }>(
      `mutation UpdateEmployee($id: ID!, $input: EmployeeUpdateInput!) {
        updateEmployee(id: $id, input: $input) { ${employeeFields} }
      }`,
      { id, input },
    ).then((data) => data.updateEmployee);
  }
  deleteEmployee(id: string): Promise<boolean> {
    return this.request<{ deleteEmployee: boolean }>(
      `mutation DeleteEmployee($id: ID!) {
        deleteEmployee(id: $id)
      }`,
      { id },
    ).then((data) => data.deleteEmployee);
  }

  private async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.auth.token) {
      headers = headers.set('Authorization', `Bearer ${this.auth.token}`);
    }
    const response = await firstValueFrom(
      this.http.post<GraphQlResponse<T>>(this.apiUrl, { query, variables }, { headers }),
    ).catch((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const graphQlErrors = (error.error as GraphQlResponse<T> | undefined)?.errors;
        if (graphQlErrors?.length) {
          throw new Error(graphQlErrors.map((item) => item.message).join(' '));
        }
      }
      throw error;
    });
    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(' '));
    }
    if (!response.data) {
      throw new Error('GraphQL request failed.');
    }
    return response.data;
  }
}
