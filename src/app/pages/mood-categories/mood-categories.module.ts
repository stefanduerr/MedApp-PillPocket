import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoodCategoriesPageRoutingModule } from './mood-categories-routing.module';

import { MoodCategoriesPage } from './mood-categories.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoodCategoriesPageRoutingModule
  ],
  declarations: [MoodCategoriesPage]
})
export class MoodCategoriesPageModule {}
