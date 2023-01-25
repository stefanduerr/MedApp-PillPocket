import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MoodStatsPage } from './mood-stats.page';

const routes: Routes = [
  {
    path: '',
    component: MoodStatsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoodStatsPageRoutingModule {}
