import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import * as moment from 'moment';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
})
export class ProfilPage implements OnInit {
  user: User;

  constructor(private storage: LocalStorageService, private auth: AuthService) { }

  ngOnInit() {
    this.auth.user$.subscribe((user) => {
      if(user){
        this.user = user;
        console.log(user);
      }
    })
  }

  getDate(d: string | Date){
    const date = new Date(d);
    return moment(date).format("DD.MM.YYYY");
  }

}
