import { Component, OnInit } from '@angular/core';

// import { LocalNotifications } from '@ionic-native/local-notifications/ngx';

import { Platform } from '@ionic/angular';
import * as moment from 'moment';
import { MedTime, TakeMeds, TodaysMeds, User } from 'src/app/models/interfaces';

import { DataService } from 'src/app/services/data.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { Subscription } from 'rxjs';
import { first, last, take } from 'rxjs/operators';
import { ObservablesService } from 'src/app/services/observables.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.page.html',
  styleUrls: ['./homepage.page.scss'],
})
export class HomepagePage implements OnInit {

  // Todays Meds of User, which must be taken today
  takeMedsToday: TakeMeds[] = [];
  // 
  todaysMeds: TodaysMeds;
  today: Date;
  user: User;
  //TODO: create Interface for medTime
  medListToday: any[] = [];
  dataChanged: boolean = false;

  platPauseSub: Subscription;
  platResumeSub: Subscription;
  allTodaysMedsSub: Subscription;
  dbIsLoadingSub: Subscription;
  isLogoutSub: Subscription;

  constructor(
    public dataService: DataService,
    private storage: LocalStorageService,
    private platform: Platform,
    private obs: ObservablesService,
    private notification: NotificationService,
  ) { }

  // TO DO !!! Unsubscribe, so that platform.pause is NOT triggered on other Pages!!
  async ngOnInit() {
    this.today = moment().toDate();
    this.medListToday = [];
  }

  ionViewDidEnter() {
    this.dataChanged = false;

    this.storage.storageIsLoading$.pipe(first(sil => !sil)).subscribe(() => {
      // get user data
      this.storage.user$.subscribe((user) => {

        if (user && user.takeMeds) {
          this.user = user;

          this.takeMedsToday = user.takeMeds.filter(t => {
            if (t.regularity && t.active) {
              return t.regularity.includes(this.today.getDay());
            }
          });

          this.subscribeToATM();
        }
      })

      this.isLogoutSub = this.obs.getIsLogout().pipe(first(iL => iL)).subscribe((logout) => {

        if(this.dataChanged){

          this.updateTodaysMeds().then(() => {

            this.dataChanged = false;
  
            this.medListToday = [];
  
            try { this.platResumeSub.unsubscribe(); } catch (e) { }
            try { this.allTodaysMedsSub.unsubscribe(); } catch (e) { }
            try { this.isLogoutSub.unsubscribe(); } catch (e) { };
  
            this.obs.setIsSavingData(false);
  
          })

        }

      })

      // subscribe to pause event of app
      this.platPauseSub = this.platform.pause.subscribe(async () => {
        try { this.allTodaysMedsSub.unsubscribe(); } catch (e) { }
        if (this.dataChanged) {
          this.updateTodaysMeds();
        }

      }, err => console.log(err));

      // subscribe to resume event of app
      this.platResumeSub = this.platform.resume.subscribe(() => {
        this.subscribeToATM();
      })

    })

  }

  async ionViewWillLeave() {

    // unsubscribe to all observables
    try { this.allTodaysMedsSub.unsubscribe(); } catch (e) { console.log(e) }
    try { this.platResumeSub.unsubscribe(); } catch (e) { console.log(e) }
    try { this.isLogoutSub.unsubscribe(); } catch (e) { console.log(e) };
    try { this.platPauseSub.unsubscribe(); } catch (e) { console.log(e) }

    if (this.dataChanged) {
      await this.updateTodaysMeds();
    }

  }

  subscribeToATM() {
    try { this.allTodaysMedsSub.unsubscribe() } catch (e) { }

    this.allTodaysMedsSub = this.storage.allTodaysMeds$.subscribe((atm) => {

      if (atm && atm.length) {
        let arrtm = atm.filter(t => {
          return t.date == moment().format("YYYY-MM-DD");
        });

        if (arrtm.length) {

          let tm: TodaysMeds = Object.assign({}, arrtm[0]);
          this.filterMeds(tm);
        }
        else {
          console.log("PUSHING NEW! NO ARRTM FOUND!: ");
          this.pushTodaysMed();
        }
      }
      else {
        this.pushTodaysMed();
      }
    });

  }

  filterMeds(tm: TodaysMeds) {

    try {
      this.takeMedsToday.forEach(takeMed => {
        // let arrexistingTm = tm.medTime.filter(mt => mt.id !== takeMed.uid);
        let tmIndex = tm.medTime.map((m) => m.id).indexOf(takeMed.uid);
        if (tmIndex >= 0) {
          let existingTm = tm.medTime[tmIndex];
          existingTm.name = takeMed.name;
          existingTm.unit = takeMed.unit;

          takeMed.medsOClock.forEach(moc => {
            //existingTm.medsOClock.filter(m => m.id == moc.id);
            let etmIndex = existingTm.medsOClock.map((m) => m.id).indexOf(moc.id);
            if (etmIndex >= 0) {
              let existingMoctm = existingTm.medsOClock[etmIndex];
              existingMoctm.time = moc.time;
              existingMoctm.amount = moc.amount;
              // existingMoctm.taken = moc.taken
              existingTm.medsOClock[etmIndex] = existingMoctm;
            }
            else {
              existingTm.medsOClock.push(moc);
            }
          });
          tm.medTime[tmIndex] = existingTm;
        }
        else {
          let medTime: MedTime = {
            id: takeMed.uid,
            name: takeMed.name,
            unit: takeMed.unit,
            medsOClock: takeMed.medsOClock,
          };
          tm.medTime.push(medTime);
        }
      })
      
      this.showTodaysMeds(tm)
    }
    catch (e) {
      console.log("ERROR BEIM LADEN!")
      console.log(e);
    }
  }

  registerChanges() {
    this.dataChanged = true;
  }

  pushTodaysMed() {

    let medTime: MedTime[] = [];
    this.takeMedsToday.forEach(takeMed => {
      let med: MedTime = {
        name: takeMed.name,
        id: takeMed.uid,
        unit: takeMed.unit,
        medsOClock: takeMed.medsOClock
      };
      medTime.push(med);
    });

    let todaysMed: TodaysMeds = {
      userid: this.user.id,
      date: moment().format("YYYY-MM-DD"),
      medTime: medTime
    };

    this.showTodaysMeds(todaysMed);
  }

  showTodaysMeds(todaysMed: TodaysMeds) {

    this.todaysMeds = todaysMed;

    const medListTodayNew = [];

    todaysMed.medTime.forEach(mt => {
      mt.medsOClock.forEach(moc => {
        const med = {
          unit: mt.unit,
          name: mt.name,
          id: mt.id,
          mocid: moc.id,
          amount: moc.amount,
          time: moment(moc.time).format("HH:mm"),
          taken: moc.taken
        }
        medListTodayNew.push(med)
      });
    });
    medListTodayNew.sort((a, b) => {
      if (a.time < b.time) return -1;
      if (a.time > b.time) return 1;
      return 0;
    });
    this.medListToday = medListTodayNew;
  }

  updateTodaysMeds() {
    this.dataChanged = false;

    this.medListToday.forEach(ml => {
      this.todaysMeds.medTime.forEach(m => {
        if (m.id == ml.id) {
          const mocIndex = m.medsOClock.findIndex(moc => moc.id == ml.mocid);
          m.medsOClock[mocIndex].taken = ml.taken;
        }
      });
    });

    return this.storage.saveTodaysMeds(this.todaysMeds);
  }

  async testNotif() {
    this.notification.testNot();
  }

}
