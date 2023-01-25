import { Component, OnInit, NgZone } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { catchError, filter, first, mergeMap } from 'rxjs/operators';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { callbackUri, returnTo } from './auth.config';

import { isPlatform, LoadingController, Platform } from '@ionic/angular';

import { from, of, Subscription, throwError } from 'rxjs';
import { SplashScreen } from '@capacitor/splash-screen';
import { Router } from '@angular/router';
import { LocalStorageService } from './services/local-storage.service';
import { DataService } from './services/data.service';
import { AlertController } from '@ionic/angular';
import { ObservablesService } from './services/observables.service';
import { NotificationService } from './services/notification.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { GenericError } from '@auth0/auth0-spa-js';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {

  messageSubscr: Subscription;
  isLoadingSub: Subscription;
  authRedirectSub: Subscription;

  isAuthenticated = false;
  isGuest: boolean = false;
  isLoading = false;
  darkTheme = false;

  loading: HTMLIonLoadingElement;

  loadingMessage = "Überprüfe Version";
  userProfile: User;
  deprecated: boolean = false;

  appPages = [
    // { title: 'Profil', url: '../tabs/homepage', condition: this.isGuest ? false : true, icon: 'person', action: () => { } },
    { title: 'Stimmungs Kategorien', url: '../mood-categories/', icon: 'cog', action: () => { } },
    { title: 'Profil', url: '../profil/', condition: this.isGuest ? false : true, icon: 'person-circle', action: () => { } },
    { title: 'Home', url: '../tabs/homepage', icon: 'home', action: () => { } },
  ]

  constructor(
    private platform: Platform,
    private auth: AuthService,
    private ngZone: NgZone,
    private router: Router,
    private storage: LocalStorageService,
    private data: DataService,
    public alertController: AlertController,
    private messageService: ObservablesService,
    private notifService: NotificationService,
    private loadingCtrl: LoadingController,
    private obs: ObservablesService,
  ) {

    this.isLoadingSub = this.storage.dbIsLoading$.subscribe((isLoading) => this.isLoading = isLoading);

    this.messageSubscr = this.messageService.getMessage().subscribe((message) => {
      if (message) {
        if (message.hasOwnProperty("isGuest")) {
          this.isGuest = message.isGuest;
          this.updateMenuLinks();
        }
      }
    })

    this.configLoadingCtrl();

    // check if device ready (only for IOS & Android)
    this.platform.ready().then(async () => {

      this.storage.getDarkModeConfig().then(async (data) => {

        if (data) {
          data = await JSON.parse(data)
          this.darkTheme = data.isDark;
          this.obs.isDarkMode$.next(data.isDark);
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
          this.toggleDarkMode(prefersDark.matches);
        }

      });

      try {
        // add listener to notifications
        this.notifService.addListener();

      } catch (e) { console.log(e) }


      if (isPlatform("ios") || isPlatform("android")) {
        SplashScreen.hide();

        // check authentication
        this.getAuth();

        // add listener to Application to check whether user is logging in or loggin out
        this.setAppUrlListener();

        //get local version
        App.getInfo().then((info) => {

          this.data.versionControll(info.version).subscribe((result: any) => {
            const androidLink = "https://play.google.com/store/apps/details?id=pillpocket.mobile.ps";
            const appleLink = "";
            let txt = "";

            if (result == "deprecated") {
              this.deprecated = true;
              txt = "Deine Version ist veraltet, bitte lade dir die neueste Version herunter um PillPocket weiter nutzen zu können. <br><br> <ion-button href=" + (isPlatform("android") ? androidLink : appleLink) + ">Zum Update</ion-button>";
              this.showVersionAlert(txt, false);
            } else if (result == "current") {
            }
            else if (result == "error") {
              txt = "Ooops! Es gibt leider ein Problem mit deiner Version. <br>Bitte deinstalliere PillPocket und lade die App vom Store erneut herunter. <br>Vergiss nicht vorher online zu gehen, um deine Daten in der Cloud zu sichern, falls du offline Änderungen getätigt hast!";
              this.showVersionAlert(txt, false);
              this.deprecated = true;
            } else {
              txt = "Eine neue Version von PillPocket ist verfügbar! Lade sie hier herunter. <br><br> <ion-button href=" + (isPlatform("android") ? androidLink : appleLink) + ">Zum Update</ion-button>";
              this.showVersionAlert(txt, true);
            }
          }, err => {
            console.log("ERROR ! NO DATABASE LINK");
            this.updateMenuLinks();
          });

        }).catch((err) => console.log(err))
      }
    })

  }

  openStore(){
    console.log("CALLED");
    window.open("https://play.google.com/store/apps/details?id=pillpocket.mobile.ps");
  }

  ngOnInit(): void {
    this.storage.getAuthStatus().then((status) => {
      if (status && status == "guest") {
        this.messageService.sendMessage({ isGuest: true });
      } else {
        this.messageService.sendMessage({ isGuest: false });
      }
      this.updateMenuLinks();
    })

    this.auth.error$.subscribe(() => console.log("ERROR CATCH!"), err => console.log("OOOOPS ! ERROR WHILE CATCHING!"));
  }

  async configLoadingCtrl(spinner?: string, message?: string) {
    return this.loading = await this.loadingCtrl.create({
      spinner: 'circles',
      cssClass: spinner ? spinner : 'loading-spinner',
      message: message ? message : 'Lade... Bitte warten. Dieser Prozess kann bis zu 10 Sekunden dauern',
      backdropDismiss: false,
      keyboardClose: true,
      showBackdrop: true,
    });
  }


  async getAuth() {

    await this.setLoadingStat(true, "Authentifiziere..")

    this.auth.user$.subscribe((user) => {
      this.userProfile = user
    });

    this.auth.isAuthenticated$.subscribe(async (isAuth) => {
      console.log("INSIDE AUTH SUBSCRIBE")

      if(isAuth){
        this.isAuthenticated = isAuth;
        this.obs.setIsAuthenticated(isAuth);
        await this.setLoadingStat(false);
      } else {
        console.log("NOT AUTHENTICATED ... GET ACCESS TOKEN SILENTLY")

        this.auth.getAccessTokenSilently().pipe(catchError(err => throwError(err))).subscribe(async (data) => {
          console.log("TOKEN SILENTLY:");
          console.log(JSON.stringify(data));

          if(data){
            this.obs.setIsAuthenticated(true);
            this.isAuthenticated = true;
          } else {
            this.obs.setIsAuthenticated(false);
            this.isAuthenticated = false;
          }

          await this.setLoadingStat(false);
        }, async (err) => {
          console.log("ERROR CAUGHT!")
          console.log(err);
          this.obs.setIsAuthenticated(false);
          this.isAuthenticated = false;
          await this.setLoadingStat(false);
        })
      }

      // this.storage.getAuthStatus().then((stat) => {
      //   if (stat && stat === "guest" && isAuth) {

      //     this.messageService.sendMessage({ isGuest: true });
      //     this.updateMenuLinks();
      //     this.storage.removeItem("auth-status");
      //     // check if user exists on DB
      //     // if yes -> don't upload
      //     this.showGuestAlert().then((res) => console.log("Alert Done!"));
      //   }
      //   else {
      //     if (!this.isAuthenticated && isAuth && stat !== "guest" && !this.isLoading && (!isPlatform("ios") && !isPlatform("android"))) {
      //       this.loadUserFromDB();
      //     }
      //   }
      //   this.isAuthenticated = isAuth;
      // }).catch((err) => console.log("--- ERROR --- : " + err))

    }, err => console.log(err))
  }

  setAppUrlListener() {
    // after redirecting backconsole.log("you shall not pass!"); to app => redirect to correct page
    App.addListener('appUrlOpen', ({ url }) => {
      // Must run inside an NgZone for Angular to pick up the changes
      // https://capacitorjs.com/docs/guides/angular
      this.ngZone.run(() => {
        console.log("INSIDE NG ZONE!!!");
        if (url?.startsWith(callbackUri || returnTo)) {

          // If the URL is an authentication callback URL..
          if (
            (url.includes('state=') &&
              url.includes('error=') || url.includes('code='))
          ) {

            try {
              // Call handleRedirectCallback and close the browser
              this.authRedirectSub = this.auth
                .handleRedirectCallback(url)
                .pipe(mergeMap(() => of(Browser.close().catch(err => console.log(err)))))
                .subscribe(() => {
                  this.auth.isAuthenticated$.subscribe(async (isLogin) => {
                    if (isLogin) {
                      this.authRedirectSub.unsubscribe();
                      this.obs.setIsAuthenticated(true);
                      this.isAuthenticated = isLogin;
                      this.notifService.clearAllMedNotif();

                      // if logged in => check if user was guest
                      this.storage.getAuthStatus().then((stat) => {

                        if (stat && stat === "guest") {
                          // this.messageService.sendMessage({ isGuest: true });
                          // this.updateMenuLinks();
                          this.storage.removeItem("auth-status");
                          this.showGuestAlert().then((res) => console.log("GUEST HANDLING DONE! ISAUTHENTICATED?: " + this.isAuthenticated));
                        }
                        else {
                          this.loadUserFromDB();
                        }

                      }).catch((err) => console.log("--- ERROR --- : " + err))
                      
                    }
                    else {
                      await this.router.navigateByUrl('/login-register');
                    }
                  }, err => console.log(err));
                }, err => console.log(err));

            } catch (e) {
              console.log(e);
              Browser.close().catch(err => { });
            }

          } else { Browser.close().catch(err => { }) }
        }
      });
    });
  }

  // when trying to logout => check if user has Internet connection
  async logoutAttempt() {
    if (navigator.onLine)
      this.logout();
    else
      this.connectionAlert();
  }

  // logout from auth0 & clear local data
  async logout() {

    console.log("LOGOUT FUNKTION AUFGERUFEN!")
    // set logout-observable to start logout process & stop all running subscriptions on pages
    this.obs.setIsLogout(true);

    // set Authenticated Observable to false
    this.obs.setIsAuthenticated(false);

    // set Loading Status & Alert
    await this.setLoadingStat(true, "Speichere Daten...");

    // remove notification listeners
    LocalNotifications.removeAllListeners().catch(err => console.log(err));

    // save data on current page before logout
    // TO DO !!
    this.obs.getIsSavingData().pipe(first(isd => !isd)).subscribe(async () => {

      console.log("STARTE LOGOUT!")

      // set Loading Status & Alert
      await this.setLoadingStat(true, "Du wirst abgemeldet...");

      // logout
      this.auth
        .buildLogoutUrl({ returnTo: returnTo })
        .pipe(
          mergeMap(async (url) => {
            // this.auth.logout({ returnTo: returnTo, federated: true })
            // this.auth.logout({localOnly: true})
            await Browser.open({ url, windowName: '_self' });
            this.auth.logout({ localOnly: true });

            this.obs.setIsLogout(false);

            // clear storage
            this.storage.clearStorage().then(async () => {

              await this.notifService.clearAllMedNotif();
              this.updateMenuLinks();
              await this.setLoadingStat(false);
              await this.router.navigateByUrl('/login-register')
            });

          })
        )
        .subscribe(() => {

        });
    })

  }

  async connectionAlert() {
    const alert = await this.alertController.create({
      header: 'Internet Verbindung',
      message: 'Bitte stelle sicher, dass du eine aktive Internet Verbindung hast um dich an- oder abzumelden und versuche es erneut!',
      buttons: [
        {
          text: "Ok",
          handler: () => { }
        },
      ]
    });

    await alert.present();
  }

  // logout Guest-User => remove Guest data
  async logoutGuest() {
    const alert = await this.alertController.create({
      header: 'Gast Daten löschen',
      message: 'WARNUNG! Wenn du dich aus deinem Gast Account ausloggst, werden all deine gespeicherten Daten unwiederruflich gelöscht! Willst du trotzdem fortfahren?',
      buttons: [
        {
          text: "Akzeptieren",
          handler: async () => {
            this.storage.clearStorage().then(async () => {
              this.messageService.sendMessage({ isGuest: false });
              this.updateMenuLinks();
              await this.router.navigateByUrl("/login-register");
            });
          }
        },
        {
          text: "Abbrechen",
          handler: () => { }
        }
      ]
    });

    await alert.present();
  }

  // if app version is depricated => show alert
  async showVersionAlert(txt: string, dismissable: boolean) {
    let message = txt;
    const alert = await this.alertController.create({
      header: 'Veraltete Version',
      message: message,
      backdropDismiss: false,
      buttons: !dismissable ? [] :
      [
        {
          text: "Okay",
          handler: () => {
            if(this.deprecated){
              window.open("https://play.google.com/store/apps/details?id=pillpocket.mobile.ps");

              if(!isPlatform("ios"))
                App.exitApp();
            }
            // if (this.deprecated && !isPlatform("ios")) {
            //   App.exitApp();
            // }
          }
        }
      ]
    });

    await alert.present();
  }

  // if guest wants to log-out (without login) => show alert
  async showGuestAlert() {
    const alert = await this.alertController.create({
      header: 'Gast Account Löschen',
      message: 'Da du dich soeben eingeloggt hast, wird dein Gast Account nun gelöscht. Möchtest du deine Gast-Daten hochladen (Daten überschreiben), oder sie verwerfen?',
      backdropDismiss: false,
      buttons: [
        {
          text: "überschreiben",
          handler: async () => {
            try {
              // set loading screen until overwriting is done
              await this.setLoadingStat(true, "Überschreibe Daten..");

              // set guest status to false & update menu items
              this.messageService.sendMessage({ isGuest: false });
              this.updateMenuLinks();

              // start process of overwriting cloud data with guest data
              // when done -> remove loading screen;
              this.storage.guestToUser().then(async () => {
                this.notifService.initNotifications();
                await this.setLoadingStat(false);
                await this.router.navigateByUrl("/tabs/homepage");
                console.log("uploaded guest to database!!!");
              });

            } catch (e) {
              console.log("could not upload guest to DB: ");
              console.log(JSON.stringify(e))
            }
          },
        },
        {
          text: "verwerfen",
          handler: async () => {

            // set loading screen until process is done
            await this.setLoadingStat(true, "Lösche Gast ... Lade Daten ...")

            // reset / clear guest data
            this.storage.clearStorage().then(async (res) => {
              await this.setLoadingStat(false);

              // set guest status to false & update menu items
              this.messageService.sendMessage({ isGuest: false });
              this.updateMenuLinks();

              // load and overwrite all local data with user-cloud-data
              // when finished -> remove loading screen
              this.loadUserFromDB();
            });

          }
        }
      ]
    });

    await alert.present();
  }

  ngOnDestroy() {
    this.messageSubscr.unsubscribe();
    this.platform.resume.unsubscribe();
    this.isLoadingSub.unsubscribe();
  }

  async setLoadingStat(setLoading: boolean, message?: string) {

    // dismiss already set loading-controller
    try { await this.loading.dismiss(); } catch (e) { }
    this.loading = null;

    // if setLoading = true => set Loading Controller
    if (setLoading) {
      await this.configLoadingCtrl(undefined, message ? message : undefined);
      await this.loading.present();
    }

  }

  updateMenuLinks() {
    const index = this.appPages.findIndex((ap) => ap.title === "Profil");

    this.appPages[index].condition = this.isGuest ? false : true;
    // this.appPages = this.appPages;
  }

  // currently unused!
  setMenuIsOpen(isOpen: boolean) {
    this.obs.setMenuIsOpen(isOpen);
  }

  toggleDarkMode(checked) {
    this.obs.isDarkMode$.next(checked);
    this.storage.saveDarkModeConfig(checked);
    this.darkTheme = checked;
  }

  async loadUserFromDB() {
    await this.setLoadingStat(true);
    this.storage.loadAllFromDatabase().then(async (res) => {
      this.notifService.initNotifications();
      await this.setLoadingStat(false);
      await this.router.navigateByUrl('/tabs');
    })
  }
}