import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventModalPageRoutingModule } from './event-modal-routing.module';

import { EventModalPage } from './event-modal.page';
import { NgCalendarModule } from 'ionic2-calendar';

@NgModule({
  imports: [
    NgCalendarModule,
    CommonModule,
    FormsModule,
    IonicModule,
    EventModalPageRoutingModule
  ],
  declarations: [EventModalPage]
})
export class EventModalPageModule {}
