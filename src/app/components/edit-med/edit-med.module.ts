import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditMedPageRoutingModule } from './edit-med-routing.module';

import { EditMedPage } from './edit-med.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditMedPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [EditMedPage]
})
export class EditMedPageModule {}
