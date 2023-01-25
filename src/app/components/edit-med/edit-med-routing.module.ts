import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditMedPage } from './edit-med.page';

const routes: Routes = [
  {
    path: '',
    component: EditMedPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditMedPageRoutingModule {}
