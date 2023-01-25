import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedListPage } from './med-list.page';


import { MedListPageRoutingModule } from './med-list-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    MedListPageRoutingModule,
    
  ],
  declarations: [MedListPage]
})
export class MedListPageModule {}
