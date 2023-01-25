import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TakeMeds, User } from 'src/app/models/interfaces';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss'],
})
export class ArchiveComponent implements OnInit {
  // params passed in componentProsp
  @Input() modal: ModalController;
  archivedMeds: TakeMeds[] = [];
  user: User;

  constructor(private storage: LocalStorageService, public alertController: AlertController, private notifs: NotificationService) {
    this.storage.user$.subscribe((user) => {
      this.user = user;
      if(user.takeMeds){
        this.archivedMeds = user.takeMeds.filter((med) => !med.active);
      }
    })
  }

  ngOnInit() {}

  closeArchive(){
    this.modal.dismiss();
  }

  async activateMed(med: TakeMeds, index?: number){
    med.active = !med.active;

    // activate notifications
    try{
      this.notifs.newCapNotif(med);
    } catch(e) {}


    await this.storage.saveMedicine(med);
  }

  async finalDeleteMedicine(med: TakeMeds){

    const alert = await this.alertController.create({
      header: "Medikament unwiderruflich löschen",
      message: "Willst du dieses Medikament wirklich unwiderruflich löschen? Das kann nicht rückgängig gemacht werden!",
      buttons: [
        {
          text: "Abbrechen",
          handler: () => {return;}
        },
        {
          text: "Löschen",
          handler: async () => {
            const index = this.user.takeMeds.findIndex(m => m.uid == med.uid);

            this.user.takeMeds[index].medsOClock.forEach((moc) => {
              try{
                this.notifs.clearMedNotif(moc.id, med.regularity);
              } catch(e) {}
            })

            this.user.takeMeds.splice(index, 1);

            const res = await this.storage.updateUser(this.user);
            return;
          }
        }
      ]
    });

    await alert.present();
  }

}
