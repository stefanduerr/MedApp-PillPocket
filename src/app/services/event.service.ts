import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Event } from 'src/app/models/interfaces';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiRoot = environment.apiRoot;

  constructor(private httpClient: HttpClient) {  }

  getUserEvents(userID) : Observable<any> {
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - (60 * 24 * 60 * 60 * 1000));
    console.log(fromDate);
    console.log(toDate);

    const data = {
      event: {
        userid: userID,
        fromDate: moment(fromDate).format(),
        toDate: moment(toDate).format()
      },
      action: "load-all"
    }
    return this.httpClient.post(this.apiRoot + 'handle-event', data); 
  }
  saveEvent(event, uid: string) : Observable<any> {
    event.userid = uid;

    const data = {
      event: event,
      action: "save"
    }

    return this.httpClient.post(this.apiRoot + 'handle-event', data, { responseType: "text" });
  }

  getCalendarMoods(userID) : Observable<any> {
    return this.httpClient.post(this.apiRoot + 'load-all-moods', {"userid": userID}); 
  }

  deleteEvent(event: Event) : Observable<any> {
    const data = {
      event: event,
      action: "delete"
    }

    return this.httpClient.post(this.apiRoot + 'handle-event', data, { responseType: "text" });
  }
}
