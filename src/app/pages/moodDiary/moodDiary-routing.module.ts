import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MoodDiaryPage } from './moodDiary.page';

const routes: Routes = [
  {
    path: '',
    component: MoodDiaryPage,
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MoodDiaryPageRoutingModule {}
