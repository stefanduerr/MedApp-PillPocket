import { Component, OnDestroy, OnInit } from '@angular/core';
import { isPlatform, NavController } from '@ionic/angular';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { mergeMap } from 'rxjs/operators';

import { tap } from 'rxjs/operators';
import { returnTo } from 'src/app/auth.config';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { Router } from '@angular/router';
import { ObservablesService } from 'src/app/services/observables.service';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-login-register',
  templateUrl: './login-register.page.html',
  styleUrls: ['./login-register.page.scss'],
})
export class LoginRegisterPage {

  // user$ = this.auth.user$;
  // events$ = this.auth.events$;
  // sub: Subscription;
  // action: IAuthAction;
  isAuthenticatedSub: Subscription;
  isAuthenticated: boolean = false;
  isGuest: boolean = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private storage: LocalStorageService,
    private messageService: ObservablesService,
    private notifService: NotificationService,
  ) { }

  async getToken() {
    this.isAuthenticatedSub = this.auth.isAuthenticated$.subscribe((isAuth) => {
      this.isAuthenticated = isAuth

      this.storage.getAuthStatus().then((stat) => {
        if (stat && stat === "guest") {
          this.isGuest = true;
        } else this.isGuest = false;
      });
    }, err => console.log(err));
  }

  ngOnInit() {
    this.getToken();
  }

  ionViewDidLeave() {
    this.isAuthenticatedSub.unsubscribe();
  }

  login() {
    try {
      this.auth
        .buildAuthorizeUrl()
        .pipe(mergeMap((url) => Browser.open({ url, windowName: '_self' })))
        .subscribe(
          res => { },
          err => { if (err) console.log(err) }
        );

    } catch (e) {

    }
  }

  skipLogin() {
    this.storage.getAuthStatus().then((status) => {

      this.messageService.sendMessage({ isGuest: true });

      if (status === "guest") {

        this.router.navigateByUrl("/tabs")

      } else {

        this.storage.clearStorage().then(() => {

          this.storage.setAuthStatus("guest").then(() => {

            this.messageService.sendMessage({ isGuest: true });
            this.router.navigateByUrl("/tabs");

          }).catch((err) => { if (err) console.log(err) });

        });

      }
    })
  }
}
