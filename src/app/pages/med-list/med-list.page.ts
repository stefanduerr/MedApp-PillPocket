import { Component, OnInit } from '@angular/core';
import { AlertController, IonRouterOutlet } from '@ionic/angular/';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MedInfoPage } from '../../components/med-info/med-info.page';
import { EditMedPage } from '../../components/edit-med/edit-med.page';
import { DataService } from '../../services/data.service';
import { MedService } from 'src/app/services/med.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { User, TakeMeds, MedsOClock, TodaysMeds } from 'src/app/models/interfaces';
import { ArchiveComponent } from 'src/app/components/archive/archive.component';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { NotificationService } from 'src/app/services/notification.service';


@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-MedList',
  templateUrl: 'med-list.page.html',
  styleUrls: ['med-list.page.scss']
})
export class MedListPage implements OnInit {

  result: any;
  takeMeds: TakeMeds[] = [];
  subTitle: string = "";
  archivedMeds: TakeMeds[] = [];
  user: User | null = null;

  constructor(
    public alertController: AlertController,
    private route: Router,
    public modalController: ModalController,
    public medService: MedService,
    private storage: LocalStorageService,
    private notifs: NotificationService,
  ) {
  }

  ngOnInit() {
    this.storage.user$.subscribe((user: User) => {
      if(user){
        this.user = user;
        try {
          this.takeMeds = user.takeMeds;
        } catch (e) {
          console.log("no takemeds")
        }
      }
    },
      err => { console.log("user / takemeds could not be loaded") });
  }

  async deleteMedicine(index) {
    this.user.takeMeds[index].active = false;

    const tmID = this.user.takeMeds[index].uid;

    // deletes medicine from alltodaysmeds
    await this.replaceAllTodaysMeds(tmID);

    this.user.takeMeds[index].medsOClock.forEach((moc) => {
      try{
        this.notifs.clearMedNotif(moc.id, this.user.takeMeds[index].regularity);
      } catch(e) {}
    })

    const res = await this.storage.saveMedicine(this.user.takeMeds[index])
  }

  async replaceAllTodaysMeds(tmID) {
    // find todaysMeds of today
    try{
      let todaysMedsArr = this.storage.allTodaysMeds$.value.filter((atm) => {
        return atm.date == moment().format("YYYY-MM-DD")
      })
      const todaysMeds: TodaysMeds = todaysMedsArr[0];
  
      const atmIndex = this.storage.allTodaysMeds$.value.indexOf(todaysMeds);
      const mtIndex = todaysMeds.medTime.findIndex((mt) => mt.id == tmID);
  
      todaysMeds.medTime.splice(mtIndex, 1);
  
      return this.storage.saveTodaysMeds(todaysMeds);
    } catch(e) {

    }
  }

  loadDeaktivatedMedicine() {
    this.archivedMeds = this.user.takeMeds.filter(m =>
      m.active === false
    );
  }

  async showArchiveAlert(index, $event) {
    // stop other parents-events
    $event.stopPropagation();

    const alert = await this.alertController.create({
      cssClass: 'alert-class',
      header: 'Achtung!',
      message: 'Möchtest du dieses Medikament und die dazugehörigen Infos archivieren?',
      buttons: [
        {
          text: 'Schließen',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (res) => { }
        },
        {
          text: 'Archivieren',
          handler: () => {
            this.deleteMedicine(index);
          }
        }
      ]
    });

    await alert.present();
  }


  async showArchive() {
    const modal = await this.modalController.create({
      component: ArchiveComponent,
      componentProps: {
        modal: this.modalController,
      },
      initialBreakpoint: 0.5,
      breakpoints: [0, 0.5, 1],
      showBackdrop: true,
      backdropDismiss: true,
      animated: true,
      swipeToClose: true,
    });
    return await modal.present();
  }

  nextpage() {
    this.route.navigate(['/tabs/moodDiary']);
  }

  async showInfo(doc: TakeMeds) {
    // stop other parents-events

    const infoModal = await this.modalController.create({
      component: MedInfoPage,

      componentProps: { med: doc, storage: this.storage, getDays: this.getSubTitleDays}
    });

    infoModal.present();
  }

  async openMedModal(doc: any, i: number, $event) {
    try {
      $event.stopPropagation();
    } catch (e) { }

    if (i < 0) { doc.uid = uuidv4(); doc.taken = false }

    const infoModal = await this.modalController.create({
      component: EditMedPage,

      componentProps: { med: doc as TakeMeds, index: i, storage: this.storage }
    });

    infoModal.present();
  }

  getSubTitleDays(med: TakeMeds) {
    let days = "";
    med.regularity.forEach((day, i) => {
      let str = "";
      if (i > 0 && i < med.regularity.length)
        str += " | ";

      switch (Number(day)) {
        case 0:
          str += "So";
          break;
        case 1:
          str += "Mo";
          break;
        case 2:
          str += "Di";
          break;
        case 3:
          str += "Mi";
          break;
        case 4:
          str += "Do";
          break;
        case 5:
          str += "Fr";
          break;
        case 6:
          str += "Sa";
          break;
      }
      days += str;
    });

    if (med.regularity.length >= 7) {
      return "täglich";
    } else {
      return days;
    }
  }
}
