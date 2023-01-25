import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MedInfoPage } from './med-info.page';

const routes: Routes = [
  {
    path: '',
    component: MedInfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MedInfoPageRoutingModule {}
