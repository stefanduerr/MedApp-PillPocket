import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { from, defer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import { MedsOClock, MedTime, TakeMeds, TodaysMeds, User } from '../models/interfaces';
import { LocalStorageService } from './local-storage.service';


@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiRoot = environment.apiRoot;
  user: any;

  constructor(private httpClient: HttpClient, private notification: LocalNotifications, ) {

  }

  public getUser(): Observable<any> {
    const observable$ = defer(() => from(this.user));
    return observable$;
  }

  // check if the currently installed version is still valid
  public versionControll(version): Observable<any> {
    return this.httpClient.post(this.apiRoot + 'versioncontroll', { "id": version }, { responseType: "text" })
  }

  // get a list of all Medicines for this user
  getAllMedicine(): Observable<any> {
    return this.httpClient.get(this.apiRoot + 'load-medicine');
  }

  loadMedList(): Observable<any> {
    let param = { "offset": 0 }
    return this.httpClient.get(this.apiRoot + 'load-medlist', { params: param });
  }

  // get single, specific medicine object
  // --------- currently unsued! --------
  getMedicine(id: string): Observable<any> {
    return this.httpClient.post(this.apiRoot + 'load-medicine', { "id": id }, { responseType: "text" })
  }

  deleteMedicine(id: number, medName: string): Observable<any> {
    return this.httpClient.post(this.apiRoot + 'delete-medicine', { "id": id, "medName": medName }, { responseType: "text" });
  }

  // update medicine information
  // ---- currently unsued! ----
  updateMedicine(data): Observable<any> {
    return this.httpClient.post(this.apiRoot + 'update-medicine', data, { responseType: "text" });
  }

  loadUser(uid): Observable<any> {
    const data = {
      user: {
        id: uid
      },
      action: "load-user"
    }

    return this.httpClient.post(this.apiRoot + 'handle-user', data);
  }

  getUserNew(id) {
    let params = {
      user: { id: id },
      action: "load-user"
    }
    return this.httpClient.post(this.apiRoot + 'handle-user', params);
  }

  // BRAND NEW !
  updateUser(user: User): Observable<any> {
    let params = {
      user: user,
      action: "update-user"
    }
    return this.httpClient.post(this.apiRoot + 'handle-user', params);
  }
  saveTodaysMeds(todaysMed) : Observable<any>{
    let data = {
      todaysMeds: todaysMed[0],
      action: "update"
    }
    return this.httpClient.post(this.apiRoot + 'handle-todays-meds', data, {responseType: "text"});
  }
  loadTodaysMeds(date: string, userid: string) : Observable<any>{
    let data = {
      todaysMeds: {userid: userid, date: date},
      action: "load"
    }
    return this.httpClient.post(this.apiRoot + 'handle-todays-meds', data);
  }
}
