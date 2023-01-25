import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Mood } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class MoodService {
  private apiRoot = environment.apiRoot;


  constructor(private httpClient: HttpClient) {
    this.loadjson();
   }
  moodcategories: any;
  loadCategories() {

  }

  saveMood(mood: Mood | Mood[], uid) : Observable<any> {
    const data = {
      mood: mood,
      action: "save"
    }

    console.log(mood);
    return this.httpClient.post(this.apiRoot + 'handle-mood', data, {responseType:"text"});
  }

  loadMood(id, date, uid) : Observable<any> {
    const data = {
      mood: {
        userid: uid,
        id: id,
        date: date,
      },
      action: "load-single"
    }
    return this.httpClient.post(this.apiRoot + 'handle-mood', data);
    //return this.httpClient.post(this.apiRoot + 'load-mood', {"id": id, "date": date, "userid": uid}, {responseType:"json"})
  }

  deleteMood(moodId: number) : Observable<any> {
    const data = {
      mood: moodId,
      action: "delete"
    }

    return this.httpClient.post(this.apiRoot + 'handle-mood', data, {responseType:"text"});
  }

  loadLast5Moods(uid) : Observable<any>{
    // console.log("-- TEMP --")
    const date = new Date();
    const last = new Date(date.getTime() - (5 * 24 * 60 * 60 * 1000));
    const finalDate = last.getFullYear() + "-" + (last.getMonth() + 1) + "-" + last.getDate();
    // console.log("/-- TEMP --")

    const data = {
      mood: {
        userid: uid,
        date: finalDate,
      },
      action: "load-all"
    }
    //return this.httpClient.post(this.apiRoot + 'load-mood', {"id": uid, "type": "load-5"}, {responseType: "json"})
    return this.httpClient.post(this.apiRoot + 'handle-mood', data);
  }

  loadRangeMoods(date: string, uid: string | number) : Observable<any>{
    const data = {
      mood: {
        userid: uid.toString(),
        date: date,
      },
      action: "load-all"
    }
    //return this.httpClient.post(this.apiRoot + 'load-mood', {"id": uid, "type": "load-5"}, {responseType: "json"})
    return this.httpClient.post(this.apiRoot + 'handle-mood', data);
  }

  loadjson(): Observable<any> {
    /* return fetch('../../assets/moodjson/array.json'); */
    return this.httpClient.get('/assets/moodjson/array.json', {responseType: 'json'});
  }

}
