import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { UserService } from 'app/core/user/user.service';

@Injectable()
export class AuthService
{
    private _authenticated = false;

    constructor(
        private _userService: UserService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    forgotPassword(email: string): Observable<any>
    {
        return of(true);
    }

    resetPassword(password: string): Observable<any>
    {
        return of(true);
    }

    signIn(credentials: { email: string; password: string }): Observable<any>
    {
        if (this._authenticated)
        {
            return throwError(() => new Error('User is already logged in.'));
        }

        if (credentials.email === 'admin@triweb.com' && credentials.password === 'admin')
        {
            const response = {
                accessToken: 'fake-access-token',
                user: {
                    id: 1,
                    name: 'Admin Triweb',
                    email: 'admin@triweb.com',
                    role: 'admin'
                }
            };

            this.accessToken = response.accessToken;
            this._authenticated = true;
            this._userService.user = response.user as any;

            return of(response);
        }

        return throwError(() => new Error('Wrong email or password'));
    }

    signInUsingToken(): Observable<any>
    {
        if (this.accessToken)
        {
            this._authenticated = true;

            this._userService.user = {
                id: 1,
                name: 'Admin Triweb',
                email: 'admin@triweb.com',
                role: 'admin'
            } as any;

            return of(true);
        }

        return of(false);
    }

    signOut(): Observable<any>
    {
        localStorage.removeItem('accessToken');
        this._authenticated = false;
        return of(true);
    }

    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any>
    {
        return of(true);
    }

    unlockSession(credentials: { email: string; password: string }): Observable<any>
    {
        return of(true);
    }

    check(): Observable<boolean>
    {
        if (this._authenticated)
        {
            return of(true);
        }

        if (!this.accessToken)
        {
            return of(false);
        }

        this._authenticated = true;

        this._userService.user = {
            id: 1,
            name: 'Admin Triweb',
            email: 'admin@triweb.com',
            role: 'admin'
        } as any;

        return of(true);
    }
}