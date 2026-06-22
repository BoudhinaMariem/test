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
import { from, Observable, of } from 'rxjs';
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
        const oauthCallback$ = this._keycloakService.isOAuthCallback()
            ? from(this._keycloakService.ensureReady())
            : of(false);

        return oauthCallback$.pipe(
            switchMap(() => this._authService.check()),
            switchMap((authenticated) => {
                if (authenticated) {
                    return of(true);
                }

                if (this._keycloakService.isAuthenticated()) {
                    this._keycloakService.syncLocalSession();
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
