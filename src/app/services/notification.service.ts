import { Injectable } from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';

import { isPlatform, Platform } from '@ionic/angular';
import * as moment from 'moment';
import { MedsOClock, MedTime, TakeMeds, TodaysMeds, User } from '../models/interfaces';
import { LocalStorageService } from './local-storage.service';
import { LocalNotifications, Channel, Action, ActionPerformed, Weekday, CancelOptions, LocalNotificationDescriptor, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  user: User;

  channel: Channel = {
    id: "general",
    name: "General",
    importance: 4,
    sound: "oida.wav",
    lights: true,
    lightColor: "#FFFFFF",
    vibration: true,
    visibility: 1,
  };

  newChannel = null;
  storageIsLoading: Subscription;

  constructor(private storage: LocalStorageService, private platform: Platform, private router: Router) {

    this.platform.ready().then(async () => {

      this.storage.user$.pipe(first((u:User) => u != null && u != undefined)).subscribe((user: User) => {
        this.user = user;

        this.clearAllMedNotif().then(() => { this.initNotifications(); })
      });

      if (isPlatform("android")) {

        this.newChannel = await LocalNotifications.createChannel(this.channel);

        const listedChannels = await LocalNotifications.listChannels();
      }

      if (isPlatform("ios") || isPlatform("android")) {
        // Register Action Types
        LocalNotifications.registerActionTypes({
          types: [
            {
              id: "med-notifs",
              actions: [
                {
                  id: "1std",
                  title: "In 1 Std",
                  foreground: true,
                  // destructive: true,
                },
                {
                  id: "10min",
                  title: "In 10 Min",
                  foreground: true,
                  // destructive: true,
                },
                {
                  id: "eingenommen",
                  title: "Eingenommen",
                  foreground: true,
                  // destructive: true,
                }
              ]
            }
          ]
        }).catch(err => console.log(err))
      }
    });
  }

  async newCapNotif(med: TakeMeds) {

    // for each MOC time create notification
    med.medsOClock.forEach((moc) => {

      const regularity = med.regularity;

      const notifText = 'Du solltest jetzt ' + moc.amount + ' ' + med.unit + ' ' + med.name + ' einnehmen';

      // Full Date from db
      const time = moment(moc.time);

      // for each chosen regularity
      regularity.forEach(async (reg) => {

        const notification = await LocalNotifications.schedule({
          notifications: [
            {
              title: "Medikamenten-Einnahme",
              body: notifText,
              id: Number(moc.id + "" + reg),
              largeIcon: "res://ic_action_pillpocket_action",
              ongoing: true,
              inboxList: [notifText, 'Später erinnern?'],
              extra: {
                tmId: med.uid,
                moc: moc
              },
              schedule: {
                on: { weekday: reg + 1, hour: time.hour(), minute: time.minute(), second: 0 },
                repeats: true,
                // allowWhileIdle: true,
              },
              actionTypeId: "med-notifs",
              channelId: this.newChannel ? this.newChannel.id : null,
            }
          ]
        })
      })
    })
  }

  addListener() {
    LocalNotifications.addListener("localNotificationActionPerformed", async (actionPerformed: ActionPerformed) => {

      const notif = actionPerformed.notification;
      let moc: MedsOClock = null;
      let tmId: string = null;
      try {
        moc = notif.extra.moc;
        tmId = notif.extra.tmId;
      } catch (e) {
        console.log("NOTIF DECLARATION ERROR")
        console.log(e)
      }

      const now = moment();
      let trigger = now;

      switch (actionPerformed.actionId) {
        case "eingenommen":
          try {
            this.storageIsLoading = this.storage.storageIsLoading$.subscribe(async (isLoading) => {
              if (!isLoading) {
                console.log("DOING EINGENOMMEN CODE!");
                try { this.storageIsLoading.unsubscribe(); } catch (e) { };
                this.storage.saveCheckedMedOClock(moc, tmId).then(() => {
                  console.log("DONE UPDATING EINGENOMMEN");
                  this.router.navigateByUrl('/tabs');
                });
              }
            })

          } catch (e) {
            console.log("ERROR BEI EINGENOMMEN");
            console.log(JSON.stringify(e));
          }
          break;
        case "1std":
          trigger.hour(now.hour() + 1);

          this.snoozeSchedule("Medikamenten-Einnahme", notif, trigger);
          break;
        case "10min":
          trigger.minute(now.minute() + 10);

          this.snoozeSchedule("Medikamenten-Einnahme", notif, trigger);
          break;
      }
    })

    LocalNotifications.addListener("localNotificationReceived", async (notification: LocalNotificationSchema) => {
      // await Haptics.notification({type: NotificationType.Warning});
      console.log("RECEIVED !!!")
      await Haptics.vibrate({duration: 2000});
    })
  }

  async snoozeSchedule(title, data, trigger) {

    const notification = await LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: data.body,
          id: data.id,
          largeIcon: data.largeIcon,
          extra: data.extra,
          inboxList: [data.body, 'Später erinnern?'],
          ongoing: true,
          schedule: {
            at: trigger.toDate(),
            // allowWhileIdle: true,
          },
          actionTypeId: "med-notifs",
          channelId: this.newChannel ? this.newChannel.id : null,
        }
      ]
    })
  }

  async testNot() {

    const notification = await LocalNotifications.schedule({
      notifications: [
        {
          title: "Medikamenten-Einnahme",
          body: "test",
          id: 1,
          largeIcon: "res://ic_action_pillpocket_action",
          schedule: {
            on: { weekday: moment().day() + 1, hour: moment().hour(), minute: moment().minute(), second: moment().second() + 4 },
            // every: 'day',
            repeats: true,
            // allowWhileIdle: true,
          },
          actionTypeId: "med-notifs",
          channelId: this.newChannel ? this.newChannel.id : null,
        }
      ]
    })
  }

  async clearMedNotif(id: number | string, reg: number[]) {

    const notifArr = []

    reg.forEach((r) => notifArr.push({ id: Number(id + "" + r) }))

    const options: CancelOptions = {
      notifications: notifArr
    }

    try {
      await LocalNotifications.cancel(options);
    } catch (e) {
      console.log("ERROR IN CANCELOPTIONS");
      console.log(e)
    }
  }

  async clearAllMedNotif(){
    return LocalNotifications.getPending().then((pendingNotif) => {

      if(pendingNotif.notifications && pendingNotif.notifications.length){
        const notifArr = []

        pendingNotif.notifications.forEach((notif) => {
          notifArr.push({ id: Number(notif.id) })
        })

        const options: CancelOptions = {
          notifications: notifArr
        }

        LocalNotifications.cancel(options)
      }

    })
  }

  ionViewDidLeave() {
    try { this.storageIsLoading.unsubscribe(); }
    catch (e) { }
  }

  initNotifications() {
    // console.log("INIT NOTIFICATIONS");
    let count = 0;

    if (this.user) {
      this.user.takeMeds.forEach((med) => {

        // for each MOC time create notification
        med.medsOClock.forEach((moc) => {

          const regularity = med.regularity;

          const notifText = 'Du solltest jetzt ' + moc.amount + ' ' + med.unit + ' ' + med.name + ' einnehmen';

          // Full Date from db
          const time = moment(moc.time);

          // for each chosen regularity
          regularity.forEach(async (reg) => {
            count++;

            const notification = await LocalNotifications.schedule({
              notifications: [
                {
                  title: "Medikamenten-Einnahme",
                  body: notifText,
                  id: Number(moc.id + "" + reg),
                  largeIcon: "res://ic_action_pillpocket_action",
                  extra: {
                    tmId: med.uid,
                    moc: moc
                  },
                  schedule: {
                    on: { weekday: reg + 1, hour: time.hour(), minute: time.minute(), second: 0 },
                    repeats: true,
                    // allowWhileIdle: true,
                  },
                  actionTypeId: "med-notifs",
                  channelId: this.newChannel ? this.newChannel.id : null,
                }
              ]
            })
          })

        })

      })
      // console.log("!! COUNT: !!")
      // console.log(count);
    }
  }

}
