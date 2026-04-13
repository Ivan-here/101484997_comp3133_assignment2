import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { GraphqlService } from '../core/graphql.service';
import { Employee } from '../core/models';

@Component({
  selector: 'app-employee-details',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <main class="page-shell">
      <header class="topbar">
        <h1>{{ employee ? employee.firstName + ' ' + employee.lastName : 'Employee' }}</h1>
        <div class="topbar-actions">
          <a class="button secondary" routerLink="/employees">Back</a>
          @if (employee) {
            <a class="button secondary" [routerLink]="['/employees', employee.id, 'edit']">Edit</a>
          }
          <button class="button danger" type="button" (click)="auth.logout()">Logout</button>
        </div>
      </header>
      @if (error) {
        <p class="alert">{{ error }}</p>
      }
      @if (employee) {
        <section class="details-panel">
          @if (employee.profilePicture) {
            <img
              class="profile-large"
              [src]="employee.profilePicture"
              [alt]="employee.firstName + ' profile picture'"
            />
          } @else {
            <div class="profile-large fallback">{{ initials(employee) }}</div>
          }
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{{ employee.email }}</dd>
            </div>
            <div>
              <dt>Gender</dt>
              <dd>{{ employee.gender }}</dd>
            </div>
            <div>
              <dt>Designation</dt>
              <dd>{{ employee.designation }}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{{ employee.department }}</dd>
            </div>
            <div>
              <dt>Position</dt>
              <dd>{{ employee.position }}</dd>
            </div>
            <div>
              <dt>Salary</dt>
              <dd>{{ employee.salary | currency }}</dd>
            </div>
            <div>
              <dt>Date of Joining</dt>
              <dd>{{ employee.dateOfJoining }}</dd>
            </div>
          </dl>
        </section>
      }
    </main>
  `,
})
export class EmployeeDetailsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(GraphqlService);
  private readonly route = inject(ActivatedRoute);

  employee: Employee | null = null;
  error = '';

  ngOnInit(): void {
    void this.loadEmployee();
  }

  async loadEmployee(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No Employee id.';
      return;
    }

    try {
      this.employee = await this.api.employee(id);
      if (!this.employee) {
        this.error = 'Employee not found.';
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Cant load employee.';
    }
  }

  initials(employee: Employee): string {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
  }
}
