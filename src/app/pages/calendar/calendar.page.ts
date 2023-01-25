import { Component, OnInit, ViewChild } from '@angular/core';

import { ModalController } from '@ionic/angular';

//Calendar Components, look at https://github.com/twinssbc/Ionic2-Calendar for documentation
import { CalendarComponent } from 'ionic2-calendar';
import { formatDate } from '@angular/common';

import { NavParams } from '@ionic/angular';
import { EventModalPage } from '../../components/event-modal/event-modal.page';
import { CalendarMode, IEvent } from 'ionic2-calendar/calendar';
import { DataService } from '../../services/data.service';
import { EventService } from 'src/app/services/event.service';
import { MoodService } from 'src/app/services/mood.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import { Event } from 'src/app/models/interfaces';

// register DE Calendar
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { NotificationService } from 'src/app/services/notification.service';
registerLocaleData(localeDe);

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  eventSource: IEvent[] = [];
  moodSource: IEvent[] = [];
  calendarSource: IEvent[] = [];
  result: any;
  showMood: Boolean = false;
  sourceButton: string = "Moods zeigen";

  //the dates shown in the calendar, f.e. 'November' for month view
  displayedDateRange: string;

  calendar = {
    mode: 'month' as CalendarMode,
    currentDate: new Date(),
    startHour: 0,
    endHour: 24,
    step: 30,
    locale: "de-DE",
    startingDayWeek: 1,
    startingDayMonth: 1
  };
  allMoods: Object;

  selectedDate: Date;

  @ViewChild(CalendarComponent) myCal: CalendarComponent;

  constructor(
    private modalCtrl: ModalController,
    public eventService: EventService,
    private moodService: MoodService,
    private data: DataService,
    private storage: LocalStorageService,
    private notification: NotificationService,
  ) { }

  ngOnInit() {
    //get all Moods from mood.json
    this.moodService.loadjson().subscribe(res => {
      this.allMoods = res;

      this.storage.moods$.subscribe((result: any) => {
        if (!result) result = [];
        this.result = result;

        let moods = [];
        //quick 'n dirty B)
        if (result.length > 0) {
          this.result.forEach(element => {
            try {
              let m = {
              type: "mood",
              allDay: true,
              startTime: new Date(element.date),
              endTime: moment(element.date).toDate(),
              title: element.title + ": " + this.allMoods[element.category].btns[element.selectedVal].title
              }
              moods.push(m);
            }
            catch (e) {
              console.log(e);
            }
          });
        }
        this.moodSource = moods;
      })
    });

    this.storage.events$.subscribe((result: any) => {
      if (!result) result = [];
      this.result = result;
      this.eventSource = [];

      //quick 'n dirty B)
      if (result.length != 0) {
        result.forEach((element: Event) => {
          let event = {
            id: element.id,
            title: element.title,
            desc: element.desc,
            startTime: new Date(element.startTime),
            endTime: new Date(element.endTime),
            allDay: false
          };

          event = this.convertEventToIso(event);

          // event.type = "event";
          this.eventSource.push(event)
        });
        
      }
      this.calendarSource = this.eventSource;
    })
  }

  // Change current month/week/day
  next() {
    this.myCal.slideNext();
  }

  back() {
    this.myCal.slidePrev();
  }

  changeEventSource() {
    if (this.showMood) {
      this.showMood = false;
      this.sourceButton = "Moods zeigen"
      this.calendarSource = this.eventSource;
    } else {
      this.showMood = true;
      this.sourceButton = "Events zeigen"
      this.calendarSource = this.moodSource;
    }
  }

  convertEventToIso(event){
    event.startTime = new Date(
      Date.UTC(
        event.startTime.getUTCFullYear(),
        event.startTime.getUTCMonth(),
        event.startTime.getUTCDate(),
        event.startTime.getUTCHours(),
        event.startTime.getUTCMinutes()
      )
    );

    event.endTime = new Date(
      Date.UTC(
        event.endTime.getUTCFullYear(),
        event.endTime.getUTCMonth(),
        event.endTime.getUTCDate(),
        event.endTime.getUTCHours(),
        event.endTime.getUTCMinutes()
      )
    );

    return event;
  }

  // Selected date range and hence title changed
  onDisplayedDateRangeChanged(dateRange) {
    this.displayedDateRange = dateRange;
  }
  onTimeSelected(time) {
    this.selectedDate = new Date(time.selectedTime);
  }
  formatDate(date){
    return moment(date).format("HH:mm");
  }

  async onEditEvent(event){
    const datePass = new Date(this.selectedDate);
    const eventModal = await this.modalCtrl.create({
      component: EventModalPage,
      //Variables passed to Modal:
      componentProps: { date: datePass, storage: this.storage, event: event }
    });
    eventModal.present();

    eventModal.onDidDismiss().then(async(result) => {
      try {
        if (result.data && result.data.event) {
          let event = result.data.event;

          // this.notification.newCapNotif(event);
          await this.storage.saveEvent(event);
          //this.myCal.loadEvents();
        }
      } catch (e) {
        console.log("oops - error");
      }
    });
  }

  async onCreateEvent() {
    const datePass = new Date(this.selectedDate);
    const eventModal = await this.modalCtrl.create({
      component: EventModalPage,
      //Variables passed to Modal:
      componentProps: { date: datePass, storage: this.storage }
    });
    eventModal.present();

    eventModal.onDidDismiss().then(async(result) => {
      try {
        if (result.data && result.data.event) {
          let event = result.data.event;

          event.id = uuidv4();

          // this.notification.newCapNotif(event);
          await this.storage.saveEvent(event);
          //this.myCal.loadEvents();
        }
      } catch (e) {
        console.log("oops - error");
      }
    })
  }

  async deleteEvent(event, $event){
    // stop parent action
    $event.stopPropagation();

    // delete Event
    this.storage.deleteEvent(event);
  }
}