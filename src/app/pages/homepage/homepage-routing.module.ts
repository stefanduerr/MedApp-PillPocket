import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';

import { HomepagePage } from './homepage.page';

const routes: Routes = [
  {
    path: '',
    component: HomepagePage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomepagePageRoutingModule {}
