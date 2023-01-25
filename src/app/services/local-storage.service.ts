import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { AuthService } from '@auth0/auth0-angular';
import { Network } from '@capacitor/network';
import { Mood, User, Event, TakeMeds, TodaysMeds, MedTime, MedsOClock } from '../models/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { BehaviorSubject } from 'rxjs';
import { DataService } from './data.service';
import { MoodService } from './mood.service';
import { EventService } from './event.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { AlertController, isPlatform, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  // local variables currently UNUSED!
  authUserData = null;
  localUserData = null;

  /*changes done to one of the following 
    categories will be documented here*/
  offlineChanges = {
    user: false,
    moods: false,
    events: false,
    todaysMeds: false,
    allTodaysMeds: false
  }

  deprecated = false;

  // creates observables
  // example for reading / writing into observable:
  // this.user$.next(data) ==> saves new data into user
  // this.user$.value      ==> reads data from user
  user$ = new BehaviorSubject<User | null>(null)
  moods$ = new BehaviorSubject<Mood[] | null>([]);
  events$ = new BehaviorSubject<Event[] | null>([]);
  allTodaysMeds$ = new BehaviorSubject<TodaysMeds[] | null>([]);
  dbIsLoading$ = new BehaviorSubject<boolean | null>(false);
  storageIsLoading$ = new BehaviorSubject<boolean | null>(true);
  isOnline = false;

  // saving locally the status of authentication
  isAuthenticated = false;

  // network status before
  wasOnlineBefore = false;

  constructor(
    private storage: Storage,
    private auth: AuthService,
    private data: DataService,
    private moodService: MoodService,
    private eventService: EventService,
    private platform: Platform,
    private alertController: AlertController,
  ) {
    this.storageIsLoading$.next(true);
    // initialize storage module
    this.initStorage();

    // get authentication from Auth0
    this.auth.isAuthenticated$.subscribe((isAuth) => this.isAuthenticated = isAuth);

    // get userData from Auth0
    this.auth.user$.subscribe((authUserInfo) => {

      this.authUserData = authUserInfo;
    })

    this.platform.ready().then(() => {

      if (navigator.onLine) {
        this.wasOnlineBefore = !this.wasOnlineBefore;
      }

      // subscribe to network-module -> check if online/offline
      Network.addListener('networkStatusChange', async status => {
        this.isOnline = status.connected;

        console.log("NETWORK STATUS CHANGED!")

        if (this.isAuthenticated) {

          const user = this.user$.value;

          if (user) {

            if (this.isOnline) {

              console.log("IS NOW ONLINE")
              // if network status changed from offline to online => check if offline changes happened
              // if so, upload to database
              // if not, download new data from database
              if (!this.wasOnlineBefore) {

                console.log("IS NOW ONLINE AND WAS OFFLINE BEFORE !")

                if (isPlatform("ios") || isPlatform("android")) {

                  //get local version
                  App.getInfo().then((info) => {
                    this.data.versionControll(info.version).subscribe((result: any) => {
                      if (result == "deprecated") {
                        this.deprecated = true;
                        this.showVersionAlert();
                      }
                    }, err => { });
                  }).catch((err) => { })
                }

                const keys = this.getOfflineChanges()
                console.log("OFFLINE CHANGES: ")
                console.log(JSON.stringify(keys));

                if (keys) {
                  keys.forEach(k => {
                    switch (k) {
                      case "user":
                        // TO DO !!
                        // call http request to AZ-Function to save localchanges to DB
                        console.log("UPDATING USER");
                        this.data.updateUser(this.user$.value).subscribe();
                        break;
                      case "moods":
                        // TO DO !!
                        // call http request to AZ-Function to save localchanges to DB
                        console.log("UPDATING MOODS");
                        this.moodService.saveMood(this.moods$.value, this.user$.value.id).subscribe();
                        break;
                      case "events":
                        // TO DO !!
                        // call http request to AZ-Function to save localchanges to DB
                        console.log("UPDATING EVENTs");
                        this.eventService.saveEvent(this.events$.value, this.user$.value.id).subscribe();
                        break;
                      case "allTodaysMeds":
                        // TO DO !!
                        // call http request to AZ-Function to save localchanges to DB
                        console.log("UPDATING allTodaysMeds");
                        this.data.saveTodaysMeds(this.allTodaysMeds$.value).subscribe();
                        break;
                    }
                  });

                  // clear offline changes 
                  this.clearOfflineChanges();
                }
                else {
                  // fires if no offline changes happened
                  this.loadAllFromDatabase();
                }
              }
            }
            else {
              this.isOnline = false;
              this.wasOnlineBefore = this.isOnline;
            }

          }

        }

      })
    })


    // inits data from Database! (user, moods & events)
    this.initData();
  }


  // if app version is depricated => show alert
  async showVersionAlert() {
    let message = this.deprecated ? "Deine Version ist veraltet, bitte lade dir die neueste Version herunter um PillPocket weiter nutzen zu können." : "Es ist eine neuere Version verfügbar, bitte lade sie dir aus dem Appstore herunter"
    const alert = await this.alertController.create({
      header: 'Veraltete Version',
      message: message,
      backdropDismiss: false,
      buttons: [
        {
          text: "Okay",
          handler: () => {
            if (this.deprecated && !isPlatform("ios")) {
              App.exitApp();
            }
          }
        }
      ]
    });

    await alert.present();
    // await alert.onDidDismiss().then(() => {
    //   App.exitApp();
    // });
  }

  // initialize Storage
  async initStorage() {
    await this.storage.create();
  }

  // load user, moods and events from database
  async loadAllFromDatabase() {

    // const currUser

    this.auth.user$.pipe(first(u => u != null)).subscribe((user) => {

      console.log("LOADED USER: ");
      console.log(user);

      if (user) {
        const userid = this.authUserData.sub;
        console.log("USERID: " + userid);
        this.dbIsLoading$.next(true);

        this.data.loadUser(userid).subscribe((user: User) => {
          if (user) {
            // this.registerUser(user.id, user.name, user.email);
            this.storage.set("user", JSON.stringify(user)).then((res) => {
              this.user$.next(user)

              this.data.loadTodaysMeds(moment().format("YYYY-MM-DD"), userid).subscribe((todaysMed) => {
                if (todaysMed) {
                  const editedTM: TodaysMeds = {
                    date: todaysMed.id,
                    userid: todaysMed.userid,
                    medTime: todaysMed.medTime
                  }
                  const todaysMeds: TodaysMeds[] = [editedTM];

                  this.storage.set("allTodaysMeds", JSON.stringify(todaysMeds)).then((atm) => {
                    this.allTodaysMeds$.next(todaysMeds);
                    this.dbIsLoading$.next(false);
                    return 'DONE!!!!';
                  });
                }
              })

              this.moodService.loadLast5Moods(userid).subscribe((moods: Mood[]) => {
                if (moods) {
                  this.storage.set("moods", JSON.stringify(moods)).then((res) => this.moods$.next(moods))
                }
              })

              this.eventService.getUserEvents(userid).subscribe((events: Event[]) => {
                console.log(events);
                if (events) {
                  this.storage.set("events", JSON.stringify(events)).then((evt) => this.events$.next(events));
                }
              })
            });


          }
        })
      }
    })
  }

  deleteMood(moodId) {

    const moods = this.moods$.value ? this.moods$.value : [];

    if (moods.length) {
      const i = moods.findIndex((mood) => mood.id == moodId);
      moods.splice(i, 1);
    }

    if (this.isAuthenticated) {
      if (this.isOnline) {
        this.moodService.deleteMood(moodId).subscribe((res) => {
        }, err => {
          this.offlineChanges.moods = true;
        });
      }
      else {
        this.offlineChanges.moods = true;
      }
    }

    this.storage.set("moods", JSON.stringify(moods)).then(() => {
      this.moods$.next(moods);
    })
  }

  // initialize data for user, moods & events
  async initData() {
    let userResult = await this.storage.get("user");

    if (!userResult && this.isAuthenticated) {
      this.loadAllFromDatabase();
    } else if (!userResult && !this.isAuthenticated) {
      userResult = await this.registerGuest();
      this.user$.next(userResult);
    }

    this.user$.next(JSON.parse(userResult));
    this.moods$.next(JSON.parse(await this.storage.get("moods")));
    this.events$.next(JSON.parse(await this.storage.get("events")));
    this.allTodaysMeds$.next(JSON.parse(await this.storage.get("allTodaysMeds")));

    // create TodaysMeds if AllTodaysMeds is empty
    const allTodaysMeds = this.allTodaysMeds$.value;
    if (
      !allTodaysMeds ||
      !allTodaysMeds.length ||
      allTodaysMeds.findIndex(atm => atm.date === moment().format('YYYY-MM-DD')) < 0
    ) {
      if (this.user$.value && this.user$.value.takeMeds) {
        const userTakeMeds = this.user$.value.takeMeds

        await this.createTodaysMeds(userTakeMeds);
      }
    }

    const offlineChanges = JSON.parse(await this.storage.get("offlineChanges"));
    if (offlineChanges) {
      this.offlineChanges = offlineChanges;
    }

    // TO DO !!!
    // ping to Azure Function
    //let httpResponse = await this.getPingToAZ();
    let httpResponse = true;

    // set internet connection status
    httpResponse ? this.isOnline = true : this.isOnline = false;

    // if online & authenticated => load from DB or update DB with changes in localstorage
    if (this.isOnline && this.isAuthenticated) {
      const keys = this.getOfflineChanges();
      keys ? this.updateOfflineChanges(keys) : await this.loadAllFromDatabase();
    }

    // register storage has stopped loading data
    this.storageIsLoading$.next(false);

    // -----------------------------------
    // ------------ WARNING ! ------------
    // - REMOVE THIS CALL AFTER TESTING! -
    // -----------------------------------
    // try {
    //   if (this.user$.value.takeMeds.length <= 0) {
    //     await this.saveMedicine(this.testMeds)
    //   }
    // } catch (e) { }
  }

  createTodaysMeds(userTakeMeds: TakeMeds[]) {

    let medTime: MedTime[] = [];
    userTakeMeds.forEach(takeMed => {
      let med: MedTime = {
        name: takeMed.name,
        id: takeMed.uid,
        unit: takeMed.unit,
        medsOClock: takeMed.medsOClock
      };
      medTime.push(med);
    });

    let todaysMed: TodaysMeds = {
      userid: this.user$.value.id,
      date: moment().format("YYYY-MM-DD"),
      medTime: medTime
    };

    return this.saveTodaysMeds(todaysMed);
  }

  // register Guest User if not authenticated
  async registerGuest() {
    const id = uuidv4();

    this.user$.next({
      id: id,
      name: null,
      email: null,
      age: null,
      takeMeds: [],
    } as User)

    return this.storage.set("user", JSON.stringify(this.user$.value))
  }

  async guestToUser() {

    console.log("GUEST TO USER STARTED!");
    const user: User = JSON.parse(await this.storage.get("user"));
    user.id = this.authUserData.sub;

    const events: Event[] | null = JSON.parse(await this.storage.get("events"));
    const moods: Mood[] | null = JSON.parse(await this.storage.get("moods"));
    const allTodaysMeds: TodaysMeds[] | null = JSON.parse(await this.storage.get("allTodaysMeds"));
    // TO DO !!!
    // write loadTMeds function!!
    // const todaysMeds: TakeMeds[] = JSON.parse(await this.loadTMeds());

    if (events) {
      events.forEach((e: Event) => {
        e.userid = user.id;
      })
      // ---------------------------------- //
      // ---- call to DB to save Events --- //
      // ---------------------------------- //
      this.eventService.saveEvent(events, user.id).subscribe((res) => console.log())
    }

    console.log("MOODS:")
    console.log(JSON.stringify(moods))

    if (moods) {
      moods.forEach((m: Mood) => {
        m.userid = user.id;
      })
      // ---------------------------------- //
      // ---- call to DB to save Moods ---- //
      // ---------------------------------- //
      this.moodService.saveMood(moods, user.id).subscribe((res) => console.log())
    }

    if (allTodaysMeds) {
      allTodaysMeds.forEach((m) => {
        m.userid = user.id;
      })
      // ---------------------------------- //
      // ---- call to DB to save Moods ---- //
      // ---------------------------------- //
      this.data.saveTodaysMeds(allTodaysMeds).subscribe((res) => console.log())
    }

    this.user$.next(user);
    this.moods$.next(moods);
    this.events$.next(events);
    this.allTodaysMeds$.next(allTodaysMeds);

    const regUser = {
      id: user.id,
      name: this.authUserData.name,
      email: this.authUserData.email,
      age: null,
      takeMeds: user.takeMeds
    } as User

    // ---------------------------------- //
    // ----- call to DB to save User ---- //
    // ---------------------------------- //
    this.data.updateUser(regUser).subscribe((done) => console.log("REGISTERING USER: " + done))
    await this.updateUser(regUser);

    // TO DO !!!
    // ---------------------------------- //
    // - call to DB to save todaysMeds -- //
    // ---------------------------------- //
    // this.eventService.saveTMeds(todaysMeds).subscribe((res) => console.log())

    this.clearOfflineChanges();
  }

  async registerUser(id: string, name: string, email: string, age?: number) {
    this.user$.next({
      id: id.toString(),
      name: name,
      email: email,
      age: age ? age : null,
      takeMeds: [],
    } as User)

    // TO DO !!!
    // check if call to DB works!
    // this.data.createUser(this.user$.value).subscribe((res) => console.log("creating user on DB works!"))

    return this.storage.set("user", JSON.stringify(this.user$.value))
  }

  async updateUser(user: User) {
    this.user$.next(user);

    if (this.isAuthenticated) {
      if (this.isOnline) {
        // ----------------------------
        // ----- CALL TO DATABASE -----
        // ------ SET dbIsLoading -----
        // ----------------------------
        this.data.updateUser(user).subscribe(
          (res) => console.log(res),
          (err) => {
            console.log(err);
            this.offlineChanges.user = true;
          }
        );
      }
      else {
        // --------------------------------
        // ------------- TO DO ------------
        // --- REGISTER OFFLINE CHANGES ---
        // --------------------------------
        this.offlineChanges.user = true;
        // this.registerOfflineChanges({ user: true })
      }
    }

    return this.storage.set("user", JSON.stringify(user));
  }

  // loads specific mood
  async loadMood(category, date) {
    try {
      const moods = JSON.parse(await this.storage.get("moods"));
      let mood: Mood | null = null;

      if (moods) {
        mood = moods.filter(m => {
          const mDate = new Date(m.date).toISOString().split('T')[0];
          const inpDate = new Date(date).toISOString().split('T')[0];
          return mDate == inpDate && m.category == category;
        });
        return mood[0];
      }
      return null;

    } catch (e) {
      console.log("Could not load Mood from Storage!!!")
      console.log(e);
    }
  }

  // load all moods for this user
  async loadAllMoods() {
    try {

      // ----------------
      // ----- TO DO ----
      // CALL TO DATABASE
      // ----------------
      // if(this.isAuthenticated && this.isOnline){
      //   const lastMonth = moment().add(-1, 'years').format('YYYY-MM-DD');
      //   this.moodService.loadRangeMoods(lastMonth, this.user$.value.id).subscribe((res) => {
      //     console.log("RESULT FROM DATABASE LOADMOOD:")
      //     console.log(res);
      //     return res;
      //   });
      // }
      return JSON.parse(await this.storage.get("moods"));

    } catch (e) {
      console.log("Could not load ALL Moods from Storage!!!")
      return [];
    }
  }

  // init new Mood Interface and save Mood locally + on DB
  async saveMood(mood: Mood | Mood[]) {
    const localUser = JSON.parse(await this.storage.get("user"));
    let userid = null;
    try {
      userid = this.authUserData.sub;
    } catch (e) {
      userid = localUser.id;
    }

    if (!Array.isArray(mood)) mood = [mood]

    const moods = this.moods$.value ? this.moods$.value : [];

    mood.forEach(mood => {
      let moodIndex = 0;

      if (moods.length > 0) {
        moodIndex = moods.findIndex(m => {
          const mDate = moment(m.date).format('YYYY-MM-DD');
          const moodDate = moment(mood.date).format('YYYY-MM-DD');
          return mDate == moodDate && m.id == mood.id;
        });
      }

      // if mood found => replace
      if (moodIndex >= 0) {
        moods[moodIndex] = mood
      } else {
        moods.push(mood);
      }
    })

    if (this.isAuthenticated) {
      if (this.isOnline) {
        // ----------------------------
        // ----- CALL TO DATABASE -----
        // ------ SET dbIsLoading -----
        // ----------------------------
        this.moodService.saveMood(mood, userid.toString()).subscribe((res) => {
          console.log("SAVING MOOD TO DB:");
          console.log(res);
        }, err => {

          this.offlineChanges.moods = true;
        });
      }
      else {
        // --------------------------------
        // ------------- TO DO ------------
        // --- REGISTER OFFLINE CHANGES ---
        // --------------------------------
        this.offlineChanges.moods = true;
        // this.registerOfflineChanges({ moods: true })
      }
    }

    this.storage.set("moods", JSON.stringify(moods)).then(() => {
      this.moods$.next(moods);
      return moods;
    })
  }

  // save OR update Medicine 
  async saveMedicine(medicine: TakeMeds | TakeMeds[]) {
    try {
      const user = this.user$.value;

      if (!Array.isArray(medicine)) medicine = [medicine];

      medicine.forEach(med => {

        // const newTakeMeds = this.pushOrReplace(user.takeMeds, ["name"], medicine)
        const medIndex = user.takeMeds.findIndex(el => el.uid ? el.uid == med.uid : el.name == med.name);

        if (medIndex >= 0) {
          user.takeMeds[medIndex] = med
        } else {
          user.takeMeds.push(med);
        }
      });

      if (this.isAuthenticated) {
        if (this.isOnline) {
          console.log("FALSCHERWEISE ONLINE");
          // ----------------------------
          // ----- CALL TO DATABASE -----
          // ------ SET dbIsLoading -----
          // ----------------------------
          this.data.updateUser(user).subscribe((res) => { }, (err) => {
            if (err) {
              this.offlineChanges.user = true;
              // this.registerOfflineChanges({ user: true });
            }
          })
        }
        else {
          console.log("UPDATING OFFLINE CHANGES USER");
          // --------------------------------
          // --- REGISTER OFFLINE CHANGES ---
          // --------------------------------
          this.offlineChanges.user = true;
          // this.registerOfflineChanges({ user: true });
        }
      }

      this.user$.next(user);


      return this.storage.set("user", JSON.stringify(user))
    } catch (e) {
      console.log("could not save medicine!");
    }
  }

  async loadEvent(date: Date) {
    try {
      if (this.events$.value) {
        const today = date.getDate();

        const eToday = this.events$.value.filter((e: Event) => new Date(e.startTime).getDate() === today)

        return eToday;
      }
    } catch (e) {
      console.log("could not load events!");
    }
  }

  async saveEvent(event: Event[] | Event) {
    try {
      // event.userid = this.authUserData.sub.toString();
      const events = this.events$.value;

      if (!Array.isArray(event)) event = [event]

      if (events) {
        event.forEach(e => {
          let eventindex = 0;

          eventindex = events.findIndex(m => m.id == e.id);

          // if mood found => replace
          if (eventindex >= 0) {
            events[eventindex] = e;
          } else {
            events.push(e);
          }
        })
        this.events$.next(events);
      } else {
        this.events$.next(event);
      }

      if (this.isAuthenticated) {
        if (this.isOnline) {
          // ----- CALL TO DATABASE -----
          this.eventService.saveEvent(event, this.user$.value.id).subscribe((res) => {
            console.log(res);
          }, (err) => {
            if (err) {
              this.offlineChanges.events = true;
            }
          });
        }
        else {
          // --- REGISTER OFFLINE CHANGES ---
          // this.registerOfflineChanges({ events: true })
          this.offlineChanges.events = true;
        }
      }

      return this.storage.set("events", JSON.stringify(this.events$.value));
    } catch (e) {
      console.log("could not save event!");
    }
  }

  async saveCheckedMedOClock(moc: MedsOClock, tmId: string): Promise<null | void> {

    let allTodaysMeds = this.allTodaysMeds$.value;

    console.log("SAVING EINGENOMMEN IN STORAGE");
    console.log(JSON.stringify(allTodaysMeds));

    // if (!allTodaysMeds || !allTodaysMeds.length) {
    //   return this.createTodaysMeds();
    // }

    const index = allTodaysMeds.findIndex(atm => atm.date == moment().format("YYYY-MM-DD"));

    if (index >= 0) {
      console.log("FOUND TODAYS DATE");
      allTodaysMeds[index].medTime
        .find((mt) => mt.id == tmId)
        .medsOClock
        .find(mc => mc.id == moc.id).taken = true;

      console.log("ALL TODAYS MEDS AFTER UPDATE");
      console.log(JSON.stringify(allTodaysMeds[index].medTime));
      return this.saveTodaysMeds(allTodaysMeds[index]);
    }
    else
      return new Promise(null);
  }

  async saveTodaysMeds(todaysMed: TodaysMeds | TodaysMeds[]) {
    try {

      if (!Array.isArray(todaysMed)) todaysMed = [todaysMed]

      const allTodaysMeds = this.allTodaysMeds$.value ? this.allTodaysMeds$.value : [];

      todaysMed.forEach((tm: TodaysMeds) => {
        let tmIndex = 0;

        if(!allTodaysMeds.length){
          tmIndex = -1;
        } else {
          tmIndex = allTodaysMeds.findIndex(m => {
            return moment(m.date).format("YYYY-MM-DD") == moment(tm.date).format("YYYY-MM-DD");
          });
        }

        // if mood found => replace
        if (tmIndex >= 0) {
          allTodaysMeds[tmIndex] = tm 
        } else {
          allTodaysMeds.push(tm);
        }

      })

      if (this.isAuthenticated) {
        if (this.isOnline) {
          // ----------------------------
          // ----- CALL TO DATABASE -----
          // ------ SET dbIsLoading -----
          // ----------------------------
          this.data.saveTodaysMeds(todaysMed).subscribe((err) => {
            console.log("SAVING TodaysMeds TO DB:");
            console.log(JSON.stringify(err));
          }, err => {
            if (err) {
              this.offlineChanges.allTodaysMeds = true;
            }
          });
        }
        else {
          // --------------------------------
          // ------------- TO DO ------------
          // --- REGISTER OFFLINE CHANGES ---
          // --------------------------------
          this.offlineChanges.allTodaysMeds = true;
          // this.registerOfflineChanges({ allTodaysMeds: true })
        }
      }

      // console.log("ALL TODAYS MEDS AFTER SAVING TO STORAGE");
      // console.log(JSON.stringify(allTodaysMeds));

      this.storage.set("allTodaysMeds", JSON.stringify(allTodaysMeds)).then((atm) => {
        this.allTodaysMeds$.next(allTodaysMeds);
        return allTodaysMeds;
      });
    }
    catch (e) {
      console.log("SAVE TODAYS MEDS ERROR")
      console.log(e);
    }
  }
  async loadTodaysMeds() { }

  deleteEvent(event: Event) {
    let events = this.events$.value;

    const eventIndex = events.findIndex((e) => e.id == event.id);

    events.splice(eventIndex, 1);

    if (this.isAuthenticated) {
      if (this.isOnline) {
        // update Database
        this.eventService.deleteEvent(event).subscribe((res) => console.log("ERROR DELETING EVENT! SEE: \n" + res), err => {
          this.offlineChanges.events = true;
        })
      } else {
        // set offline status
        // this.registerOfflineChanges({ events: true })
        this.offlineChanges.events = true;
      }
    }

    this.events$.next(events);
    console.log(events);

    this.storage.set("events", JSON.stringify(events));
  }

  getDarkModeConfig(){
    return this.storage.get("darkMode");
  }

  saveDarkModeConfig(isDark){
    this.storage.set("darkMode", JSON.stringify({isDark: isDark}));
  }

  // documentation of offline changes
  registerOfflineChanges(changes) {
    if (!Array.isArray(changes)) changes = [changes]
    changes.forEach((c) => {
      this.offlineChanges[c.key] = c.val
    })
    this.storage.set("offlineChanges", JSON.stringify(this.offlineChanges));
  }

  // get all keys (user, moods, events) of changed variables
  getOfflineChanges(): string[] {

    return Object.keys(this.offlineChanges).filter((key) => this.offlineChanges[key]);
  }

  // updates offline changes to DB
  updateOfflineChanges(keys: string[]) {
    keys.forEach(k => {
      switch (k) {
        case "user":
          // call http request to AZ-Function to save localchanges to DB
          this.data.updateUser(this.user$.value).subscribe();
          break;
        case "moods":
          // call http request to AZ-Function to save localchanges to DB
          break;
        case "events":
          // TO DO !!
          // call http request to AZ-Function to save localchanges to DB
          break;
      }
    });

    // clear offline changes 
    this.clearOfflineChanges();
  }

  // clear offline Changes locally and in storage
  clearOfflineChanges() {
    Object.keys(this.offlineChanges).forEach(k => this.offlineChanges[k] = false)
    this.storage.set("offlineChanges", JSON.stringify(this.offlineChanges))
  }

  async setAuthStatus(status: string): Promise<any> {
    await this.registerGuest();
    return this.storage.set("auth-status", status);
  }

  getAuthStatus() {
    return this.storage.get("auth-status");
  }

  async removeItem(key) {
    return this.storage.remove(key);
  }

  async clearStorage(): Promise<void> {
    try {
      this.user$.next(null);
      this.moods$.next(null);
      this.events$.next(null);
      this.allTodaysMeds$.next(null);
      console.log("CLEARING OBSERVABLES DONE!!");
    } catch (e) { console.log("CLEARING STORAGE ERROR"); console.log(e) }

    return this.storage.clear();
  }
}
