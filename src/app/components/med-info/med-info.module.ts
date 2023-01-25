import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MedInfoPageRoutingModule } from './med-info-routing.module';

import { MedInfoPage } from './med-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MedInfoPageRoutingModule
  ],
  declarations: [MedInfoPage]
})
export class MedInfoPageModule {}
