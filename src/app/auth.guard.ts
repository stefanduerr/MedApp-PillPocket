import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Storage } from '@ionic/storage-angular';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { LocalStorageService } from './services/local-storage.service';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {
  isAuthenticated = false;

  constructor(private auth: AuthService, private router: Router, private storage: LocalStorageService) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean | UrlTree> | boolean {
    return this.auth.isAuthenticated$.pipe(
      switchMap(loggedIn => {
        if (!loggedIn) {
          const res = from(this.storage.getAuthStatus());
          return res.pipe(
            map((res) => {
              if (res && res === "guest") {
                return true;
              } else {
                this.router.navigateByUrl("/login-register");
              }
            })
          )
        } else {
          return of(true);
        }
      })
    )
  }
}
