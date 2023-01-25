import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoodStatsPageRoutingModule } from './mood-stats-routing.module';

import { MoodStatsPage } from './mood-stats.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoodStatsPageRoutingModule
  ],
  declarations: [MoodStatsPage]
})
export class MoodStatsPageModule {}
