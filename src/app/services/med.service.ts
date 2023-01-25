import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedService {
  private apiRoot = environment.apiRoot;
  constructor(private httpClient: HttpClient) { }

  // save Medicine
  saveMedicine(medicine): Observable<any> {
    console.log(medicine);
    return this.httpClient.post(this.apiRoot + 'save-medicine', medicine, { responseType: "text" });
  }

  // get a list of all Medicines for this user
  getAllMedicine(): Observable<any> {
    return this.httpClient.get(this.apiRoot + 'load-medicine');
  }

  // get single, specific medicine object
  // --------- currently unsued! --------
  getMedicine(id: string): Observable<any> {
    return this.httpClient.post(this.apiRoot + 'load-medicine', { "id": id }, { responseType: "text" });
  }

  deleteMedicine(id: number): Observable<any> {
    return this.httpClient.post(this.apiRoot + 'delete-medicine', { "id": id }, { responseType: "text" });
  }

  // update medicine information
  // ---- currently unsued! ----
  updateMedicine(data): Observable<any> {
    return this.httpClient.post(this.apiRoot + 'update-medicine', data, { responseType: "text" });
  }

  getMedSuggestions(wurscht): Observable<any> {
    const param = {
      "meds": wurscht,
      "offset": "0"
    }
    return this.httpClient.post(this.apiRoot + 'load-medlist', param);
  }
}
