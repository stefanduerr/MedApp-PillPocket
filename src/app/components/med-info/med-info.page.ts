import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { TakeMeds } from 'src/app/models/interfaces';
import { MedListPage } from 'src/app/pages/med-list/med-list.page';

@Component({
  selector: 'app-med-info',
  templateUrl: './med-info.page.html',
  styleUrls: ['./med-info.page.scss'],
})
export class MedInfoPage implements OnInit {
  
  med: TakeMeds = this.navParams.get('med');
  times: number = 0;
  getDays: Function = this.navParams.get('getDays');
  days;
  totalAmount: number = 0;

  constructor(public modalController: ModalController, private navParams: NavParams ) { }

  ngOnInit() {
    this.med.medsOClock.forEach(m => {
      this.times++;
      this.totalAmount+=Number(m.amount);
    });
    this.days = this.getDays(this.med)
    
  }

  close() {
    this.modalController.dismiss();
  }
}
