import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular/';
import { Router } from '@angular/router';
import { MoodService } from 'src/app/services/mood.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { Mood, MoodCat, User } from 'src/app/models/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@ionic/storage-angular';
import * as moment from 'moment';

@Component({
  selector: 'app-moodDiary',
  templateUrl: 'moodDiary.page.html',
  styleUrls: ['moodDiary.page.scss'],
})
export class MoodDiaryPage implements OnInit {
  index: number = 0;
  datem: any = "aaa"; // Variable, die dd/mm des Datums der letzten 5 Tage speichert
  fulldatem: Date[] = []; // Array, das die letzten 5 Tage im kompletten Datumsformat speichert
  currentDate: Date = new Date(); // dafür zuständig, das aktuell ausgewählte Datum zu speichern

  result: Mood | null = null;

  selectedVal = null; // speichert ausgewählte Mood des Users
  selectedDate = null;
  currMoodCat: any; // speichert aktuell ausgewähltes Mood-Objekt
  moodCats: any; // überprüft, ob mindestens ein Mood-Objekt vorhanden ist
  uuid: string = null;
  user: User | null = null;
  userid = null;

  constructor(
    public alertController: AlertController,
    private route: Router,
    private navCtrl: NavController,
    public mood: MoodService,
    private storage: LocalStorageService,
    private localStorage: Storage,
  ) {
  }

  ngOnInit() {

    this.storage.user$.subscribe(async (user) => {

      if (user) {
        this.user = user;
        this.userid = user.id;

        this.mood.loadjson().subscribe((result: MoodCat[]) => {

          if (user.moodCats && user.moodCats.length) {
            result.forEach((mC) => {
              const userMoodCat = user.moodCats.filter((userMC) => mC.id == userMC.id)[0]
              mC.isActive = userMoodCat.isActive;
            })
            this.moodCats = result.filter((m) => m.isActive);
          } else {
            this.moodCats = [];
          }

          if (this.moodCats.length) {
            this.currMoodCat = this.moodCats[0];
            this.loadMood();
            this.last5days();
          }
        });
      }
    });

  }

  // Funktion, die bei Klick auf einen Tag in der unteren Leiste die Moods für den jeweiligen Tag anzeigt. Übergibt einen Datum-Parameter.
  loadMoodDay(x) {
    this.currentDate = x;
    this.loadMood();
  }

  // Funktion, die bei Klick auf einen bestimmten Mood diesen speichert
  saveMood(val: number) {
    if (!this.uuid) {
      this.uuid = uuidv4();
    }

    if (this.selectedVal == val) {
      this.storage.deleteMood(this.uuid);
      this.selectedVal = null;
    } else {
      this.selectedVal = val;

      const date = moment(this.currentDate).format('YYYY-MM-DD');

      let m: Mood = {
        id: this.uuid,
        category: this.currMoodCat.id.toString(),
        title: this.currMoodCat.title.toString(),
        selectedVal: this.selectedVal.toString(),
        date: this.currentDate,
        userid: this.userid,
      }

      this.storage.saveMood(m).then((data) => { console.log("WORKED?:"); console.log(data) });
    }

  }

  // oft verwendet, lädt gespeicherte Moods je Kategorie, User und Datum. Weiters ist eine "loading"-Funktion integriert
  loadMood() {
    let id = this.uuid;
    let category = this.currMoodCat.id.toString();
    let date = this.currentDate;
    let loading = true;

    // "loading"-Funktion
    setTimeout(() => {
      if (loading) {
        document.getElementById('load').style.opacity = "50%";
      }
    }, 1000);

    this.storage.loadMood(category, date).then((res: Mood | null) => {
      // document.getElementById('load').style.opacity = "100%";
      loading = false;
      this.result = res;
      if (res) {
        this.uuid = this.result.id;
        this.selectedVal = res.selectedVal as number;
      } else {
        this.uuid = null;
        this.selectedVal = null;
      }
    })
  }

  // erstellt Arrays der letzten 5 Tage, die dann unten in der Leiste angezeigt werden
  last5days() {
    let today = new Date();
    let day: any;
    let l5d = [];
    let fulldatearray = [];

    for (let i = 0; i < 5; i++) {

      today.setDate(today.getDate() - 4 + i);
      today.toDateString();

      day = today.getDate();
      l5d.push(day);
      fulldatearray.push(today);
      today = new Date();
    }
    this.datem = l5d;
    this.fulldatem = fulldatearray;
  }

  // Für Navigation zuständig; bei Klick auf linken oder rechten Pfeil neben dem Titel wird die Moodkategorie gewechselt.
  moodnav(i) {
    if (this.index + i < 0) {
      this.index = this.moodCats.length - 1;
      this.currMoodCat = this.moodCats[this.index];
      this.loadMood();
    } else if (!(this.index + i > this.moodCats.length - 1)) {
      this.index = this.index + i;
      this.currMoodCat = this.moodCats[this.index];
      this.loadMood();
    } else {
      this.index = 0;
      this.currMoodCat = this.moodCats[this.index];
      this.loadMood();
    }

  }

  async navigateToStatistics() {
    await this.localStorage.set("storage", JSON.stringify(localStorage));
    this.route.navigate(['/tabs/mood-stats']);
    // this.route.navigate(['/mood-stats', storage]);
  }

}