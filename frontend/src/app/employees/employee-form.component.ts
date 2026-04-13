import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { GraphqlService } from '../core/graphql.service';
import { Employee, EmployeeInput } from '../core/models';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="page-shell">
      <header class="topbar">
        <h1>{{ isEdit ? 'Update Employee' : 'Add Employee' }}</h1>
        <div class="topbar-actions">
          <a class="button secondary" routerLink="/employees">Back</a>
          <button class="button danger" type="button" (click)="auth.logout()">Logout</button>
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" class="employee-form">
        <div class="form-grid two">
          <label>
            First Name
            <input type="text" formControlName="firstName" />
            @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
              <span class="field-error">First name is required.</span>
            }
          </label>

          <label>
            Last Name
            <input type="text" formControlName="lastName" />
            @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
              <span class="field-error">Last name is required.</span>
            }
          </label>

          <label>
            Email
            <input type="email" formControlName="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="field-error">Enter a valid email.</span>
            }
          </label>

          <label>
            Gender
            <select formControlName="gender">
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            @if (form.controls.gender.touched && form.controls.gender.invalid) {
              <span class="field-error">Gender is required.</span>
            }
          </label>

          <label>
            Designation
            <input type="text" formControlName="designation" />
            @if (form.controls.designation.touched && form.controls.designation.invalid) {
              <span class="field-error">Designation is required.</span>
            }
          </label>

          <label>
            Salary
            <input type="number" formControlName="salary" min="1" />
            @if (form.controls.salary.touched && form.controls.salary.invalid) {
              <span class="field-error">Salary must be greater than zero.</span>
            }
          </label>
          <label>
            Date of Joining
            <input type="date" formControlName="dateOfJoining" />
            @if (form.controls.dateOfJoining.touched && form.controls.dateOfJoining.invalid) {
              <span class="field-error">Date of joining is required.</span>
            }
          </label>
          <label>
            Department
            <input type="text" formControlName="department" />
            @if (form.controls.department.touched && form.controls.department.invalid) {
              <span class="field-error">Department is required.</span>
            }
          </label>

          <label>
            Position
            <input type="text" formControlName="position" />
            @if (form.controls.position.touched && form.controls.position.invalid) {
              <span class="field-error">Position is required.</span>
            }
          </label>
          <label>
            Profile Picture
            <input type="file" accept="image/*" (change)="onFileSelected($event)" />
          </label>
        </div>
        @if (preview) {
          <div class="preview-row">
            <img [src]="preview" alt="Selected profile preview" />
            <button class="ghost" type="button" (click)="clearPicture()">Remove picture</button>
          </div>
        }
        @if (error) {
          <p class="alert">{{ error }}</p>
        }
        <button type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Saving...' : 'Save Employee' }}
        </button>
      </form>
    </main>
  `,
})
export class EmployeeFormComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(GraphqlService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEdit = false;
  loading = false;
  error = '';
  preview = '';
  private employeeId = '';
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    gender: ['', [Validators.required]],
    designation: ['', [Validators.required]],
    salary: [0, [Validators.required, Validators.min(1)]],
    dateOfJoining: ['', [Validators.required]],
    department: ['', [Validators.required]],
    position: ['', [Validators.required]],
    profilePicture: [''],
  });
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = Boolean(id);
    this.employeeId = id ?? '';

    if (this.isEdit) {
      void this.loadEmployee();
    }
  }
  async loadEmployee(): Promise<void> {
    try {
      const employee = await this.api.employee(this.employeeId);
      if (!employee) {
        this.error = 'Employee not found.';
        return;
      }
      this.patchForm(employee);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unable to load employee.';
    }
  }
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const input = this.form.getRawValue() as EmployeeInput;

    try {
      if (this.isEdit) {
        await this.api.updateEmployee(this.employeeId, input);
      } else {
        await this.api.addEmployee(input);
      }
      await this.router.navigate(['/employees']);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unable to save employee.';
    } finally {
      this.loading = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      this.preview = value;
      this.form.controls.profilePicture.setValue(value);
    };
    reader.readAsDataURL(file);
  }
  clearPicture(): void {
    this.preview = '';
    this.form.controls.profilePicture.setValue('');
  }
  private patchForm(employee: Employee): void {
    this.preview = employee.profilePicture ?? '';
    this.form.patchValue({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      gender: employee.gender,
      designation: employee.designation,
      salary: employee.salary,
      dateOfJoining: employee.dateOfJoining,
      department: employee.department,
      position: employee.position,
      profilePicture: employee.profilePicture ?? '',
    });
  }
}
