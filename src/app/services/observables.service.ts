import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, of } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ObservablesService {
  private subject = new Subject<any>();
  private menuIsOpen$ = new BehaviorSubject<boolean>(false);
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);
  private isLogout$ = new BehaviorSubject<boolean>(false);
  private isSavingData$ = new BehaviorSubject<boolean>(false);
  private appIsOnline$: Observable<boolean>;
  public isDarkMode$ = new BehaviorSubject<boolean>(false);

  constructor() { this.initConnectivity() }

  initConnectivity(){
    if (!window || !navigator || !('onLine' in navigator)) return;

    this.appIsOnline$ = merge(
      of(null),
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).pipe(map(() => navigator.onLine))
  }

  getConnectivity(){
    return this.appIsOnline$;
  }

  getIsSavingData(){
    return this.isSavingData$;
  }

  setIsSavingData(saving: boolean){
    this.isSavingData$.next(saving);
  }

  getIsLogout(){
    return this.isLogout$;
  }

  setIsLogout(isLogout: boolean){
    this.isLogout$.next(isLogout);
  }

  getIsAuthenticated(){
    return this.isAuthenticated$;
  }

  setIsAuthenticated(isAuth: boolean){
    this.isAuthenticated$.next(isAuth);
  }

  getMenuIsOpen(){
    return this.menuIsOpen$;
  }

  setMenuIsOpen(isOpen: boolean){
    this.menuIsOpen$.next(isOpen);
  }

  sendMessage(message: any) {
      this.subject.next(message);
  }

  clearMessages() {
      this.subject.next();
  }

  getMessage(): Observable<any> {
      return this.subject.asObservable();
  }
}
