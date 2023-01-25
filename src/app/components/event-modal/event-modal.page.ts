import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { Event, User } from 'src/app/models/interfaces';
import { CalendarPage } from '../../pages/calendar/calendar.page';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';

@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.page.html',
  styleUrls: ['./event-modal.page.scss'],
})
export class EventModalPage implements OnInit {
  date: Date;
  today: Date;
  storage: LocalStorageService;
  modalCtrl2: ModalController;
  user: User;
  event: any;
  emptyTitle: boolean;
  noTitle: String;

  constructor(private modalCtrl: ModalController, private navParams: NavParams) { }

  ngOnInit() {
    this.date = this.navParams.get('date');

    this.today = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), new Date().getHours(), new Date().getMinutes());

    let startIso = moment(this.today).format();
    let endIso = startIso;

    this.storage = this.navParams.get("storage");
    this.user = this.storage.user$.value;

    // if editing Event:
    const paramEvent = this.navParams.get("event");

    if(paramEvent){
      this.event = paramEvent;
      paramEvent.startTime = moment(paramEvent.startTime).format();
      paramEvent.endTime = moment(paramEvent.endTime).format();
    } else {
      this.event = {
        userid: this.user.id,
        title: '',
        desc: '',
        startTime: startIso,
        endTime: endIso,
        allDay: false
      };      
    }
  }

  updateStartTime(time) {
    this.event.startTime = moment(time).format();
  }

  updateEndTime(time) {
    this.event.endTime = moment(time).format();
  }

  close() {
    this.modalCtrl.dismiss();
  }

  save() {
    // this.event.startTime = new Date(this.event.startTime);
    // this.event.endTime = new Date(this.event.endTime);
    if (this.event.title == "") {
    this.emptyTitle = true;
    this.noTitle = "Bitte wähle einen Titel aus!";

    } else {
    this.emptyTitle = false;
    this.noTitle = "";
    }

    if (!this.emptyTitle) {
      this.modalCtrl.dismiss({ event: this.event });
    }
  }
}
