import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, NavParams } from '@ionic/angular';
import { MedService } from '../../services/med.service';
import { FormBuilder, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { MedsOClock, TakeMeds, User } from 'src/app/models/interfaces';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-edit-med',
  templateUrl: './edit-med.page.html',
  styleUrls: ['./edit-med.page.scss'],
})
export class EditMedPage implements OnInit {
  // Params
  med: any = this.navParams.get('med'); //sendet Parameter von seite zu seite mit
  index: any = this.navParams.get('index');

  // storage variables
  storage: LocalStorageService = this.navParams.get('storage');
  takeMed: TakeMeds = this.med;
  user: User;

  test1: boolean = false;
  name: string = this.med.name;
  description: string = this.med.description;
  unit: string = this.med.unit;
  medsOClock = this.med.medsOClock;
  regularity = this.med.regularity;
  searchTerm: string;
  medForm: any;
  meds = [];
  values: string = '';
  text: string = '';
  vorschlaege = [];
  searchbarMinimized = false;
  iconType = "chevron-up-outline";
  customized = false;
  valid = false;
  daycheck = true;
  validAmount = true;
  amountCheck = true;

  options = ['Pille(n)', 'g', 'ml', 'EL', 'TL', 'Tropfen', 'custom'];

  //on what days the user takes his Meds
  repetitions = [0, 1, 2, 3, 4, 5, 6];
  currentSelected = this.med.unit;
  days = [
    {
      day: 1,
      checked: false,
      name: "Mo"
    },
    {
      day: 2,
      checked: false,
      name: "Di"
    },
    {
      day: 3,
      checked: false,
      name: "Mi"
    },
    {
      day: 4,
      checked: false,
      name: "Do"
    },
    {
      day: 5,
      checked: false,
      name: "Fr"
    },
    {
      day: 6,
      checked: false,
      name: "Sa"
    },
    {
      day: 0,
      checked: false,
      name: "So"
    }
  ];

  isSubmitted: boolean = false;

  constructor(
    public modalController: ModalController,
    public alertController: AlertController,
    private medService: MedService,
    private navParams: NavParams,
    private formBuilder: FormBuilder,
    public dataService: DataService,
    private notification: NotificationService
  ) { }

  get inputName() {
    return this.medForm.get('name');
  }

  get inputDescription() {
    return this.medForm.get('description');
  }

  ngOnInit() {
    this.medForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      unit: ['', [Validators.required]],
      description: []
    });
    // TO-DO: if Bedingung verbessern (vorher war !this.medsOClock, jetzt ist der array aber plötzlich nie null)
    if (!this.medsOClock[0].time) {
      this.medsOClock = [
        {
          id: moment().valueOf(),
          amount: '',
          time: moment().format(),
          taken: false
        },
      ];
    } else {
    }

    if (this.regularity.length == 7) {
      this.customized = false;
    } else {
      this.customized = true;
    }

    this.med.regularity.forEach((element: number) => {
      let index = element;
      if (index == 0) index = 7;
      this.days[index - 1].checked = true;
    });

    this.user = this.storage.user$.value;
  }

  // Suchfunktion, gibt Vorschläge von DB zurück
  async onKey() {
    if (this.name.length > 2) {
      let x = [];
      if (this.vorschlaege.length < 10) {
        this.meds = await this.fetchMedList();
        for (let i = 0; i < this.meds.length; i++) {
          if ((this.meds[i].Name.toLowerCase()).includes(this.name.toLowerCase())) {
            x.push(this.meds[i].Name);
          }
        }
      } else {
        for (let i = 0; i < this.vorschlaege.length; i++) {
          if ((this.vorschlaege[i].toLowerCase()).includes(this.name.toLowerCase())) {
            x.push(this.vorschlaege[i]);
          }
        }
      }

      this.vorschlaege = x;
    } else {
      this.vorschlaege = [];
      this.meds = [];
    }
  }

  minimizeResults() {
    if (this.searchbarMinimized) {
      this.searchbarMinimized = false;
      this.iconType = "chevron-up-outline"
    } else {
      this.searchbarMinimized = true;
      this.iconType = "chevron-down-outline"
    }
  }

  // Vorschläge der Suchfunktion werden automatisch eingetragen
  autocomplete(index) {
    this.name = this.vorschlaege[index];
    this.vorschlaege = [];
  }

  get errorControl() {
    return this.medForm.controls;
  }

  submitForm() {
    this.isSubmitted = true;
    this.valid = false;
    this.validAmount = true;

    for (let i = 0; i < this.medsOClock.length; i++) {
      if (this.medsOClock[i].amount == "") {
        this.validAmount = false;
      }
    }

    this.days.forEach((d) => {
      if (d.checked) {
        this.valid = true;
      }

    })

    if (!this.medForm.valid || !this.valid || !this.validAmount) {
      console.log('Please provide all the required values!');

      if (!this.valid) {
      this.daycheck = false;
    }

    if (!this.validAmount) {
      this.amountCheck = false;
    }
      return false;
    } else {
      this.saveMed();
      this.daycheck = true;
      this.amountCheck = true;
      this.valid = false;
      this.validAmount = true;
    }
  }


  chooseDays(everyday: boolean) {

    if (everyday) {
      this.customized = false;
      this.days.forEach((d) => {
        d.checked = true;
      })

    } else {

      /* this.daysAlert(); */
      this.customized = true;
      this.days.forEach((d) => {
        d.checked = false;
      })
    }
  }

  onChange(CValue: String) {
    CValue == "daily" ? this.chooseDays(true) : this.chooseDays(false);
  }

  test() {
    this.searchbarMinimized = false;
  }

  //shows Day Selection Alert
  // async daysAlert() {
  //   const selectDays = await this.alertController.create({
  //     header: 'Wochentage auswählen:',
  //     inputs: [
  //       {
  //         type: 'checkbox',
  //         label: 'Montag',
  //         value: 1
  //       },
  //       {
  //         type: 'checkbox',
  //         label: 'Dienstag',
  //         value: 2
  //       }, {
  //         type: 'checkbox',
  //         label: 'Mittwoch',
  //         value: 3
  //       },
  //       {
  //         type: 'checkbox',
  //         label: 'Donnerstag',
  //         value: 4
  //       },
  //       {
  //         type: 'checkbox',
  //         label: 'Freitag',
  //         value: 5
  //       },
  //       {
  //         type: 'checkbox',
  //         label: 'Samstag',
  //         value: 6
  //       },
  //       {
  //         type: 'checkbox',
  //         label: 'Sonntag',
  //         value: 0
  //       }
  //     ],
  //     buttons: [
  //       {
  //         text: 'Cancel',
  //         handler: () => {
  //           //
  //         },
  //       },
  //       {
  //         text: 'Ok',
  //         handler: (data) => {
  //           this.repetitions = data;
  //         },
  //       },
  //     ],
  //   });

  //   selectDays.present();
  // }

  async saveMed() {

    this.days = this.days.filter((d) => d.checked);
    let repetitions = [];

    this.days.forEach((d) => {
      repetitions.push(d.day);
    });

    //creates tm (takeMeds) variable from user input
    let tm: TakeMeds = {
      uid: this.takeMed.uid,
      description: this.medForm.value.description,
      unit: this.medForm.value.unit,
      name: this.medForm.value.name,
      medsOClock: this.medsOClock,
      active: true,
      regularity: repetitions
    };

    // clear and set notification
    this.medsOClock.forEach(moc => {
      try{
        this.notification.clearMedNotif(moc.id, this.regularity);
        this.notification.newCapNotif(tm);
      } catch(e) {}
    });

    //checks if each time/amount input is filled in
    for (let x: number = 0; x < this.medsOClock.length; x++) {
      if (!this.medsOClock[x].amount || !this.medsOClock[x].time) {
      }
    }

    if (this.medsOClock.length > 0) {

      // new Storage loading/saving/updating
      const result = await this.storage.saveMedicine(tm)
      // TO DO !!!
      // CHECK IF SAVING MEDICINE WORKED
    } else {
      //füll aus heast
    }
    this.close();
  }

  close() {
    this.modalController.dismiss();
  }

  deleteTime(i) {
    this.medsOClock.splice(i, 1);

    try{
      this.notification.clearMedNotif(this.medsOClock[i].id, this.regularity);
    } catch(e) {}
  }

  addTime() {
    let t = {
      id: moment().valueOf(),
      time: moment().format(),
      amount: '',
    };
    this.medsOClock.push(t);
  }

  selectChanged(selection) {
    this.currentSelected = selection;
    if (selection === 'custom') {
      this.addCustomOption();
    }
  }

  fetchMedList() {
    return this.medService.getMedSuggestions(this.name).toPromise();
  }
  selectDaily() {
    this.days.forEach((d) => {
      d.checked = true;
    })
  }
  deselectAll() {
    this.days.forEach((d) => {
      d.checked = false;
    })
  }


  async addCustomOption() {
    const inputAlert = await this.alertController.create({
      header: 'Eigene Einheit hinzufügen:',
      inputs: [{ type: 'text', placeholder: 'eigene Einheit', name: 'val' }],
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            this.currentSelected = '';
          },
        },
        {
          text: 'Ok',
          handler: (data) => {
            this.options.splice(this.options.length - 1, 0, data.val);
            this.currentSelected = data.val;
          },
        },
      ],
    });

    inputAlert.present();
  }
}
