import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginButtonComponent } from './login-button.component';

const routes: Routes = [
  {
    path: '',
    component: LoginButtonComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginButtonRoutingModule {}
