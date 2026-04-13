import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { SignupComponent } from './auth/signup.component';
import { authGuard } from './core/auth.guard';
import { EmployeeDetailsComponent } from './employees/employee-details.component';
import { EmployeeFormComponent } from './employees/employee-form.component';
import { EmployeeListComponent } from './employees/employee-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'employees', component: EmployeeListComponent, canActivate: [authGuard] },
  { path: 'employees/new', component: EmployeeFormComponent, canActivate: [authGuard] },
  { path: 'employees/:id', component: EmployeeDetailsComponent, canActivate: [authGuard] },
  { path: 'employees/:id/edit', component: EmployeeFormComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'employees' }
];
