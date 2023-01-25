import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MedListPage } from './med-list.page';

const routes: Routes = [
  {
    path: '',
    component: MedListPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MedListPageRoutingModule {}
