import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoodDiaryPage } from './moodDiary.page';

import { MoodDiaryPageRoutingModule } from './moodDiary-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: MoodDiaryPage }]),
    MoodDiaryPageRoutingModule,
  ],
  declarations: [MoodDiaryPage]
})
export class MoodDiaryPageModule {}
