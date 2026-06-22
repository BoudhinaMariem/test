import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanActivateChild,
    CanLoad,
    Route,
    Router,
    RouterStateSnapshot,
    UrlSegment,
    UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AuthService } from 'app/core/auth/auth.service';
import { KeycloakService } from 'app/core/keycloak/keycloak.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
    constructor(
        private _authService: AuthService,
        private _router: Router,
        private _keycloakService: KeycloakService
    ) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        return this._check(redirectUrl);
    }

    canActivateChild(
        childRoute: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        return this._check(redirectUrl);
    }

    canLoad(
        route: Route,
        segments: UrlSegment[]
    ): Observable<boolean> | Promise<boolean> | boolean {
        return this._check('/triweb/dashboard');
    }

    private _check(redirectURL: string): Observable<boolean> {
        return this._authService.check().pipe(
            switchMap((authenticated) => {
                if (authenticated) {
                    return of(true);
                }

                if (this._keycloakService.isAuthenticated()) {
                    localStorage.setItem('accessToken', 'keycloak');

                    localStorage.setItem('user', JSON.stringify({
                        email: this._keycloakService.getUsername(),
                        name: this._keycloakService.getUsername(),
                        role: this._keycloakService.getRoles().join(', ')
                    }));

                    return of(true);
                }

                this._router.navigate(['sign-in'], {
                    queryParams: {
                        redirectURL
                    }
                });

                return of(false);
            })
        );
    }
}