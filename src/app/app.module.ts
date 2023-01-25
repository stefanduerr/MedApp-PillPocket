import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthConfig, AuthModule } from '@auth0/auth0-angular';
import { clientId, domain, callbackUri } from './auth.config';
import { environment } from 'src/environments/environment';
import { IonicStorageModule } from '@ionic/storage-angular';

import { LocalNotifications} from '@ionic-native/local-notifications/ngx'
import { ArchiveComponent } from './components/archive/archive.component';
import { NgCalendarModule } from 'ionic2-calendar';

const config: AuthConfig = {
  domain,
  clientId,
  redirectUri: callbackUri,
  /* Uncomment the following lines for better support  in browers like Safari where third-party cookies are blocked.
    See https://auth0.com/docs/libraries/auth0-single-page-app-sdk#change-storage-options for risks.
  */
  cacheLocation: "localstorage",
  useRefreshTokens: true,
  //audience: "https://pillpocket.eu.auth0.com/api/v2/",
  httpInterceptor: {
    allowedList: [
      environment.apiRoot + '/*'
    ]
  }
};

@NgModule({
  declarations: [
    AppComponent,
    ArchiveComponent
  ],
  entryComponents: [],
  imports: [
    NgCalendarModule,
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule, 
    HttpClientModule, 
    AuthModule.forRoot(config), 
    ReactiveFormsModule,
    FormsModule,
    IonicStorageModule.forRoot(),
  ],
  providers: [{ provide: [RouteReuseStrategy, HTTP_INTERCEPTORS], useClass: IonicRouteStrategy, }, LocalNotifications],
  bootstrap: [
    AppComponent,
  ],
})
export class AppModule { }
