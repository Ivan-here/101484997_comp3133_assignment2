import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { GraphqlService } from '../core/graphql.service';
import { Employee } from '../core/models';

@Component({
  selector: 'app-employee-list',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  template: `
    <main class="page-shell">
      <header class="topbar">
        <h1>Employees</h1>
        <div class="topbar-actions">
          <a class="button secondary" routerLink="/employees/new">Add Employee</a>
          <button class="button danger" type="button" (click)="auth.logout()">Logout</button>
        </div>
      </header>
      <section class="toolbar">
        <form [formGroup]="searchForm" (ngSubmit)="loadEmployees()" class="search-form">
          <label>
            Department
            <input type="search" formControlName="department" placeholder="Engineering" />
          </label>
          <label>
            Position
            <input type="search" formControlName="position" placeholder="Developer" />
          </label>
          <button type="submit">Search</button>
          <button class="ghost" type="button" (click)="clearSearch()">Clear</button>
        </form>
      </section>
      @if (error) {
        <p class="alert">{{ error }}</p>
      }
      <section class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Position</th>
              <th>Salary</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (employee of employees; track employee.id) {
              <tr>
                <td>
                  <div class="employee-cell">
                    @if (employee.profilePicture) {
                      <img
                        [src]="employee.profilePicture"
                        [alt]="employee.firstName + ' profile picture'"
                      />
                    } @else {
                      <span class="avatar">{{ initials(employee) }}</span>
                    }
                    <div>
                      <strong>{{ employee.firstName }} {{ employee.lastName }}</strong>
                      <span>{{ employee.email }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ employee.department }}</td>
                <td>{{ employee.position }}</td>
                <td>{{ employee.salary | currency }}</td>
                <td>{{ employee.dateOfJoining }}</td>
                <td>
                  <div class="row-actions">
                    <a [routerLink]="['/employees', employee.id]">View</a>
                    <a [routerLink]="['/employees', employee.id, 'edit']">Edit</a>
                    <button type="button" (click)="deleteEmployee(employee.id)">Delete</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty">No employees found.</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </main>
  `,
})
export class EmployeeListComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(GraphqlService);
  private readonly fb = inject(FormBuilder);

  employees: Employee[] = [];
  error = '';

  readonly searchForm = this.fb.nonNullable.group({
    department: [''],
    position: [''],
  });

  ngOnInit(): void {
    void this.loadEmployees();
  }

  async loadEmployees(): Promise<void> {
    this.error = '';
    const filters = this.searchForm.getRawValue();

    try {
      this.employees = await this.api.employees({
        department: filters.department.trim() || undefined,
        position: filters.position.trim() || undefined,
      });
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Cant load employees.';
    }
  }

  clearSearch(): void {
    this.searchForm.reset();
    void this.loadEmployees();
  }

  async deleteEmployee(id: string): Promise<void> {
    const confirmed = typeof window === 'undefined' || window.confirm('Delete this employee?');
    if (!confirmed) {
      return;
    }

    try {
      await this.api.deleteEmployee(id);
      this.employees = this.employees.filter((employee) => employee.id !== id);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Cant delete employee.';
    }
  }

  initials(employee: Employee): string {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
  }
}
