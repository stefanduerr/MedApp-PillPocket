import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MoodCategoriesPage } from './mood-categories.page';

const routes: Routes = [
  {
    path: '',
    component: MoodCategoriesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoodCategoriesPageRoutingModule {}
