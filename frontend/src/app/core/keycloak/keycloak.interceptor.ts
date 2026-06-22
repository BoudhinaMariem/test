import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { KeycloakService } from './keycloak.service';

@Injectable()
export class KeycloakAuthInterceptor implements HttpInterceptor {
    constructor(private _keycloakService: KeycloakService) {}

    intercept(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        return from(this._keycloakService.getToken()).pipe(
            switchMap((token) => {
                if (!token) {
                    return next.handle(request);
                }

                return next.handle(
                    request.clone({
                        setHeaders: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                );
            })
        );
    }
}